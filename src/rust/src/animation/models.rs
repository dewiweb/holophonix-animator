use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use crate::AnimatorResult;

#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AnimationState {
    Playing,
    Paused,
    Stopped,
}

#[napi]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Position {
    #[napi]
    pub x: f64,
    #[napi]
    pub y: f64,
    #[napi]
    pub z: f64,
    #[napi]
    pub rx: f64,
    #[napi]
    pub ry: f64,
    #[napi]
    pub rz: f64,
}

impl Position {
    pub fn new(x: f64, y: f64, z: f64, rx: f64, ry: f64, rz: f64) -> Self {
        Self { x, y, z, rx, ry, rz }
    }

    pub fn zero() -> Self {
        Self::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    }

    pub fn lerp(&self, other: &Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
            rx: self.rx + (other.rx - self.rx) * t,
            ry: self.ry + (other.ry - self.ry) * t,
            rz: self.rz + (other.rz - self.rz) * t,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AnimationStateStruct {
    #[napi]
    pub state: AnimationState,
    #[napi]
    pub position: Position,
    #[napi]
    pub time: f64,
}

impl Default for AnimationStateStruct {
    fn default() -> Self {
        Self {
            state: AnimationState::Stopped,
            position: Position::zero(),
            time: 0.0,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum AnimationTypeEnum {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}

pub trait AnimationModel: Send + Sync {
    fn update(&mut self, dt: Duration) -> AnimatorResult<Position>;
    fn reset(&mut self);
    fn is_finished(&self) -> bool;
    fn get_current_position(&self) -> Position;
    fn clone_box(&self) -> Box<dyn AnimationModel>;
}

impl Clone for Box<dyn AnimationModel> {
    fn clone(&self) -> Self {
        self.clone_box()
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    #[napi]
    pub state: AnimationStateStruct,
    #[napi]
    pub animation_type: AnimationTypeEnum,
    #[napi]
    pub start_position: Position,
    #[napi]
    pub end_position: Position,
    #[napi]
    pub duration: Duration,
    #[napi]
    pub elapsed: Duration,
}

impl Animation {
    pub fn new(
        animation_type: AnimationTypeEnum,
        start_position: Position,
        end_position: Position,
        duration: Duration,
    ) -> Self {
        Self {
            state: AnimationStateStruct::default(),
            animation_type,
            start_position,
            end_position,
            duration,
            elapsed: Duration::from_secs(0),
        }
    }

    pub fn update(&mut self, dt: Duration) -> AnimatorResult<Position> {
        if self.state.state != AnimationState::Playing {
            return Ok(self.state.position);
        }

        self.elapsed += dt;
        if self.elapsed >= self.duration {
            self.state.state = AnimationState::Stopped;
            self.state.position = self.end_position;
            return Ok(self.end_position);
        }

        let progress = self.elapsed.as_secs_f64() / self.duration.as_secs_f64();
        let t = match self.animation_type {
            AnimationTypeEnum::Linear => progress,
            AnimationTypeEnum::EaseIn => progress * progress,
            AnimationTypeEnum::EaseOut => 1.0 - (1.0 - progress) * (1.0 - progress),
            AnimationTypeEnum::EaseInOut => {
                if progress < 0.5 {
                    2.0 * progress * progress
                } else {
                    1.0 - (-2.0 * progress + 2.0).powi(2) / 2.0
                }
            }
        };

        self.state.position = self.start_position.lerp(&self.end_position, t);
        self.state.time = progress;
        Ok(self.state.position)
    }

    pub fn play(&mut self) {
        self.state.state = AnimationState::Playing;
    }

    pub fn pause(&mut self) {
        self.state.state = AnimationState::Paused;
    }

    pub fn stop(&mut self) {
        self.state.state = AnimationState::Stopped;
        self.elapsed = Duration::from_secs(0);
        self.state.position = self.start_position;
        self.state.time = 0.0;
    }

    pub fn is_finished(&self) -> bool {
        self.state.state == AnimationState::Stopped
    }
}

impl AnimationModel for Animation {
    fn update(&mut self, dt: Duration) -> AnimatorResult<Position> {
        self.update(dt)
    }

    fn reset(&mut self) {
        self.stop();
    }

    fn is_finished(&self) -> bool {
        self.is_finished()
    }

    fn get_current_position(&self) -> Position {
        self.state.position
    }

    fn clone_box(&self) -> Box<dyn AnimationModel> {
        Box::new(self.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_animation_state() {
        let mut animation = Animation::new(
            AnimationTypeEnum::Linear,
            Position::zero(),
            Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0),
            Duration::from_secs(1),
        );

        assert_eq!(animation.state.state, AnimationState::Stopped);
        animation.play();
        assert_eq!(animation.state.state, AnimationState::Playing);
        animation.pause();
        assert_eq!(animation.state.state, AnimationState::Paused);
        animation.stop();
        assert_eq!(animation.state.state, AnimationState::Stopped);
    }

    #[test]
    fn test_animation_update() {
        let mut animation = Animation::new(
            AnimationTypeEnum::Linear,
            Position::zero(),
            Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0),
            Duration::from_secs(1),
        );

        animation.play();
        let pos = animation.update(Duration::from_millis(500)).unwrap();
        assert!((pos.x - 0.5).abs() < f64::EPSILON);
        assert!((pos.y - 0.5).abs() < f64::EPSILON);
        assert!((pos.z - 0.5).abs() < f64::EPSILON);

        let pos = animation.update(Duration::from_millis(500)).unwrap();
        assert!((pos.x - 1.0).abs() < f64::EPSILON);
        assert!((pos.y - 1.0).abs() < f64::EPSILON);
        assert!((pos.z - 1.0).abs() < f64::EPSILON);
        assert!(animation.is_finished());
    }
}
