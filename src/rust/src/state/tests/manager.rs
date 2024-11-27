use std::sync::Arc;
use tokio::sync::Mutex;
use crate::state::{
    StateManager,
    StateManagerWrapper,
    models::{Position, TrackParameters},
    update::{StateUpdate, AnimationUpdate, PositionUpdate},
};
use crate::animation::models::Animation;
use napi::bindgen_prelude::*;

#[tokio::test]
async fn test_state_manager_creation() -> napi::Result<()> {
    let manager = StateManagerWrapper::new(None)?;
    let state = manager.get_state().await?;
    
    assert!(state.animations.is_empty());
    assert!(state.tracks.is_empty());
    assert!(state.groups.is_empty());
    
    Ok(())
}

#[tokio::test]
async fn test_state_update_cycle() -> napi::Result<()> {
    let mut manager = StateManagerWrapper::new(None)?;
    
    // Perform state update
    manager.update(0.016).await?; // One frame at 60fps
    
    // Verify state is updated
    let state = manager.get_state().await?;
    assert_eq!(state.animations.len(), 0); // No animations added yet
    
    Ok(())
}

#[tokio::test]
async fn test_animation_management() -> napi::Result<()> {
    let mut manager = StateManagerWrapper::new(None)?;
    
    // Create test animation
    let animation = Animation {
        id: "test".to_string(),
        duration: 1.0,
        is_playing: true,
        is_paused: false,
    };
    
    // Add animation
    manager.add_animation(animation.clone()).await?;
    
    // Verify animation is added
    let state = manager.get_state().await?;
    assert_eq!(state.animations.len(), 1);
    assert_eq!(state.animations[0].id, "test");
    
    Ok(())
}

#[tokio::test]
async fn test_position_updates() -> napi::Result<()> {
    let mut manager = StateManagerWrapper::new(None)?;
    
    // Update position
    let position = Position {
        x: 1.0,
        y: 2.0,
        z: 3.0,
    };
    manager.update_position("test".to_string(), position.clone()).await?;
    
    // Verify position is updated
    let state = manager.get_state().await?;
    // Add position verification based on your state structure
    
    Ok(())
}

#[tokio::test]
async fn test_error_handling() -> napi::Result<()> {
    let mut manager = StateManagerWrapper::new(None)?;
    
    // Test invalid animation ID
    let result = manager.get_animation("nonexistent".to_string()).await;
    assert!(result?.is_none());
    
    // Test invalid position update
    let position = Position {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };
    let result = manager.update_position("nonexistent".to_string(), position).await;
    assert!(result.is_ok()); // Should handle gracefully
    
    Ok(())
}
