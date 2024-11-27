#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use crate::state::StateManagerWrapper;

    #[tokio::test]
    async fn test_timeline_manager_creation() -> napi::Result<()> {
        let state_manager = StateManagerWrapper::new(None)?;
        let state_manager = Arc::new(Mutex::new(state_manager));
        let manager = TimelineManager::new(state_manager);
        
        assert!(!manager.is_playing);
        assert!(!manager.is_paused);
        assert_eq!(manager.current_time, 0.0);
        Ok(())
    }

    #[tokio::test]
    async fn test_timeline_state_sync() -> napi::Result<()> {
        let state_manager = StateManagerWrapper::new(None)?;
        let state_manager = Arc::new(Mutex::new(state_manager));
        let mut manager = TimelineManager::new(state_manager.clone());

        let config = AnimationConfig::new(1.0, 0.0, "linear".to_string());
        manager.start_animation("test".to_string(), config).await?;
        manager.update(0.016).await?; // One frame at 60fps

        // Verify state is updated
        let state = state_manager.lock().await;
        let pos = state.get_position("test".to_string())?;
        assert!(pos.is_some());

        Ok(())
    }

    #[tokio::test]
    async fn test_timeline_animation_control() -> napi::Result<()> {
        let state_manager = StateManagerWrapper::new(None)?;
        let state_manager = Arc::new(Mutex::new(state_manager));
        let mut manager = TimelineManager::new(state_manager);

        // Test animation start
        let config = AnimationConfig::new(1.0, 0.0, "linear".to_string());
        manager.start_animation("test".to_string(), config).await?;
        assert!(manager.is_playing);

        // Test animation pause
        manager.pause_animation("test".to_string()).await?;
        assert!(manager.is_paused);

        // Test animation resume
        manager.resume_animation("test".to_string()).await?;
        assert!(!manager.is_paused);

        // Test animation stop
        manager.stop_animation("test".to_string()).await?;
        assert!(!manager.is_playing);

        Ok(())
    }

    #[tokio::test]
    async fn test_timeline_cleanup() -> napi::Result<()> {
        let state_manager = StateManagerWrapper::new(None)?;
        let state_manager = Arc::new(Mutex::new(state_manager));
        let mut manager = TimelineManager::new(state_manager);

        // Initialize and start animation
        let config = AnimationConfig::new(1.0, 0.0, "linear".to_string());
        manager.start_animation("test".to_string(), config).await?;

        // Cleanup
        manager.cleanup().await?;
        assert!(!manager.is_playing);
        assert!(!manager.is_paused);
        assert_eq!(manager.current_time, 0.0);

        Ok(())
    }
}
