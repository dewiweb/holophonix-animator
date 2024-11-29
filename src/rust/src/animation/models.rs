use napi::bindgen_prelude::*;
use std::time::Instant;
use crate::models::position::Position;

#[napi]
#[derive(Debug, Clone)]
pub struct Animation {
    pub id: String,
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub is_playing: bool,
    pub is_paused: bool,
    pub is_looping: bool,
    pub speed: f64,
    #[napi(skip)]
    pub start_time: Option<Instant>,
    pub elapsed_time: f64,
}

impl ObjectFinalize for Animation {}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String, start_pos: Position, end_pos: Position, duration: f64) -> Self {
        Self {
            id,
            start_position: start_pos,
            end_position: end_pos,
            duration,
            is_playing: false,
            is_paused: false,
            is_looping: false,
            speed: 1.0,
            start_time: None,
            elapsed_time: 0.0,
        }
    }

    #[napi]
    pub fn start(&mut self) {
        if !self.is_playing {
            self.is_playing = true;
            self.is_paused = false;
            self.start_time = Some(Instant::now());
        }
    }

    #[napi]
    pub fn pause(&mut self) {
        if self.is_playing && !self.is_paused {
            self.is_paused = true;
            if let Some(start) = self.start_time {
                self.elapsed_time += start.elapsed().as_secs_f64();
            }
        }
    }

    #[napi]
    pub fn resume(&mut self) {
        if self.is_playing && self.is_paused {
            self.is_paused = false;
            self.start_time = Some(Instant::now());
        }
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_playing = false;
        self.is_paused = false;
        self.start_time = None;
        self.elapsed_time = 0.0;
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> Position {
        if !self.is_playing || self.is_paused {
            return self.start_position.clone();
        }

        let elapsed = if let Some(start) = self.start_time {
            start.elapsed().as_secs_f64() * self.speed
        } else {
            0.0
        };

        let progress = (elapsed / self.duration).min(1.0);

        if progress >= 1.0 {
            if self.is_looping {
                self.start_time = Some(Instant::now());
                return self.start_position.clone();
            } else {
                self.stop();
                return self.end_position.clone();
            }
        }

        // Linear interpolation between start and end positions
        Position {
            x: self.start_position.x + (self.end_position.x - self.start_position.x) * progress,
            y: self.start_position.y + (self.end_position.y - self.start_position.y) * progress,
            z: self.start_position.z + (self.end_position.z - self.start_position.z) * progress,
        }
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }

    #[napi]
    pub fn set_looping(&mut self, looping: bool) {
        self.is_looping = looping;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation_lifecycle() {
        let mut animation = Animation::new(
            "test".to_string(),
            Position { x: 0.0, y: 0.0, z: 0.0 },
            Position { x: 1.0, y: 1.0, z: 1.0 },
            1.0,
        );

        assert!(!animation.is_playing);
        assert!(!animation.is_paused);

        animation.start();
        assert!(animation.is_playing);
        assert!(!animation.is_paused);

        animation.pause();
        assert!(animation.is_playing);
        assert!(animation.is_paused);

        animation.resume();
        assert!(animation.is_playing);
        assert!(!animation.is_paused);

        animation.stop();
        assert!(!animation.is_playing);
        assert!(!animation.is_paused);
    }
}
