use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use crate::animation::models::Animation;
use crate::models::position::Position;
use crate::models::color::Color;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: String,
    pub position: Position,
    pub animation: Option<Animation>,
    pub color: Option<Color>,
    pub gain: Option<f64>,
    pub mute: Option<bool>,
    pub active: bool,
}

impl ObjectFinalize for TrackState {}

#[napi]
impl TrackState {
    #[napi(constructor)]
    pub fn new(
        id: String,
        position: Position,
        animation: Option<Animation>,
        color: Option<Color>,
        gain: Option<f64>,
        mute: Option<bool>,
        active: bool,
    ) -> Self {
        Self {
            id,
            position,
            animation,
            color,
            gain,
            mute,
            active,
        }
    }
}

impl Default for TrackState {
    fn default() -> Self {
        Self {
            id: String::new(),
            position: Position::default(),
            animation: None,
            color: None,
            gain: None,
            mute: None,
            active: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_track_state() -> napi::Result<()> {
        let position = Position {
            x: 1.0,
            y: 2.0,
            z: 3.0,
        };

        let track = TrackState::new("test".to_string(), position.clone(), None, None, None, None, false);
        assert_eq!(track.id, "test");
        assert_eq!(track.position.x, 1.0);
        assert_eq!(track.position.y, 2.0);
        assert_eq!(track.position.z, 3.0);
        assert!(track.animation.is_none());
        assert!(track.color.is_none());
        assert!(track.gain.is_none());
        assert!(track.mute.is_none());
        assert_eq!(track.active, false);

        Ok(())
    }
}
