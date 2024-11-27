use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{
    animation::{
        AnimationManager,
        models::{Animation, AnimationConfig},
    },
    state::StateManagerWrapper,
};
use napi::bindgen_prelude::*;

#[tokio::test]
async fn test_animation_manager_creation() -> napi::Result<()> {
    let state_manager = StateManagerWrapper::new(None)?;
    let manager = AnimationManager::new(state_manager)?;
    
    assert!(manager.timeline_manager.lock().await.current_time == 0.0);
    Ok(())
}

#[tokio::test]
async fn test_animation_manager_update() -> napi::Result<()> {
    let state_manager = StateManagerWrapper::new(None)?;
    let manager = AnimationManager::new(state_manager)?;

    // Update animation state
    manager.update(0.016).await?; // One frame at 60fps

    // Verify timeline state
    let timeline = manager.timeline_manager.lock().await;
    assert_eq!(timeline.current_time, 0.0); // No animations running yet
    
    Ok(())
}

#[tokio::test]
async fn test_animation_manager_lifecycle() -> napi::Result<()> {
    let state_manager = StateManagerWrapper::new(None)?;
    let manager = AnimationManager::new(state_manager)?;

    // Initialize
    manager.initialize().await?;

    // Run some updates
    for _ in 0..5 {
        manager.update(0.016).await?;
    }

    // Cleanup
    manager.cleanup().await?;

    // Verify state after cleanup
    let timeline = manager.timeline_manager.lock().await;
    assert!(!timeline.is_playing);
    assert_eq!(timeline.current_time, 0.0);
    
    Ok(())
}

#[tokio::test]
async fn test_animation_manager_error_handling() -> napi::Result<()> {
    let state_manager = StateManagerWrapper::new(None)?;
    let manager = AnimationManager::new(state_manager)?;

    // Test error handling for invalid state
    let timeline = manager.timeline_manager.lock().await;
    assert!(!timeline.is_playing); // Should not be playing without initialization
    
    Ok(())
}

#[tokio::test]
async fn test_animation_manager_performance() -> napi::Result<()> {
    let state_manager = StateManagerWrapper::new(None)?;
    let manager = AnimationManager::new(state_manager)?;

    // Initialize and run multiple updates
    manager.initialize().await?;
    
    let start = std::time::Instant::now();
    for _ in 0..100 {
        manager.update(0.016).await?;
    }
    let duration = start.elapsed();
    
    // Performance should be reasonable (adjust threshold as needed)
    assert!(duration.as_millis() < 1000); // Should complete 100 updates in less than 1 second
    
    Ok(())
}
