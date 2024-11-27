use crate::error::AnimatorResult;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct AnimationCycle {
    pub duration: Duration,
    pub repeat: bool,
    pub reverse: bool,
    pub current_time: Duration,
    pub direction: i8,
}

impl AnimationCycle {
    pub fn new(duration: Duration, repeat: bool, reverse: bool) -> Self {
        Self {
            duration,
            repeat,
            reverse,
            current_time: Duration::from_secs(0),
            direction: 1,
        }
    }

    pub fn update(&mut self, dt: Duration) -> AnimatorResult<bool> {
        self.current_time += dt;

        if self.current_time >= self.duration {
            if !self.repeat {
                return Ok(true);
            }

            if self.reverse {
                self.direction *= -1;
                self.current_time = if self.direction > 0 {
                    Duration::from_secs(0)
                } else {
                    self.duration
                };
            } else {
                self.current_time = Duration::from_secs(0);
            }
        }

        Ok(false)
    }

    pub fn progress(&self) -> f64 {
        let progress = self.current_time.as_secs_f64() / self.duration.as_secs_f64();
        if self.direction < 0 {
            1.0 - progress
        } else {
            progress
        }
    }

    pub fn reset(&mut self) {
        self.current_time = Duration::from_secs(0);
        self.direction = 1;
    }
}
