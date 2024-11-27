// Module declarations
pub mod config;
pub mod core;
mod wrapper;
pub mod models;
pub mod update;

// Re-exports
pub use core::{StateManager};
pub use wrapper::StateManagerWrapper;
pub use models::{Position, TrackParameters, Animation};
pub use update::{AnimationUpdate, PositionUpdate, StateUpdate};

// External imports
use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};

use crate::models::common::{Animation as CommonAnimation, Position as CommonPosition};
use crate::animation::Animation as AnimationImpl;
use self::core::{StateManager, Position as PositionImpl};

#[napi]
pub struct State {
    state_manager: Arc<Mutex<StateManager>>,
}

#[napi]
impl State {
    #[napi(constructor)]
    pub fn new(state_dir: Option<String>) -> napi::Result<Self> {
        let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir)?));
        Ok(Self { state_manager })
    }

    #[napi]
    pub async fn add_animation(&self, animation: CommonAnimation) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        let animation = AnimationImpl::from(animation);
        state.add_animation(animation).await
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<CommonAnimation>> {
        let state = self.state_manager.lock().await;
        let animation = state.get_animation(id).await?;
        Ok(animation.map(|a| CommonAnimation::from(a)))
    }

    #[napi]
    pub async fn update_position(&self, id: String, position: CommonPosition) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        let position = PositionImpl::from(position);
        state.update_position(id, position).await
    }

    #[napi]
    pub async fn get_state(&self) -> napi::Result<Vec<CommonPosition>> {
        let state = self.state_manager.lock().await;
        let positions = state.get_positions().await?;
        Ok(positions)
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update(delta_time).await
    }
}

#[napi]
#[derive(Debug)]
pub struct StateManagerWrapper {
    #[napi(skip)]
    pub state: Arc<Mutex<StateManager>>,
}

#[napi]
impl StateManagerWrapper {
    #[napi(constructor)]
    pub fn new(state_dir: Option<String>) -> napi::Result<Self> {
        let state_dir = state_dir.unwrap_or_else(|| "state".to_string());
        let state_manager = Arc::new(Mutex::new(StateManager::new(state_dir)?));
        Ok(Self {
            state: state_manager,
        })
    }

    #[napi]
    pub async fn add_animation(&mut self, animation: CommonAnimation) -> napi::Result<()> {
        let mut state = self.state.lock().await;
        state.add_animation(animation).await
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<CommonAnimation>> {
        let state = self.state.lock().await;
        state.get_animation(id).await
    }

    #[napi]
    pub async fn add_position(&mut self, id: String, position: CommonPosition) -> napi::Result<()> {
        let mut state = self.state.lock().await;
        state.add_position(id, position).await
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> napi::Result<Option<CommonPosition>> {
        let state = self.state.lock().await;
        state.get_position(id).await
    }

    #[napi]
    pub async fn get_all_animations(&self) -> napi::Result<Vec<CommonAnimation>> {
        let state = self.state.lock().await;
        state.get_all_animations().await
    }

    #[napi]
    pub async fn get_all_positions(&self) -> napi::Result<Vec<CommonPosition>> {
        let state = self.state.lock().await;
        state.get_positions().await
    }
}

impl Default for StateManagerWrapper {
    fn default() -> Self {
        Self {
            state: Arc::new(Mutex::new(StateManager::default())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_state_management() {
        let state = State::new(None).unwrap();

        let animation = CommonAnimation {
            id: "test".to_string(),
            position: CommonPosition { x: 0.0, y: 0.0, z: 0.0 },
            duration: 0.0,
            current_time: 0.0,
            is_playing: false,
        };

        state.add_animation(animation.clone()).await.unwrap();

        let retrieved = state.get_animation("test".to_string()).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "test");

        let new_position = CommonPosition { x: 1.0, y: 1.0, z: 1.0 };
        state.update_position("test".to_string(), new_position.clone()).await.unwrap();

        let state_data = state.get_state().await.unwrap();
        assert_eq!(state_data.len(), 1);
        assert_eq!(state_data[0].x, new_position.x);
    }
}
