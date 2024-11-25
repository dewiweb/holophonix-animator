use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{
    animation::{
        AnimationTimeline,
        AnimationGroup,
        models::{AnimationParameters, LinearModel},
    },
    state::StateManager,
    models::Position,
};

#[tokio::test]
async fn test_timeline_creation() {
    let timeline = AnimationTimeline::new("test_timeline".to_string());
    assert_eq!(timeline.name(), "test_timeline");
    assert!(timeline.groups().is_empty());
}

#[tokio::test]
async fn test_timeline_add_remove_group() {
    let mut timeline = AnimationTimeline::new("test_timeline".to_string());
    let group = AnimationGroup::new("test_group".to_string());
    
    // Add group
    timeline.add_group("group1".to_string(), group);
    assert_eq!(timeline.groups().len(), 1);
    
    // Remove group
    timeline.remove_group("group1".to_string());
    assert!(timeline.groups().is_empty());
}

#[tokio::test]
async fn test_timeline_sequential_execution() {
    let mut timeline = AnimationTimeline::new("test_timeline".to_string());
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    
    // Create two groups with simple animations
    let mut group1 = AnimationGroup::new("group1".to_string());
    let mut group2 = AnimationGroup::new("group2".to_string());
    
    // Add animations to groups
    let params1 = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 0.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };
    
    let params2 = AnimationParameters {
        start_position: Position { x: 1.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 2.0, y: 0.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };
    
    group1.add_animation("anim1".to_string(), Box::new(LinearModel::new(params1)));
    group2.add_animation("anim2".to_string(), Box::new(LinearModel::new(params2)));
    
    // Add groups to timeline
    timeline.add_group("group1".to_string(), group1);
    timeline.add_group("group2".to_string(), group2);
    
    // Execute timeline
    let dt = 0.1;
    for _ in 0..21 { // Run for slightly over total duration
        timeline.update(dt, state_manager.clone()).await.expect("Failed to update timeline");
    }
    
    assert!(timeline.is_complete());
}

#[tokio::test]
async fn test_timeline_parallel_execution() {
    let mut timeline = AnimationTimeline::new("test_timeline".to_string());
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    
    // Create two parallel groups
    let mut group1 = AnimationGroup::new("group1".to_string());
    let mut group2 = AnimationGroup::new("group2".to_string());
    
    // Add animations to groups
    let params1 = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 0.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };
    
    let params2 = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 0.0, y: 1.0, z: 0.0 },
        duration: 1.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };
    
    group1.add_animation("anim1".to_string(), Box::new(LinearModel::new(params1)));
    group2.add_animation("anim2".to_string(), Box::new(LinearModel::new(params2)));
    
    // Add groups to timeline with parallel execution
    timeline.add_parallel_group("group1".to_string(), group1);
    timeline.add_parallel_group("group2".to_string(), group2);
    
    // Execute timeline
    let dt = 0.1;
    for _ in 0..11 { // Run for slightly over duration
        timeline.update(dt, state_manager.clone()).await.expect("Failed to update timeline");
    }
    
    assert!(timeline.is_complete());
}

#[tokio::test]
async fn test_timeline_error_handling() {
    let mut timeline = AnimationTimeline::new("test_timeline".to_string());
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    
    // Test invalid group operations
    assert!(timeline.remove_group("nonexistent".to_string()).is_err());
    assert!(timeline.get_group("nonexistent".to_string()).is_none());
    
    // Test update with no groups
    assert!(timeline.update(0.1, state_manager.clone()).await.is_ok());
}
