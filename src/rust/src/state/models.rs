use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::models::common::{Position, TrackParameters};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationState {
    pub timestamp: f64,
    pub tracks: HashMap<String, TrackParameters>,
}

impl Default for AnimationState {
    fn default() -> Self {
        Self {
            timestamp: 0.0,
            tracks: HashMap::new(),
        }
    }
}

impl ObjectFinalize for AnimationState {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation_state_default() {
        let state = AnimationState::default();
        assert_eq!(state.timestamp, 0.0);
        assert!(state.tracks.is_empty());
    }
}
