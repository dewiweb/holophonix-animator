use async_trait::async_trait;
use std::{
    collections::HashMap,
    sync::Arc,
};
use tokio::sync::Mutex;

use crate::{
    animation::{AnimationConfig, AnimationEngine, AnimationType},
    error::AnimatorError,
    osc::{OSCConfig, OSCManager, OSCMessage, OSCMessageArg},
    plugin::{AnimationModel, PluginConfig, PluginManager},
    monitoring::PerformanceMonitor,
    recovery::{RecoveryConfig, RecoveryManager, RecoveryStrategy},
    state::{Position, StateManager},
};

// Mock plugin for testing
#[derive(Debug)]
struct MockAnimationModel {
    state: HashMap<String, f64>,
}

#[async_trait]
impl crate::plugin::AnimationModel for MockAnimationModel {
    async fn initialize(&mut self) -> Result<(), AnimatorError> {
        self.state.insert("test".to_string(), 0.0);
        Ok(())
    }

    async fn calculate_frame(&mut self, delta_time: f64) -> Result<(), AnimatorError> {
        let current = self.state.get("test").unwrap_or(&0.0);
        self.state.insert("test".to_string(), current + delta_time);
        Ok(())
    }

    async fn cleanup(&mut self) -> Result<(), AnimatorError> {
        self.state.clear();
        Ok(())
    }
}

#[tokio::test]
async fn test_core_components_integration() -> Result<(), AnimatorError> {
    // Initialize components
    let performance_monitor = Arc::new(Mutex::new(crate::monitoring::PerformanceMonitor::new()));
    let recovery_manager = Arc::new(Mutex::new(crate::recovery::RecoveryManager::new(crate::recovery::RecoveryConfig {
        max_retries: 3,
        retry_delay_ms: 100,
        safe_mode_timeout_ms: 1000,
    })));
    
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_state"))?));
    let plugin_manager = Arc::new(Mutex::new(crate::plugin::PluginManager::new(crate::plugin::PluginConfig {
        plugin_dir: std::env::temp_dir().join("plugins"),
        auto_reload: true,
    })));

    // Register mock plugin
    let mock_model = Box::new(MockAnimationModel {
        state: HashMap::new(),
    });
    plugin_manager.lock().await.register_model("mock", mock_model)?;

    // Create animation engine
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    
    // Test initialization
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Test animation creation and control
    {
        let mut engine = engine.lock().await;
        let config = AnimationConfig {
            duration_ms: 1000,
            animation_type: AnimationType::Linear,
            repeat: false,
            repeat_count: None,
            reverse: false,
            delay_ms: 0,
        };
        engine.start_animation("test_animation".to_string(), config).await?;
        engine.process_frame(16.0).await?; // Simulate one frame at 60fps
        engine.pause_animation("test_animation".to_string()).await?;
        engine.resume_animation("test_animation".to_string()).await?;
        engine.stop_animation("test_animation".to_string()).await?;
    }

    // Cleanup
    {
        let mut engine = engine.lock().await;
        engine.cleanup().await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_animation_lifecycle() -> Result<(), AnimatorError> {
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_lifecycle"))?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));

    // Initialize
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Create multiple animations
    {
        let mut engine = engine.lock().await;
        
        // Linear animation
        let linear_config = AnimationConfig {
            duration_ms: 1000,
            animation_type: AnimationType::Linear,
            repeat: false,
            repeat_count: None,
            reverse: false,
            delay_ms: 0,
        };
        engine.start_animation("linear".to_string(), linear_config).await?;

        // Ease in-out animation with repeat
        let ease_config = AnimationConfig {
            duration_ms: 2000,
            animation_type: AnimationType::EaseInOut,
            repeat: true,
            repeat_count: Some(3),
            reverse: false,
            delay_ms: 100,
        };
        engine.start_animation("ease".to_string(), ease_config).await?;

        // Process multiple frames
        for _ in 0..10 {
            engine.process_frame(16.0).await?;
        }

        // Verify animations are running
        let metrics = engine.get_performance_metrics().await?;
        assert!(metrics.active_animations > 0);

        // Stop all animations
        engine.stop_animation("linear".to_string()).await?;
        engine.stop_animation("ease".to_string()).await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_error_recovery_integration() -> Result<(), AnimatorError> {
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_recovery"))?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    let recovery_manager = Arc::new(Mutex::new(crate::recovery::RecoveryManager::new(crate::recovery::RecoveryConfig {
        max_retries: 3,
        retry_delay_ms: 100,
        safe_mode_timeout_ms: 1000,
    })));

    // Initialize
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Test error recovery scenarios
    {
        let mut engine = engine.lock().await;
        let mut recovery = recovery_manager.lock().await;

        // Simulate state error
        let state_error = AnimatorError::state_error("Test state error");
        recovery.handle_error(&state_error, crate::recovery::RecoveryStrategy::RetryWithBackoff).await?;

        // Simulate resource error
        let resource_error = AnimatorError::resource_error("Test resource error");
        recovery.handle_error(&resource_error, crate::recovery::RecoveryStrategy::SafeMode).await?;

        // Test engine error handling
        engine.handle_error(state_error).await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_performance_monitoring() -> Result<(), AnimatorError> {
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_perf"))?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    let monitor = Arc::new(Mutex::new(crate::monitoring::PerformanceMonitor::new()));

    // Initialize
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Create test animations
    {
        let mut engine = engine.lock().await;
        
        // Create multiple animations to stress test
        for i in 0..5 {
            let config = AnimationConfig {
                duration_ms: 1000,
                animation_type: AnimationType::Linear,
                repeat: true,
                repeat_count: Some(2),
                reverse: false,
                delay_ms: i * 100,
            };
            engine.start_animation(format!("test_{}", i), config).await?;
        }

        // Process frames while monitoring performance
        for _ in 0..20 {
            let start = std::time::Instant::now();
            engine.process_frame(16.0).await?;
            
            let mut monitor = monitor.lock().await;
            monitor.record_frame_time(start.elapsed());
            monitor.update_metrics().await?;
            
            let metrics = monitor.get_metrics().await?;
            assert!(metrics.frame_time_ms > 0.0);
            assert!(metrics.memory_usage_kb > 0);
        }

        // Cleanup
        engine.cleanup().await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_state_persistence() -> Result<(), AnimatorError> {
    let state_dir = std::env::temp_dir().join("test_persistence");
    let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir.clone())?));
    
    // Test state operations
    {
        let mut state = state_manager.lock().await;
        
        // Save initial state
        state.save_state().await?;

        // Modify state
        let position = Position::new(1.0, 2.0, 3.0, 45.0);
        state.update_position("test_object", position).await?;
        
        // Save modified state
        state.save_state().await?;

        // Load default state
        state.load_default_state().await?;

        // Restore checkpoint
        state.restore_checkpoint().await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_animation_patterns() -> Result<(), AnimatorError> {
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_patterns"))?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));

    // Initialize
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Test different animation patterns
    {
        let mut engine = engine.lock().await;

        // Linear movement
        let linear_config = AnimationConfig {
            duration_ms: 1000,
            animation_type: AnimationType::Linear,
            repeat: false,
            repeat_count: None,
            reverse: false,
            delay_ms: 0,
        };
        engine.start_animation("linear_pattern".to_string(), linear_config).await?;

        // Circular movement
        let circular_config = AnimationConfig {
            duration_ms: 2000,
            animation_type: AnimationType::Custom("circular".to_string()),
            repeat: true,
            repeat_count: Some(2),
            reverse: false,
            delay_ms: 0,
        };
        engine.start_animation("circular_pattern".to_string(), circular_config).await?;

        // Process frames
        for _ in 0..30 {
            engine.process_frame(16.0).await?;
        }

        // Cleanup
        engine.cleanup().await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_concurrent_animations() -> Result<(), AnimatorError> {
    let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::temp_dir().join("test_concurrent"))?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));

    // Initialize
    {
        let mut engine = engine.lock().await;
        engine.initialize().await?;
    }

    // Create multiple concurrent animations
    {
        let mut engine = engine.lock().await;

        let configs = vec![
            ("anim1", AnimationConfig {
                duration_ms: 1000,
                animation_type: AnimationType::Linear,
                repeat: false,
                repeat_count: None,
                reverse: false,
                delay_ms: 0,
            }),
            ("anim2", AnimationConfig {
                duration_ms: 2000,
                animation_type: AnimationType::EaseInOut,
                repeat: true,
                repeat_count: Some(2),
                reverse: false,
                delay_ms: 100,
            }),
            ("anim3", AnimationConfig {
                duration_ms: 1500,
                animation_type: AnimationType::Quadratic,
                repeat: false,
                repeat_count: None,
                reverse: true,
                delay_ms: 50,
            }),
        ];

        // Start all animations
        for (id, config) in configs {
            engine.start_animation(id.to_string(), config).await?;
        }

        // Process frames
        for _ in 0..50 {
            engine.process_frame(16.0).await?;
        }

        // Verify metrics
        let metrics = engine.get_performance_metrics().await?;
        assert!(metrics.active_animations > 0);
        assert!(metrics.frame_time_ms > 0.0);

        // Cleanup
        engine.cleanup().await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_napi_state_manager_interaction() -> Result<(), AnimatorError> {
    let state_dir = std::env::temp_dir().join("test_napi_state");
    let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir.clone())?));
    
    // Test state updates through NAPI bridge
    {
        let mut state = state_manager.lock().await;
        
        // Create test position through NAPI
        let position = Position::new(1.0, 2.0, 3.0, 45.0);
        state.update_position("test_source", position).await?;
        
        // Verify position was updated correctly
        let updated_pos = state.get_position("test_source").await?;
        assert_eq!(updated_pos.x, 1.0);
        assert_eq!(updated_pos.y, 2.0);
        assert_eq!(updated_pos.z, 3.0);
        assert_eq!(updated_pos.orientation, 45.0);
        
        // Test batch updates
        let mut updates = HashMap::new();
        updates.insert("source1".to_string(), Position::new(1.0, 1.0, 1.0, 0.0));
        updates.insert("source2".to_string(), Position::new(2.0, 2.0, 2.0, 90.0));
        
        state.batch_update_positions(updates).await?;
    }

    Ok(())
}

#[tokio::test]
async fn test_osc_animation_engine_interaction() -> Result<(), AnimatorError> {
    let state_dir = std::env::temp_dir().join("test_osc_anim");
    let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir.clone())?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    
    // Initialize OSC
    let osc_config = OSCConfig {
        input_port: 7000,
        output_port: 7001,
        address: "127.0.0.1".to_string(),
    };
    
    let osc_manager = Arc::new(Mutex::new(OSCManager::new(osc_config)?));
    
    // Test OSC message triggering animation
    {
        let engine_clone = engine.clone();
        let mut engine = engine.lock().await;
        let mut osc = osc_manager.lock().await;
        
        // Register OSC handler
        osc.register_handler("/source/1/position", move |msg| {
            let x = msg.args[0].as_f32()?;
            let y = msg.args[1].as_f32()?;
            let z = msg.args[2].as_f32()?;
            
            let position = Position::new(x as f64, y as f64, z as f64, 0.0);
            let config = AnimationConfig {
                duration_ms: 1000,
                animation_type: AnimationType::EaseInOut,
                repeat: false,
                repeat_count: None,
                reverse: false,
                delay_ms: 0,
            };
            
            tokio::spawn(async move {
                let mut engine = engine_clone.lock().await;
                engine.start_animation("source1".to_string(), config).await?;
                Ok::<(), AnimatorError>(())
            });
            
            Ok(())
        })?;
        
        // Simulate OSC message
        osc.handle_message(OSCMessage {
            address: "/source/1/position".to_string(),
            args: vec![
                OSCMessageArg::Float(1.0),
                OSCMessageArg::Float(2.0),
                OSCMessageArg::Float(3.0),
            ],
        }).await?;
        
        // Verify animation was started
        let metrics = engine.get_performance_metrics().await?;
        assert!(metrics.active_animations > 0);
    }

    Ok(())
}

#[tokio::test]
async fn test_state_animation_bridge_interaction() -> Result<(), AnimatorError> {
    let state_dir = std::env::temp_dir().join("test_state_anim");
    let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir.clone())?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    
    // Test animation affecting state through bridge
    {
        let mut engine = engine.lock().await;
        let mut state = state_manager.lock().await;
        
        // Set initial position
        let initial_pos = Position::new(0.0, 0.0, 0.0, 0.0);
        state.update_position("test_source", initial_pos).await?;
        
        // Create animation
        let config = AnimationConfig {
            duration_ms: 1000,
            animation_type: AnimationType::Linear,
            repeat: false,
            repeat_count: None,
            reverse: false,
            delay_ms: 0,
        };
        
        engine.start_animation("test_source".to_string(), config).await?;
        
        // Process multiple frames
        for _ in 0..10 {
            engine.process_frame(16.0).await?;
            
            // Verify state is being updated
            let current_pos = state.get_position("test_source").await?;
            assert!(current_pos.x != 0.0 || current_pos.y != 0.0 || current_pos.z != 0.0);
        }
    }

    Ok(())
}

#[tokio::test]
async fn test_full_component_interaction() -> Result<(), AnimatorError> {
    // Initialize all components
    let state_dir = std::env::temp_dir().join("test_full");
    let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir.clone())?));
    let engine = Arc::new(Mutex::new(AnimationEngine::new(state_manager.clone())?));
    let osc_manager = Arc::new(Mutex::new(OSCManager::new(OSCConfig {
        input_port: 7002,
        output_port: 7003,
        address: "127.0.0.1".to_string(),
    })?));
    
    // Test complete workflow
    {
        let engine_clone = engine.clone();
        let state_clone = state_manager.clone();
        let mut engine = engine.lock().await;
        let mut state = state_manager.lock().await;
        let mut osc = osc_manager.lock().await;
        
        // 1. Set up initial state
        let initial_pos = Position::new(0.0, 0.0, 0.0, 0.0);
        state.update_position("source1", initial_pos).await?;
        
        // 2. Register OSC handler that triggers animation
        osc.register_handler("/source/1/animate", move |msg| {
            let target_x = msg.args[0].as_f32()?;
            let target_y = msg.args[1].as_f32()?;
            let target_z = msg.args[2].as_f32()?;
            
            let config = AnimationConfig {
                duration_ms: 2000,
                animation_type: AnimationType::EaseInOut,
                repeat: false,
                repeat_count: None,
                reverse: false,
                delay_ms: 0,
            };
            
            let engine = engine_clone.clone();
            let state = state_clone.clone();
            tokio::spawn(async move {
                let mut engine = engine.lock().await;
                let mut state = state.lock().await;
                
                engine.start_animation("source1".to_string(), config).await?;
                
                // Update target position in state
                let target_pos = Position::new(target_x as f64, target_y as f64, target_z as f64, 0.0);
                state.update_position("source1_target", target_pos).await?;
                
                Ok::<(), AnimatorError>(())
            });
            
            Ok(())
        })?;
        
        // 3. Simulate OSC message
        osc.handle_message(OSCMessage {
            address: "/source/1/animate".to_string(),
            args: vec![
                OSCMessageArg::Float(5.0),
                OSCMessageArg::Float(5.0),
                OSCMessageArg::Float(5.0),
            ],
        }).await?;
        
        // 4. Process animation frames
        for _ in 0..20 {
            engine.process_frame(16.0).await?;
            
            // 5. Verify state updates
            let current_pos = state.get_position("source1").await?;
            let target_pos = state.get_position("source1_target").await?;
            
            // Ensure we're moving towards target
            assert!(current_pos.x <= target_pos.x);
            assert!(current_pos.y <= target_pos.y);
            assert!(current_pos.z <= target_pos.z);
            
            // 6. Send OSC updates
            osc.send_message(OSCMessage {
                address: "/source/1/position".to_string(),
                args: vec![
                    OSCMessageArg::Float(current_pos.x as f32),
                    OSCMessageArg::Float(current_pos.y as f32),
                    OSCMessageArg::Float(current_pos.z as f32),
                ],
            }).await?;
        }
        
        // Verify final state
        let final_pos = state.get_position("source1").await?;
        assert!(final_pos.x > 0.0);
        assert!(final_pos.y > 0.0);
        assert!(final_pos.z > 0.0);
    }

    Ok(())
}
