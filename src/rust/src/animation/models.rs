use crate::{Position, error::{AnimatorResult, AnimatorError}};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use std::time::{Duration, Instant};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnimationType {
    Linear,
    Circular,
    Spiral,
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub duration: Duration,
    pub radius: f32,
    pub animation_type: AnimationType,
}

impl AnimationConfig {
    pub fn validate(&self) -> AnimatorResult<()> {
        if self.duration.as_secs_f32() <= 0.0 {
            return Err(AnimatorError::InvalidParameter(
                "Duration must be positive".to_string(),
            ));
        }
        if self.radius <= 0.0 {
            return Err(AnimatorError::InvalidParameter(
                "Radius must be positive".to_string(),
            ));
        }
        Ok(())
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct Animation {
    pub config: AnimationConfig,
    pub start_position: Position,
    pub end_position: Position,
    start_time: Option<Instant>,
    paused_duration: Duration,
    is_paused: bool,
}

impl Animation {
    pub fn new(config: AnimationConfig, start: Position, end: Position) -> AnimatorResult<Self> {
        config.validate()?;
        Ok(Self {
            config,
            start_position: start,
            end_position: end,
            start_time: None,
            paused_duration: Duration::ZERO,
            is_paused: false,
        })
    }

    #[napi]
    pub fn start(&mut self) {
        if self.start_time.is_none() {
            self.start_time = Some(Instant::now());
        }
    }

    #[napi]
    pub fn stop(&mut self) {
        self.start_time = None;
        self.paused_duration = Duration::ZERO;
        self.is_paused = false;
    }

    #[napi]
    pub fn pause(&mut self) {
        if !self.is_paused && self.start_time.is_some() {
            self.is_paused = true;
            self.paused_duration = self.elapsed();
        }
    }

    #[napi]
    pub fn resume(&mut self) {
        if self.is_paused {
            self.is_paused = false;
            if let Some(start) = self.start_time {
                self.start_time = Some(Instant::now() - self.paused_duration);
            }
        }
    }

    #[napi]
    pub fn reset(&mut self) {
        self.stop();
        self.start();
    }

    pub fn elapsed(&self) -> Duration {
        if self.is_paused {
            self.paused_duration
        } else if let Some(start) = self.start_time {
            Instant::now() - start
        } else {
            Duration::ZERO
        }
    }

    pub fn progress(&self) -> f32 {
        if self.start_time.is_none() {
            return 0.0;
        }
        let elapsed = self.elapsed().as_secs_f32();
        let duration = self.config.duration.as_secs_f32();
        (elapsed / duration).min(1.0)
    }

    pub fn is_complete(&self) -> bool {
        self.progress() >= 1.0
    }

    pub fn current_position(&self) -> Position {
        let t = self.progress();
        match self.config.animation_type {
            AnimationType::Linear => self.interpolate_linear(t),
            AnimationType::Circular => self.interpolate_circular(t),
            AnimationType::Spiral => self.interpolate_spiral(t),
        }
    }

    fn interpolate_linear(&self, t: f32) -> Position {
        Position {
            x: self.start_position.x + (self.end_position.x - self.start_position.x) * t,
            y: self.start_position.y + (self.end_position.y - self.start_position.y) * t,
            z: self.start_position.z + (self.end_position.z - self.start_position.z) * t,
            rx: self.start_position.rx + (self.end_position.rx - self.start_position.rx) * t,
            ry: self.start_position.ry + (self.end_position.ry - self.start_position.ry) * t,
            rz: self.start_position.rz + (self.end_position.rz - self.start_position.rz) * t,
        }
    }

    fn interpolate_circular(&self, t: f32) -> Position {
        let angle = t * std::f32::consts::PI * 2.0;
        let radius = self.config.radius;
        let center = Position {
            x: (self.start_position.x + self.end_position.x) * 0.5,
            y: (self.start_position.y + self.end_position.y) * 0.5,
            z: (self.start_position.z + self.end_position.z) * 0.5,
            rx: (self.start_position.rx + self.end_position.rx) * 0.5,
            ry: (self.start_position.ry + self.end_position.ry) * 0.5,
            rz: (self.start_position.rz + self.end_position.rz) * 0.5,
        };

        Position {
            x: center.x + radius * angle.cos(),
            y: center.y + radius * angle.sin(),
            z: center.z,
            rx: self.interpolate_linear(t).rx,
            ry: self.interpolate_linear(t).ry,
            rz: self.interpolate_linear(t).rz,
        }
    }

    fn interpolate_spiral(&self, t: f32) -> Position {
        let angle = t * std::f32::consts::PI * 4.0;
        let radius = self.config.radius * t;
        let center = Position {
            x: (self.start_position.x + self.end_position.x) * 0.5,
            y: (self.start_position.y + self.end_position.y) * 0.5,
            z: (self.start_position.z + self.end_position.z) * 0.5,
            rx: (self.start_position.rx + self.end_position.rx) * 0.5,
            ry: (self.start_position.ry + self.end_position.ry) * 0.5,
            rz: (self.start_position.rz + self.end_position.rz) * 0.5,
        };

        Position {
            x: center.x + radius * angle.cos(),
            y: center.y + radius * angle.sin(),
            z: self.interpolate_linear(t).z,
            rx: self.interpolate_linear(t).rx,
            ry: self.interpolate_linear(t).ry,
            rz: self.interpolate_linear(t).rz,
        }
    }
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(
        duration: Duration,
        radius: f32,
        animation_type: AnimationType,
    ) -> AnimatorResult<Self> {
        Ok(Self {
            duration,
            radius,
            animation_type,
        })
    }
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(config: AnimationConfig, start: Position, end: Position) -> AnimatorResult<Self> {
        config.validate()?;
        Ok(Self {
            config,
            start_position: start,
            end_position: end,
            start_time: None,
            paused_duration: Duration::ZERO,
            is_paused: false,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    fn create_test_animation() -> Animation {
        let config = AnimationConfig {
            duration: Duration::from_secs(1),
            radius: 1.0,
            animation_type: AnimationType::Linear,
        };
        let start = Position {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            rx: 0.0,
            ry: 0.0,
            rz: 0.0,
        };
        let end = Position {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            rx: 90.0,
            ry: 90.0,
            rz: 90.0,
        };
        Animation::new(config, start, end).unwrap()
    }

    #[test]
    fn test_animation_lifecycle() {
        let mut animation = create_test_animation();
        
        // Initial state
        assert_eq!(animation.progress(), 0.0);
        assert!(!animation.is_complete());
        
        // Start animation
        animation.start();
        assert!(animation.progress() > 0.0);
        
        // Pause animation
        animation.pause();
        let progress = animation.progress();
        std::thread::sleep(Duration::from_millis(100));
        assert_eq!(animation.progress(), progress);
        
        // Resume animation
        animation.resume();
        std::thread::sleep(Duration::from_millis(100));
        assert!(animation.progress() > progress);
        
        // Reset animation
        animation.reset();
        assert!(animation.progress() < progress);
        
        // Stop animation
        animation.stop();
        assert_eq!(animation.progress(), 0.0);
    }

    #[test]
    fn test_invalid_config() {
        let config = AnimationConfig {
            duration: Duration::from_secs(0),
            radius: 1.0,
            animation_type: AnimationType::Linear,
        };
        let start = Position::default();
        let end = Position::default();
        assert!(Animation::new(config, start, end).is_err());

        let config = AnimationConfig {
            duration: Duration::from_secs(1),
            radius: 0.0,
            animation_type: AnimationType::Circular,
        };
        assert!(Animation::new(config, start, end).is_err());
    }

    #[test]
    fn test_interpolation() {
        let mut animation = create_test_animation();
        animation.start();
        
        // Test start position
        let pos = animation.current_position();
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);
        
        // Force complete
        std::thread::sleep(Duration::from_secs(1));
        
        // Test end position
        let pos = animation.current_position();
        assert!((pos.x - 1.0).abs() < 0.01);
        assert!((pos.y - 1.0).abs() < 0.01);
        assert!((pos.z - 1.0).abs() < 0.01);
    }
}
