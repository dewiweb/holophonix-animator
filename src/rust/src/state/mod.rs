use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::path::PathBuf;

// Module declarations
pub mod config;
pub mod core;
pub mod models;
pub mod update;
pub mod wrapper;

// Re-exports
pub use core::{StateManager, StateSync, StatePersistence};
pub use models::TrackState;
pub use update::{StateUpdate, BatchStateUpdate};
pub use wrapper::StateManagerWrapper;

use crate::utils::napi::AsyncMutexWrapper;

#[napi(object)]
#[derive(Debug)]
pub struct State {
    pub state_manager: AsyncMutexWrapper<StateManager>,
}

impl ObjectFinalize for State {}

#[napi]
impl State {
    #[napi(constructor)]
    pub fn new(state_dir: Option<String>) -> napi::Result<Self> {
        let path = state_dir.map(PathBuf::from);
        let state_manager = StateManager::new(path)?;
        Ok(Self {
            state_manager: AsyncMutexWrapper::new(state_manager)
        })
    }

    #[napi]
    pub async fn add_animation(&mut self, id: String, animation: Animation) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.add_animation(id.clone(), animation)
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        let state = self.state_manager.lock().await;
        Ok(state.get_animation(&id))
    }

    #[napi]
    pub async fn update_position(&mut self, id: String, x: f64, y: f64, z: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update_position(&id, x, y, z)
    }

    #[napi]
    pub async fn get_state(&self) -> napi::Result<Vec<TrackState>> {
        let state = self.state_manager.lock().await;
        state.get_state()
    }

    #[napi]
    pub async fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update(delta_time)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::common::{Position, Animation, AnimationConfig};

    #[tokio::test]
    async fn test_state_integration() -> napi::Result<()> {
        let mut wrapper = StateManagerWrapper::new(None)?;

        // Test position operations
        wrapper.update_position("test".to_string(), 1.0, 2.0, 3.0).await?;

        // Test animation operations
        let animation = Animation {
            config: AnimationConfig {
                start_time: 0.0,
                start_position: Position::default(),
                end_position: Position { x: 1.0, y: 1.0, z: 1.0 },
                easing: "linear".to_string(),
                duration: 1.0,
            },
            current_time: 0.0,
            id: "test".to_string(),
            is_playing: false,
        };

        wrapper.add_animation("test".to_string(), animation.clone()).await?;
        let stored_animation = wrapper.get_animation("test".to_string()).await?;
        assert!(stored_animation.is_some());

        wrapper.remove_animation("test".to_string()).await?;
        let animation = wrapper.get_animation("test".to_string()).await?;
        assert!(animation.is_none());

        Ok(())
    }
}
