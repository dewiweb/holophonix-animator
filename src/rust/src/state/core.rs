mod sync;
mod persistence;

pub use sync::{StateSync, StateChange, ChangeNotification};
pub use persistence::{StatePersistence, StateSnapshot};

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, RwLock};
use std::sync::Arc;
use std::collections::HashMap;
use crate::error::{AnimatorError, AnimatorResult};
use crate::animation::Animation;
use crate::position::Position;
use crate::animation::timeline::TimelineManager;
use super::models::TrackState;
use crate::animation::models::Animation;

#[napi]
#[derive(Debug, Default)]
pub struct StateManager {
    animations: Arc<Mutex<HashMap<String, Animation>>>,
    positions: Arc<Mutex<HashMap<String, Position>>>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            animations: Arc::new(Mutex::new(HashMap::new())),
            positions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn update(&mut self, delta_time: f64) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await.map_err(|_| AnimatorError::LockError)?;
        for animation in animations.values_mut() {
            animation.update(delta_time).await?;
        }
        Ok(())
    }

    pub async fn add_animation(&mut self, id: String, animation: Animation) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await.map_err(|_| AnimatorError::LockError)?;
        animations.insert(id, animation);
        Ok(())
    }

    pub async fn get_animation(&self, id: &str) -> AnimatorResult<Option<Animation>> {
        let animations = self.animations.lock().await.map_err(|_| AnimatorError::LockError)?;
        Ok(animations.get(id).cloned())
    }

    pub async fn remove_animation(&mut self, id: &str) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await.map_err(|_| AnimatorError::LockError)?;
        animations.remove(id);
        Ok(())
    }

    pub async fn add_position(&mut self, id: String, position: Position) -> AnimatorResult<()> {
        let mut positions = self.positions.lock().await.map_err(|_| AnimatorError::LockError)?;
        positions.insert(id, position);
        Ok(())
    }

    pub async fn get_position(&self, id: &str) -> AnimatorResult<Option<Position>> {
        let positions = self.positions.lock().await.map_err(|_| AnimatorError::LockError)?;
        Ok(positions.get(id).cloned())
    }

    pub async fn remove_position(&mut self, id: &str) -> AnimatorResult<()> {
        let mut positions = self.positions.lock().await.map_err(|_| AnimatorError::LockError)?;
        positions.remove(id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_state_manager() {
        let mut manager = StateManager::new();

        // Test position management
        let pos = Position::new(1.0, 2.0, 3.0);
        manager.add_position("pos1".to_string(), pos.clone()).await.unwrap();
        
        let retrieved = manager.get_position("pos1").await.unwrap().unwrap();
        assert_eq!(retrieved.x, 1.0);
        assert_eq!(retrieved.y, 2.0);
        assert_eq!(retrieved.z, 3.0);

        manager.remove_position("pos1").await.unwrap();
        assert!(manager.get_position("pos1").await.unwrap().is_none());

        // Test animation management
        let config = crate::animation::AnimationConfig::new(
            0.0,
            10.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            "linear".to_string(),
        );
        let animation = Animation::new("test_anim".to_string(), config);
        
        manager.add_animation("anim1".to_string(), animation).await.unwrap();
        assert!(manager.get_animation("anim1").await.unwrap().is_some());

        manager.remove_animation("anim1").await.unwrap();
        assert!(manager.get_animation("anim1").await.unwrap().is_none());
    }
}
