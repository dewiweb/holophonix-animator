#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::AnimatorState;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use tokio::time::{sleep, Duration};

    fn create_test_state() -> Arc<RwLock<AnimatorState>> {
        Arc::new(RwLock::new(AnimatorState::default()))
    }

    #[tokio::test]
    async fn test_recovery_config_default() {
        let config = RecoveryConfig::default();
        assert_eq!(config.max_retries, 3);
        assert_eq!(config.retry_delay_ms, 100);
        assert_eq!(config.rollback_depth, 5);
        assert_eq!(config.safe_mode_timeout_ms, 300000);
    }

    #[tokio::test]
    async fn test_recovery_manager_new() {
        let state = create_test_state();
        let manager = RecoveryManager::new(state);
        assert_eq!(manager.retry_count, 0);
        assert!(manager.safe_mode_start.is_none());
    }

    #[tokio::test]
    async fn test_safe_mode_enter_exit() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state.clone());

        // Test entering safe mode
        manager.enter_safe_mode().await.expect("Failed to enter safe mode");
        assert!(manager.safe_mode_start.is_some());
        {
            let state_guard = state.read().await;
            assert!(state_guard.is_safe_mode());
        }

        // Test exiting safe mode
        manager.exit_safe_mode().await.expect("Failed to exit safe mode");
        assert!(manager.safe_mode_start.is_none());
        {
            let state_guard = state.read().await;
            assert!(!state_guard.is_safe_mode());
        }
    }

    #[tokio::test]
    async fn test_should_exit_safe_mode() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);

        // Initially should not exit safe mode
        assert!(!manager.should_exit_safe_mode());

        // Enter safe mode
        manager.enter_safe_mode().await.expect("Failed to enter safe mode");
        assert!(!manager.should_exit_safe_mode());

        // Modify timeout for testing
        manager.config.safe_mode_timeout_ms = 100;
        
        // Wait for timeout
        sleep(Duration::from_millis(150)).await;
        assert!(manager.should_exit_safe_mode());
    }

    #[tokio::test]
    async fn test_recovery_manager_reset() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);

        // Set some state
        manager.retry_count = 2;
        manager.enter_safe_mode().await.expect("Failed to enter safe mode");
        assert!(manager.safe_mode_start.is_some());

        // Reset
        manager.reset();
        assert_eq!(manager.retry_count, 0);
        assert!(manager.safe_mode_start.is_none());
    }

    #[tokio::test]
    async fn test_recovery_manager_configure() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);

        let new_config = RecoveryConfig {
            max_retries: 5,
            retry_delay_ms: 200,
            rollback_depth: 10,
            safe_mode_timeout_ms: 600000,
        };

        manager.configure(new_config.clone());
        assert_eq!(manager.config.max_retries, new_config.max_retries);
        assert_eq!(manager.config.retry_delay_ms, new_config.retry_delay_ms);
        assert_eq!(manager.config.rollback_depth, new_config.rollback_depth);
        assert_eq!(manager.config.safe_mode_timeout_ms, new_config.safe_mode_timeout_ms);
    }

    #[tokio::test]
    async fn test_handle_error() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);

        // Test state error handling
        let state_error = AnimatorError::state_error("Test state error");
        manager.handle_error(&state_error).await.expect("Failed to handle state error");
        assert_eq!(manager.retry_count, 1);

        // Test resource error handling
        let resource_error = AnimatorError::resource_error("Test resource error");
        manager.handle_error(&resource_error).await.expect("Failed to handle resource error");
        assert_eq!(manager.retry_count, 1); // Should not increment for resource errors

        // Test validation error handling
        let validation_error = AnimatorError::validation_error("Test validation error");
        manager.handle_error(&validation_error).await.expect("Failed to handle validation error");
        assert!(manager.safe_mode_start.is_some());

        // Test execution error handling
        let execution_error = AnimatorError::execution_error("Test execution error");
        manager.handle_error(&execution_error).await.expect("Failed to handle execution error");
        assert_eq!(manager.retry_count, 2);

        // Test sync error handling
        let sync_error = AnimatorError::sync_error("Test sync error");
        manager.handle_error(&sync_error).await.expect("Failed to handle sync error");
        assert_eq!(manager.retry_count, 2); // Should not increment for sync errors
    }

    #[tokio::test]
    async fn test_handle_error_state() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);
        
        let error = AnimatorError::StateError("Test state error".to_string());
        let strategy = manager.handle_error(&error).await.expect("Failed to handle error");
        
        assert!(matches!(strategy, RecoveryStrategy::Retry));
        assert_eq!(manager.retry_count, 1);
    }

    #[tokio::test]
    async fn test_handle_error_resource() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);
        
        let error = AnimatorError::ResourceError("Test resource error".to_string());
        let strategy = manager.handle_error(&error).await.expect("Failed to handle error");
        
        assert!(matches!(strategy, RecoveryStrategy::Retry));
    }

    #[tokio::test]
    async fn test_handle_error_validation() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);
        
        let error = AnimatorError::ValidationError("Test validation error".to_string());
        let strategy = manager.handle_error(&error).await.expect("Failed to handle error");
        
        assert!(matches!(strategy, RecoveryStrategy::Rollback));
    }

    #[tokio::test]
    async fn test_handle_error_execution() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);
        
        let error = AnimatorError::ExecutionError("Test execution error".to_string());
        let strategy = manager.handle_error(&error).await.expect("Failed to handle error");
        
        assert!(matches!(strategy, RecoveryStrategy::SafeMode));
        assert!(manager.safe_mode_start.is_some());
    }

    #[tokio::test]
    async fn test_retry_limit_exceeded() {
        let state = create_test_state();
        let mut manager = RecoveryManager::new(state);
        let error = AnimatorError::StateError("Test state error".to_string());

        // Simulate multiple retries
        for _ in 0..manager.config.max_retries {
            let _ = manager.handle_error(&error).await.expect("Failed to handle error");
        }

        // One more error should trigger safe mode
        let strategy = manager.handle_error(&error).await.expect("Failed to handle error");
        assert!(matches!(strategy, RecoveryStrategy::SafeMode));
        assert!(manager.safe_mode_start.is_some());
    }
}
