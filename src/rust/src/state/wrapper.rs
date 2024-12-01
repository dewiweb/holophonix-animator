use std::sync::Arc;
use tokio::sync::Mutex;
use napi_derive::napi;

use crate::{
    animation::models::Position,
    AnimatorResult,
};

#[napi]
pub struct StateManagerWrapper {
    inner: Arc<Mutex<super::StateManager>>,
}

#[napi]
impl StateManagerWrapper {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(super::StateManager::new())),
        }
    }

    #[napi]
    pub async fn update_position(&self, id: String, position: Position) -> AnimatorResult<()> {
        let state = super::State::new(position, true);
        self.inner.lock().await.update_state(id, state).await
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> AnimatorResult<Option<Position>> {
        let state = self.inner.lock().await.get_state(id).await?;
        Ok(state.map(|s| s.position))
    }

    #[napi]
    pub async fn remove_position(&self, id: String) -> AnimatorResult<()> {
        self.inner.lock().await.remove_state(id).await
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
        manager.update_position("pos1".to_string(), pos.clone()).await.unwrap();
        
        let retrieved = manager.get_position("pos1".to_string()).await.unwrap().unwrap();
        assert_eq!(retrieved.x, 1.0);
        assert_eq!(retrieved.y, 2.0);
        assert_eq!(retrieved.z, 3.0);

        manager.remove_position("pos1".to_string()).await.unwrap();
        assert!(manager.get_position("pos1".to_string()).await.unwrap().is_none());
    }
}
