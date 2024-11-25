use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{
    animation::{
        AnimationGroup,
        models::{AnimationParameters, LinearModel},
    },
    state::StateManager,
    models::Position,
};

#[tokio::test]
async fn test_animation_group_creation() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let group = AnimationGroup::new("test_group".to_string());
    
    assert_eq!(group.name(), "test_group");
    assert!(group.animations().is_empty());
}

#[tokio::test]
async fn test_animation_group_add_remove() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    let mut group = AnimationGroup::new("test_group".to_string());
    
    // Add animation
    group.add_animation("anim1".to_string(), Box::new(model));
    assert_eq!(group.animations().len(), 1);
    
    // Remove animation
    group.remove_animation("anim1".to_string());
    assert!(group.animations().is_empty());
}

#[tokio::test]
async fn test_animation_group_update() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    let mut group = AnimationGroup::new("test_group".to_string());
    group.add_animation("anim1".to_string(), Box::new(model));
    
    // Update group
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let dt = 0.5; // Half the animation duration
    
    group.update(dt, state_manager.clone()).await.expect("Failed to update group");
    
    // Verify state
    let state = state_manager.lock().await;
    // Add specific state checks based on your implementation
}

#[tokio::test]
async fn test_animation_group_completion() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    let mut group = AnimationGroup::new("test_group".to_string());
    group.add_animation("anim1".to_string(), Box::new(model));
    
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    
    // Update until completion
    let dt = 0.1;
    for _ in 0..11 { // Slightly over duration to ensure completion
        group.update(dt, state_manager.clone()).await.expect("Failed to update group");
    }
    
    assert!(group.is_complete());
}
