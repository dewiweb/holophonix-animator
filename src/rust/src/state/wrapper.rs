use napi::bindgen_prelude::*;
use napi_derive::napi;
use tokio::sync::Mutex;
use std::sync::Arc;
use crate::state::core::StateManager;
use crate::types::AnimatorResult;

#[napi]
pub struct StateManagerWrapper {
    #[napi(skip)]
    pub state_manager: Arc<Mutex<StateManager>>,
}

impl ObjectFinalize for StateManagerWrapper {}

#[napi]
impl StateManagerWrapper {
    #[napi(constructor)]
    pub fn new(state_dir: Option<String>) -> napi::Result<Self> {
        let state_manager = StateManager::new(state_dir)?;
        Ok(Self {
            state_manager: Arc::new(Mutex::new(state_manager)),
        })
    }

    #[napi]
    pub async fn get_state(&self) -> napi::Result<StateManager> {
        let state = self.state_manager.lock().await;
        Ok(state.clone())
    }

    #[napi]
    pub async fn update_state(&self, new_state: StateManager) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        *state = new_state;
        Ok(())
    }

    #[napi]
    pub async fn update_position(&self, track_id: String, x: f64, y: f64, z: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update_position(track_id, x, y, z)
    }

    #[napi]
    pub async fn add_animation(&self, animation_id: String, animation: Animation) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.add_animation(animation_id, animation)
    }

    #[napi]
    pub async fn get_animation(&self, animation_id: String) -> napi::Result<Option<Animation>> {
        let state = self.state_manager.lock().await;
        Ok(state.get_animation(animation_id))
    }

    #[napi]
    pub async fn remove_animation(&self, animation_id: String) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.remove_animation(animation_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_state_manager_wrapper() -> napi::Result<()> {
        let mut wrapper = StateManagerWrapper::new(None)?;

        // Test position operations
        wrapper.update_position("test".to_string(), 1.0, 2.0, 3.0).await?;

        // Test animation operations
        let animation = Animation {
            config: AnimationConfig {
                start_time: 0.0,
                start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
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
