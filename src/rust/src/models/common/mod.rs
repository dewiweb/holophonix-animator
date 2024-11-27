use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
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

impl ObjectFinalize for Position {}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackParameters {
    pub position: Position,
}

#[napi]
impl TrackParameters {
    #[napi(constructor)]
    pub fn new(position: Position) -> Self {
        Self { position }
    }
}

impl Default for TrackParameters {
    fn default() -> Self {
        Self {
            position: Position::default(),
        }
    }
}

impl ObjectFinalize for TrackParameters {}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub start_time: f64,
    pub duration: f64,
    pub start_position: Position,
    pub end_position: Position,
    pub easing: String,
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(
        start_time: f64,
        duration: f64,
        start_position: Position,
        end_position: Position,
        easing: String,
    ) -> Self {
        Self {
            start_time,
            duration,
            start_position,
            end_position,
            easing,
        }
    }
}

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

impl ObjectFinalize for AnimationConfig {}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub config: AnimationConfig,
    pub is_playing: bool,
    pub current_time: f64,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String, config: AnimationConfig) -> Self {
        Self {
            id,
            config,
            is_playing: false,
            current_time: 0.0,
        }
    }

    #[napi]
    pub async unsafe fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        if self.is_playing {
            self.current_time += delta_time;
            if self.current_time >= self.config.duration {
                self.stop()?;
            }
        }
        Ok(())
    }

    #[napi]
    pub fn play(&mut self) -> napi::Result<()> {
        self.is_playing = true;
        Ok(())
    }

    #[napi]
    pub fn pause(&mut self) -> napi::Result<()> {
        self.is_playing = false;
        Ok(())
    }

    #[napi]
    pub fn stop(&mut self) -> napi::Result<()> {
        self.is_playing = false;
        self.current_time = 0.0;
        Ok(())
    }

    #[napi]
    pub fn seek(&mut self, time: f64) -> napi::Result<()> {
        self.current_time = time.min(self.config.duration);
        Ok(())
    }

    #[napi]
    pub fn get_current_position(&self) -> napi::Result<Position> {
        let t = (self.current_time - self.config.start_time) / self.config.duration;
        let t = t.max(0.0).min(1.0);

        Ok(Position {
            x: self.config.start_position.x + (self.config.end_position.x - self.config.start_position.x) * t,
            y: self.config.start_position.y + (self.config.end_position.y - self.config.start_position.y) * t,
            z: self.config.start_position.z + (self.config.end_position.z - self.config.start_position.z) * t,
        })
    }
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::new(),
            config: AnimationConfig::default(),
            is_playing: false,
            current_time: 0.0,
        }
    }
}

impl ObjectFinalize for Animation {}

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
        let config = AnimationConfig::new(0.0, 1.0, start, end, "linear".to_string());
        assert_eq!(config.duration, 1.0);
    }

    #[test]
    fn test_animation() {
        let start = Position::new(0.0, 0.0, 0.0);
        let end = Position::new(1.0, 1.0, 1.0);
        let config = AnimationConfig::new(0.0, 1.0, start, end, "linear".to_string());
        let mut animation = Animation::new("test".to_string(), config);

        // Test initial state
        assert!(!animation.is_playing);
        assert_eq!(animation.current_time, 0.0);

        // Test play
        animation.play().unwrap();
        assert!(animation.is_playing);

        // Test update
        unsafe { animation.update(0.5).unwrap() };
        assert_eq!(animation.current_time, 0.5);

        let pos = animation.get_current_position().unwrap();
        assert_eq!(pos.x, 0.5);
        assert_eq!(pos.y, 0.5);
        assert_eq!(pos.z, 0.5);

        // Test pause
        animation.pause().unwrap();
        assert!(!animation.is_playing);

        // Test stop
        animation.stop().unwrap();
        assert!(!animation.is_playing);
        assert_eq!(animation.current_time, 0.0);
    }
}
