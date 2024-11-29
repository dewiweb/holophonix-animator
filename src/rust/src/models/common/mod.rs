use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

use crate::animation::models::easing;

pub mod animation;
pub mod error;
pub mod osc;
pub mod plugin;
pub mod monitoring;
pub mod recovery;

#[napi(object)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, napi::Object)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl ObjectFinalize for Position {}

impl FromNapiRef for Position {
    unsafe fn from_napi_ref(env: *mut napi_env__, value: *mut napi_value__) -> napi::Result<&'static Self> {
        let mut result = std::mem::MaybeUninit::uninit();
        napi_get_value_external(env, value, result.as_mut_ptr() as _)?;
        Ok(&*result.assume_init())
    }
}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn add(&self, other: &Position) -> Position {
        Position {
            x: self.x + other.x,
            y: self.y + other.y,
            z: self.z + other.z,
        }
    }

    #[napi]
    pub fn subtract(&self, other: &Position) -> Position {
        Position {
            x: self.x - other.x,
            y: self.y - other.y,
            z: self.z - other.z,
        }
    }

    #[napi]
    pub fn multiply(&self, scalar: f64) -> Position {
        Position {
            x: self.x * scalar,
            y: self.y * scalar,
            z: self.z * scalar,
        }
    }

    #[napi]
    pub fn distance_to(&self, other: &Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    #[napi]
    pub fn lerp(&self, target: &Position, t: f64) -> Position {
        Position {
            x: self.x + (target.x - self.x) * t,
            y: self.y + (target.y - self.y) * t,
            z: self.z + (target.z - self.z) * t,
        }
    }
}

impl Default for Position {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
        }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub start_time: f64,
    pub duration: f64,
    pub start_position: Position,
    pub end_position: Position,
    pub easing: String,
}

impl ObjectFinalize for AnimationConfig {}

impl Default for AnimationConfig {
    fn default() -> Self {
        Self {
            start_time: 0.0,
            duration: 1.0,
            start_position: Position::default(),
            end_position: Position::default(),
            easing: "linear".to_string(),
        }
    }
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(start_time: f64, duration: f64, start_position: Position, end_position: Position, easing: String) -> Self {
        Self {
            start_time,
            duration,
            start_position,
            end_position,
            easing,
        }
    }

    #[napi]
    pub fn get_value_at_progress(&self, progress: f64) -> Position {
        let easing_value = match self.easing.as_str() {
            "linear" => easing::linear(progress),
            "ease_in" => easing::ease_in(progress),
            "ease_out" => easing::ease_out(progress),
            "ease_in_out" => easing::ease_in_out(progress),
            "sine_in" => easing::sine_in(progress),
            "sine_out" => easing::sine_out(progress),
            "sine_in_out" => easing::sine_in_out(progress),
            _ => easing::linear(progress),
        };

        self.start_position.lerp(&self.end_position, easing_value)
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub config: AnimationConfig,
    pub current_time: f64,
    pub id: String,
    pub is_playing: bool,
}

impl ObjectFinalize for Animation {}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(config: AnimationConfig, id: String) -> Self {
        Self {
            config,
            current_time: 0.0,
            id,
            is_playing: false,
        }
    }

    #[napi]
    pub fn start(&mut self) {
        self.is_playing = true;
        self.current_time = 0.0;
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_playing = false;
    }

    #[napi]
    pub fn pause(&mut self) {
        self.is_playing = false;
    }

    #[napi]
    pub fn resume(&mut self) {
        self.is_playing = true;
    }

    #[napi]
    pub fn reset(&mut self) {
        self.current_time = 0.0;
        self.is_playing = false;
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        if !self.is_playing {
            return Ok(());
        }

        self.current_time += delta_time;
        if self.current_time >= self.config.duration {
            self.is_playing = false;
        }

        Ok(())
    }

    #[napi]
    pub fn get_progress(&self) -> f64 {
        if self.config.duration == 0.0 {
            return 0.0;
        }
        (self.current_time / self.config.duration).min(1.0)
    }

    #[napi]
    pub fn is_complete(&self) -> bool {
        self.current_time >= self.config.duration
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation() -> napi::Result<()> {
        let config = AnimationConfig::new(0.0, 1.0, Position::new(0.0, 0.0, 0.0), Position::new(1.0, 1.0, 1.0), "linear".to_string());

        let mut animation = Animation::new(config, "test".to_string());
        assert!(!animation.is_playing);
        assert_eq!(animation.current_time, 0.0);

        // Test start
        animation.start();
        assert!(animation.is_playing);
        assert_eq!(animation.current_time, 0.0);

        // Test update
        animation.update(0.5)?;
        assert!(animation.is_playing);
        assert_eq!(animation.current_time, 0.5);
        assert_eq!(animation.get_progress(), 0.5);

        // Test pause/resume
        animation.pause();
        assert!(!animation.is_playing);
        animation.resume();
        assert!(animation.is_playing);

        // Test completion
        animation.update(0.6)?;
        assert!(!animation.is_playing);
        assert!(animation.is_complete());
        assert_eq!(animation.get_progress(), 1.0);

        // Test reset
        animation.reset();
        assert!(!animation.is_playing);
        assert_eq!(animation.current_time, 0.0);
        assert!(!animation.is_complete());

        Ok(())
    }
}
