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

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub rx: f64,
    pub ry: f64,
    pub rz: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            rx: 0.0,
            ry: 0.0,
            rz: 0.0,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keyframe {
    pub time: f64,
    pub position: Position,
    pub interpolation: String,
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub track_id: String,
    pub duration: f64,
    pub keyframes: Vec<Keyframe>,
    start_time: Option<Instant>,
    paused_duration: Duration,
    is_paused: bool,
}

impl Animation {
    pub fn new(config: AnimationConfig, start: Position, end: Position) -> AnimatorResult<Self> {
        config.validate()?;
        Ok(Self {
            track_id: "".to_string(),
            duration: config.duration.as_secs_f64(),
            keyframes: vec![],
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
        let duration = self.duration as f32;
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
            x: self.start_position.x + (self.end_position.x - self.start_position.x) * t as f64,
            y: self.start_position.y + (self.end_position.y - self.start_position.y) * t as f64,
            z: self.start_position.z + (self.end_position.z - self.start_position.z) * t as f64,
            rx: self.start_position.rx + (self.end_position.rx - self.start_position.rx) * t as f64,
            ry: self.start_position.ry + (self.end_position.ry - self.start_position.ry) * t as f64,
            rz: self.start_position.rz + (self.end_position.rz - self.start_position.rz) * t as f64,
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
            x: center.x + radius * angle.cos() as f64,
            y: center.y + radius * angle.sin() as f64,
            z: center.z,
            rx: self.interpolate_linear(t).rx,
            ry: self.interpolate_linear(t).ry,
            rz: self.interpolate_linear(t).rz,
        }
    }

    fn interpolate_spiral(&self, t: f32) -> Position {
        let angle = t * std::f32::consts::PI * 4.0;
        let radius = self.config.radius * t as f64;
        let center = Position {
            x: (self.start_position.x + self.end_position.x) * 0.5,
            y: (self.start_position.y + self.end_position.y) * 0.5,
            z: (self.start_position.z + self.end_position.z) * 0.5,
            rx: (self.start_position.rx + self.end_position.rx) * 0.5,
            ry: (self.start_position.ry + self.end_position.ry) * 0.5,
            rz: (self.start_position.rz + self.end_position.rz) * 0.5,
        };

        Position {
            x: center.x + radius * angle.cos() as f64,
            y: center.y + radius * angle.sin() as f64,
            z: self.interpolate_linear(t).z,
            rx: self.interpolate_linear(t).rx,
            ry: self.interpolate_linear(t).ry,
            rz: self.interpolate_linear(t).rz,
        }
    }

    pub fn get_position_at_time(&self, time: f64) -> Result<Position, AnimatorError> {
        if self.keyframes.is_empty() {
            return Ok(Position::default());
        }

        // Find the keyframes before and after the current time
        let mut prev_frame = &self.keyframes[0];
        let mut next_frame = prev_frame;

        for frame in &self.keyframes {
            if frame.time <= time {
                prev_frame = frame;
            } else {
                next_frame = frame;
                break;
            }
        }

        // If we're at or past the last keyframe, return its position
        if time >= prev_frame.time && prev_frame.time >= next_frame.time {
            return Ok(prev_frame.position.clone());
        }

        // Calculate interpolation factor
        let factor = (time - prev_frame.time) / (next_frame.time - prev_frame.time);

        // Interpolate between positions based on the interpolation type
        match prev_frame.interpolation.as_str() {
            "linear" => Ok(Position {
                x: prev_frame.position.x + (next_frame.position.x - prev_frame.position.x) * factor,
                y: prev_frame.position.y + (next_frame.position.y - prev_frame.position.y) * factor,
                z: prev_frame.position.z + (next_frame.position.z - prev_frame.position.z) * factor,
                rx: prev_frame.position.rx + (next_frame.position.rx - prev_frame.position.rx) * factor,
                ry: prev_frame.position.ry + (next_frame.position.ry - prev_frame.position.ry) * factor,
                rz: prev_frame.position.rz + (next_frame.position.rz - prev_frame.position.rz) * factor,
            }),
            "step" => Ok(prev_frame.position.clone()),
            _ => Err(AnimatorError::InvalidInterpolation(prev_frame.interpolation.clone())),
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineState {
    pub current_time: f64,
    pub is_playing: bool,
    pub loop_enabled: bool,
}

impl Default for TimelineState {
    fn default() -> Self {
        Self {
            current_time: 0.0,
            is_playing: false,
            loop_enabled: false,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationState {
    pub current_animation: Option<Animation>,
    pub timeline: TimelineState,
}

impl Default for AnimationState {
    fn default() -> Self {
        Self {
            current_animation: None,
            timeline: TimelineState::default(),
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
            track_id: "".to_string(),
            duration: config.duration.as_secs_f64(),
            keyframes: vec![],
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
