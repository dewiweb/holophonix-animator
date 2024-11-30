use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use crate::animation::path::{Point3D, Position};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use napi::{Error, Result};
use napi_derive::napi;

use crate::position::Position;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateUpdate {
    pub id: String,
    pub track_id: String,
    pub animation_id: String,
    pub position: Position,
    pub rotation: Position,
    pub time: f64,
    pub is_active: bool,
}

impl napi::bindgen_prelude::ObjectFinalize for StateUpdate {}

#[napi]
impl StateUpdate {
    #[napi(constructor)]
    pub fn new(id: String, track_id: String, animation_id: String, position: Position, rotation: Position, time: f64, is_active: bool) -> Self {
        Self {
            id,
            track_id,
            animation_id,
            position,
            rotation,
            time,
            is_active,
        }
    }

    #[napi]
    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    #[napi]
    pub fn get_track_id(&self) -> String {
        self.track_id.clone()
    }

    #[napi]
    pub fn get_animation_id(&self) -> String {
        self.animation_id.clone()
    }

    #[napi]
    pub fn get_position(&self) -> Position {
        self.position.clone()
    }

    #[napi]
    pub fn get_rotation(&self) -> Position {
        self.rotation.clone()
    }

    #[napi]
    pub fn get_time(&self) -> f64 {
        self.time
    }

    #[napi]
    pub fn is_active(&self) -> bool {
        self.is_active
    }
}

#[napi]
#[derive(Debug, Clone)]
pub struct PluginState {
    positions: Arc<Mutex<HashMap<String, Position>>>,
    rotations: Arc<Mutex<HashMap<String, Position>>>,
    active_animations: Arc<Mutex<HashSet<String>>>,
    paused_animations: Arc<Mutex<HashSet<String>>>,
}

#[napi]
impl PluginState {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            positions: Arc::new(Mutex::new(HashMap::new())),
            rotations: Arc::new(Mutex::new(HashMap::new())),
            active_animations: Arc::new(Mutex::new(HashSet::new())),
            paused_animations: Arc::new(Mutex::new(HashSet::new())),
        }
    }

    #[napi]
    pub fn get_position(&self, id: String) -> Result<Position> {
        self.positions
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .get(&id)
            .cloned()
            .ok_or_else(|| Error::from_reason(format!("Position not found for id: {}", id)))
    }

    #[napi]
    pub fn get_rotation(&self, id: String) -> Result<Position> {
        self.rotations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .get(&id)
            .cloned()
            .ok_or_else(|| Error::from_reason(format!("Rotation not found for id: {}", id)))
    }

    #[napi]
    pub fn is_animation_active(&self, id: String) -> Result<bool> {
        Ok(self.active_animations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .contains(&id))
    }

    #[napi]
    pub fn is_animation_paused(&self, id: String) -> Result<bool> {
        Ok(self.paused_animations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .contains(&id))
    }

    pub(crate) fn update_state(&mut self, update: StateUpdate) -> Result<()> {
        // Update positions
        self.positions
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .insert(update.id.clone(), update.position);

        // Update rotations
        self.rotations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .insert(update.id.clone(), update.rotation);

        // Update active animations
        if update.is_active {
            self.active_animations
                .lock()
                .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
                .insert(update.id.clone());
        }

        Ok(())
    }

    pub(crate) fn remove_animation(&mut self, id: String) -> Result<()> {
        // Remove from active animations
        self.active_animations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .remove(&id);

        // Remove from paused animations
        self.paused_animations
            .lock()
            .map_err(|e| Error::from_reason(format!("Lock error: {}", e)))?
            .remove(&id);

        Ok(())
    }
}

#[derive(Debug)]
pub enum AnimatorError {
    LockError(String),
    NotFound(String),
    InvalidArgument(String),
    Creation(String),
}

impl std::fmt::Display for AnimatorError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AnimatorError::LockError(msg) => write!(f, "Lock error: {}", msg),
            AnimatorError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AnimatorError::InvalidArgument(msg) => write!(f, "Invalid argument: {}", msg),
            AnimatorError::Creation(msg) => write!(f, "Creation error: {}", msg),
        }
    }
}

impl std::error::Error for AnimatorError {}

impl AsRef<str> for AnimatorError {
    fn as_ref(&self) -> &str {
        match self {
            AnimatorError::LockError(s) => s.as_str(),
            AnimatorError::NotFound(s) => s.as_str(),
            AnimatorError::InvalidArgument(s) => s.as_str(),
            AnimatorError::Creation(s) => s.as_str(),
        }
    }
}

impl From<AnimatorError> for napi::Error {
    fn from(error: AnimatorError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, napi::Error>;

#[derive(Debug)]
pub struct StateManager {
    state: Arc<Mutex<PluginState>>,
}

impl StateManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(PluginState::new())),
        }
    }

    pub fn update_positions(&mut self, positions: HashMap<String, Position>) -> Result<()> {
        let mut state = self.state.lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        state.positions
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock positions"))?
            .extend(positions);
        Ok(())
    }

    pub fn get_state(&self) -> Result<PluginState> {
        let state = self.state.lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        Ok(state.clone())
    }

    pub fn clear(&mut self) -> Result<()> {
        let mut state = self.state.lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        state.positions
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock positions"))?
            .clear();
        Ok(())
    }
}

impl Default for StateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_update() {
        let position = Point3D::new(1.0, 2.0, 3.0);
        let rotation = Point3D::new(4.0, 5.0, 6.0);
        let mut update = StateUpdate::new("test".to_string(), "track_test".to_string(), "animation_test".to_string(), position, rotation, 1234567890.0, true);
        
        assert_eq!(update.id, "test");
        assert_eq!(update.track_id, "track_test");
        assert_eq!(update.animation_id, "animation_test");
        assert_eq!(update.position.x, 1.0);
        assert_eq!(update.position.y, 2.0);
        assert_eq!(update.position.z, 3.0);
        assert_eq!(update.rotation.x, 4.0);
        assert_eq!(update.rotation.y, 5.0);
        assert_eq!(update.rotation.z, 6.0);
        assert_eq!(update.time, 1234567890.0);
        assert_eq!(update.is_active, true);
    }

    #[test]
    fn test_state_manager() {
        let mut manager = StateManager::new();
        
        // Test initial state
        let state = manager.get_state().unwrap();
        assert!(state.positions.lock().unwrap().is_empty());

        // Test updating positions
        let mut positions = HashMap::new();
        positions.insert(
            "test".to_string(),
            Position::new(1.0, 2.0, 3.0),
        );
        manager.update_positions(positions.clone()).unwrap();

        // Verify state update
        let state = manager.get_state().unwrap();
        assert_eq!(state.positions.lock().unwrap().len(), 1);
        let pos = state.positions.lock().unwrap().get("test").unwrap();
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 2.0);
        assert_eq!(pos.z, 3.0);

        // Test clearing state
        manager.clear().unwrap();
        let state = manager.get_state().unwrap();
        assert!(state.positions.lock().unwrap().is_empty());
    }

    #[test]
    fn test_plugin_state() {
        let mut state = PluginState::new();
        
        // Test getting non-existent position
        assert!(state.get_position("test".to_string()).is_err());

        // Test adding and getting position
        state.update_state(StateUpdate::new("test".to_string(), "track_test".to_string(), "animation_test".to_string(), Position::new(1.0, 2.0, 3.0), Position::new(4.0, 5.0, 6.0), 1234567890.0, true)).unwrap();
        let pos = state.get_position("test".to_string()).unwrap();
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 2.0);
        assert_eq!(pos.z, 3.0);
    }
}
