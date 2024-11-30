use std::time::Instant;
use napi::Result;
use napi::Error;

use super::{AnimationModel, Position};

#[derive(Debug)]
pub struct LinearModel {
    start_position: Position,
    end_position: Position,
    duration: f64,
    start_time: Option<Instant>,
    is_complete: bool,
}

impl LinearModel {
    pub fn new(start_position: Position, end_position: Position, duration: f64) -> Result<Self> {
        if duration <= 0.0 {
            return Err(Error::from_reason("Duration must be positive"));
        }

        Ok(Self {
            start_position,
            end_position,
            duration,
            start_time: None,
            is_complete: false,
        })
    }
}

impl AnimationModel for LinearModel {
    fn start(&mut self) -> Result<()> {
        if self.start_time.is_some() {
            return Err(Error::from_reason("Animation already running"));
        }
        self.start_time = Some(Instant::now());
        self.is_complete = false;
        Ok(())
    }

    fn stop(&mut self) -> Result<()> {
        if self.start_time.is_none() {
            return Err(Error::from_reason("Animation not running"));
        }
        self.start_time = None;
        self.is_complete = true;
        Ok(())
    }

    fn update(&mut self, time: f64) -> Result<Position> {
        if self.is_complete {
            return Ok(self.end_position.clone());
        }

        if time < 0.0 {
            return Err(Error::from_reason("Time must be non-negative"));
        }

        let elapsed = match self.start_time {
            Some(start) => start.elapsed().as_secs_f64(),
            None => return Err(Error::from_reason("Animation not started")),
        };

        let progress = (elapsed / self.duration).min(1.0);
        
        if progress >= 1.0 {
            self.is_complete = true;
            return Ok(self.end_position.clone());
        }

        Ok(Position::lerp(&self.start_position, &self.end_position, progress))
    }

    fn is_complete(&self) -> Result<bool> {
        Ok(self.is_complete)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_model() {
        let mut model = LinearModel::new(
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            10.0,
        ).unwrap();

        // Test initial state
        assert!(!model.is_complete().unwrap());
        
        // Test start
        model.start().unwrap();
        assert!(!model.is_complete().unwrap());

        // Test update at 50%
        let pos = model.update(5.0).unwrap();
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 5.0);
        assert_eq!(pos.z, 5.0);
        assert!(!model.is_complete().unwrap());

        // Test update at completion
        let pos = model.update(10.0).unwrap();
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 10.0);
        assert_eq!(pos.z, 10.0);
        assert!(model.is_complete().unwrap());

        // Test stop
        model.stop().unwrap();
        assert!(model.is_complete().unwrap());
    }
}
