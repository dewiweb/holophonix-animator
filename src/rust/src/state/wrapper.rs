use std::sync::Arc;
use tokio::sync::Mutex;

use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::animation::Animation;
use crate::error::AnimatorResult;
use crate::models::Position;
use crate::state::StateManager;

#[napi(js_name = "StateManager")]
pub struct StateManagerWrapper {
    inner: Arc<Mutex<StateManager>>,
}

#[napi]
impl StateManagerWrapper {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(StateManager::new())),
        }
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.update(delta_time).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn add_animation(&self, id: String, animation: Animation) -> napi::Result<()> {
        let mut manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.add_animation(id, animation).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        let manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.get_animation(&id).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn remove_animation(&self, id: String) -> napi::Result<()> {
        let mut manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.remove_animation(&id).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn add_position(&self, id: String, position: Position) -> napi::Result<()> {
        let mut manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.add_position(id, position).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> napi::Result<Option<Position>> {
        let manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.get_position(&id).await.map_err(|e| Error::from_reason(e.to_string()))
    }

    #[napi]
    pub async fn remove_position(&self, id: String) -> napi::Result<()> {
        let mut manager = self.inner.lock().await.map_err(|_| Error::from_reason("Failed to lock state manager"))?;
        manager.remove_position(&id).await.map_err(|e| Error::from_reason(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::animation::AnimationConfig;

    #[tokio::test]
    async fn test_state_manager_wrapper() {
        let manager = StateManagerWrapper::new();

        // Test position management
        let pos = Position::new(1.0, 2.0, 3.0);
        manager.add_position("pos1".to_string(), pos.clone()).await.unwrap();
        
        let retrieved = manager.get_position("pos1".to_string()).await.unwrap().unwrap();
        assert_eq!(retrieved.x, 1.0);
        assert_eq!(retrieved.y, 2.0);
        assert_eq!(retrieved.z, 3.0);

        manager.remove_position("pos1".to_string()).await.unwrap();
        assert!(manager.get_position("pos1".to_string()).await.unwrap().is_none());

        // Test animation management
        let config = AnimationConfig::new(
            0.0,
            10.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            "linear".to_string(),
        );
        let animation = Animation::new("test_anim".to_string(), config);
        
        manager.add_animation("anim1".to_string(), animation).await.unwrap();
        assert!(manager.get_animation("anim1".to_string()).await.unwrap().is_some());

        manager.remove_animation("anim1".to_string()).await.unwrap();
        assert!(manager.get_animation("anim1".to_string()).await.unwrap().is_none());
    }
}
