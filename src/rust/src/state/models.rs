use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

use crate::animation::Animation;
use crate::models::Position;

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: String,
    pub name: String,
    pub position: Option<Position>,
    #[serde(skip)]
    pub animation: Option<Animation>,
}

#[napi]
impl TrackState {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            position: None,
            animation: None,
        }
    }

    pub fn set_position(&mut self, position: Option<Position>) {
        self.position = position;
    }

    pub fn get_position(&self) -> Option<Position> {
        self.position.clone()
    }

    pub fn set_animation(&mut self, animation: Option<Animation>) {
        self.animation = animation;
    }

    pub fn get_animation(&self) -> Option<Animation> {
        self.animation.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::animation::AnimationConfig;

    #[test]
    fn test_track_state() {
        let mut track = TrackState::new("test".to_string(), "Test Track".to_string());
        
        // Test initial state
        assert!(track.position.is_none());
        assert!(track.animation.is_none());

        // Test position
        let pos = Position::new(1.0, 2.0, 3.0);
        track.set_position(Some(pos.clone()));
        assert_eq!(track.get_position().unwrap().x, 1.0);
        assert_eq!(track.get_position().unwrap().y, 2.0);
        assert_eq!(track.get_position().unwrap().z, 3.0);

        // Test animation
        let config = AnimationConfig::new(
            0.0,
            10.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            "linear".to_string(),
        );
        let animation = Animation::new("test_anim".to_string(), config);
        track.set_animation(Some(animation));
        assert!(track.get_animation().is_some());
    }
}
