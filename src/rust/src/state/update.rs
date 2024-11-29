use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use crate::models::common::{Position, Animation, AnimationConfig};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateUpdate {
    pub id: String,
    pub position: Position,
    pub timestamp: f64,
}

impl ObjectFinalize for StateUpdate {}

#[napi]
impl StateUpdate {
    #[napi(constructor)]
    pub fn new(id: String, position: Position, timestamp: f64) -> Self {
        Self {
            id,
            position,
            timestamp,
        }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateUpdateBatch {
    #[napi(skip)]
    pub updates: Vec<StateUpdate>,
}

impl ObjectFinalize for StateUpdateBatch {}

impl Default for StateUpdateBatch {
    fn default() -> Self {
        Self {
            updates: Vec::new(),
        }
    }
}

#[napi]
impl StateUpdateBatch {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[napi]
    pub fn add_update(&mut self, update: StateUpdate) {
        self.updates.push(update);
    }

    #[napi]
    pub fn clear(&mut self) {
        self.updates.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_update() {
        let position = Position::new(1.0, 2.0, 3.0);

        let update = StateUpdate::new(
            "test".to_string(),
            position,
            0.0,
        );

        assert_eq!(update.id, "test");
        assert_eq!(update.position.x, 1.0);
        assert_eq!(update.position.y, 2.0);
        assert_eq!(update.position.z, 3.0);
    }

    #[test]
    fn test_batch_update() {
        let mut batch = StateUpdateBatch::new();
        assert!(batch.updates.is_empty());

        let update = StateUpdate::new(
            "test".to_string(),
            Position::new(1.0, 2.0, 3.0),
            0.0,
        );

        batch.add_update(update);
        assert_eq!(batch.updates.len(), 1);

        batch.clear();
        assert!(batch.updates.is_empty());
    }
}
