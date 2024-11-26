use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{
    animation::{
        engine::AnimationEngine,
        models::{AnimationParameters, LinearModel},
    },
    state::StateManager,
    models::Position,
};

#[tokio::test]
async fn test_animation_engine_initialization() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut engine = AnimationEngine::new(state_manager);
    
    assert!(engine.initialize().is_ok());
}

#[tokio::test]
async fn test_animation_engine_frame_processing() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut engine = AnimationEngine::new(state_manager.clone());
    
    engine.initialize().expect("Failed to initialize engine");

    // Process a frame
    assert!(engine.process_frame(0.016).is_ok()); // ~60fps

    // Verify state manager is updated
    let state = state_manager.lock().await;
    assert!(state.is_initialized());
}

#[tokio::test]
async fn test_animation_engine_cleanup() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut engine = AnimationEngine::new(state_manager);
    
    engine.initialize().expect("Failed to initialize engine");
    assert!(engine.cleanup().is_ok());
}

#[tokio::test]
async fn test_animation_engine_error_handling() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut engine = AnimationEngine::new(state_manager);
    
    // Test error handling without initialization
    assert!(engine.process_frame(0.016).is_err());
}

#[tokio::test]
async fn test_animation_engine_state_sync() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut engine = AnimationEngine::new(state_manager.clone());
    
    engine.initialize().expect("Failed to initialize engine");

    // Create and add an animation
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    
    // Process multiple frames
    for _ in 0..10 {
        engine.process_frame(0.1).expect("Failed to process frame");
    }

    // Verify final state
    let state = state_manager.lock().await;
    assert!(state.is_initialized());
    // Add more specific state checks based on your implementation
}
