use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use super::models::{Position, TrackParameters, AnimationState};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateUpdate {
    pub timestamp: f64,
    pub tracks: HashMap<String, TrackParameters>,
}

impl Default for StateUpdate {
    fn default() -> Self {
        Self {
            timestamp: 0.0,
            tracks: HashMap::new(),
        }
    }
}

#[napi]
#[derive(Debug)]
pub struct StateManager {
    current_state: AnimationState,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self {
            current_state: AnimationState::default(),
        })
    }

    #[napi]
    pub fn update(&mut self, update: StateUpdate) -> Result<()> {
        self.current_state.timestamp = update.timestamp;
        self.current_state.tracks.extend(update.tracks);
        Ok(())
    }

    #[napi]
    pub fn get_state(&self) -> Result<AnimationState> {
        Ok(self.current_state.clone())
    }

    #[napi]
    pub fn get_track_parameters(&self, track_id: String) -> Result<Option<TrackParameters>> {
        Ok(self.current_state.tracks.get(&track_id).cloned())
    }

    #[napi]
    pub fn clear(&mut self) -> Result<()> {
        self.current_state = AnimationState::default();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_manager() -> Result<()> {
        let mut manager = StateManager::new()?;
        
        // Test initial state
        let state = manager.get_state()?;
        assert_eq!(state.timestamp, 0.0);
        assert!(state.tracks.is_empty());

        // Test update
        let mut tracks = HashMap::new();
        tracks.insert(
            "track1".to_string(),
            TrackParameters {
                position: Position { x: 1.0, y: 2.0, z: 3.0 },
            },
        );
        
        let update = StateUpdate {
            timestamp: 1.0,
            tracks,
        };
        
        manager.update(update)?;
        
        // Test updated state
        let state = manager.get_state()?;
        assert_eq!(state.timestamp, 1.0);
        assert_eq!(state.tracks.len(), 1);
        
        let track = manager.get_track_parameters("track1".to_string())?.unwrap();
        assert_eq!(track.position.x, 1.0);
        assert_eq!(track.position.y, 2.0);
        assert_eq!(track.position.z, 3.0);
        
        // Test clear
        manager.clear()?;
        let state = manager.get_state()?;
        assert_eq!(state.timestamp, 0.0);
        assert!(state.tracks.is_empty());
        
        Ok(())
    }
}
