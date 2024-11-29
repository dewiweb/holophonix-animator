use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Position {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub easing: String,
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(start_position: Position, end_position: Position, duration: f64, easing: String) -> Self {
        Self {
            start_position,
            end_position,
            duration,
            easing,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position() {
        let pos = Position::new(1.0, 2.0, 3.0);
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 2.0);
        assert_eq!(pos.z, 3.0);
    }

    #[test]
    fn test_animation_config() {
        let start = Position::new(0.0, 0.0, 0.0);
        let end = Position::new(1.0, 1.0, 1.0);
        let config = AnimationConfig::new(start, end, 1.0, "linear".to_string());
        assert_eq!(config.duration, 1.0);
        assert_eq!(config.easing, "linear");
    }
}
