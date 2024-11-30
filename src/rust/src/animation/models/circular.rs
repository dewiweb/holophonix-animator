use std::time::Instant;
use std::f64::consts::PI;
use napi::Result;

use crate::position::Position;
use crate::animation::AnimationModel;

#[derive(Debug)]
pub struct CircularModel {
    center: Position,
    radius: f64,
    duration: f64,
    start_time: Option<Instant>,
    is_complete: bool,
}

impl CircularModel {
    pub fn new(center: Position, radius: f64, duration: f64) -> Self {
        Self {
            center,
            radius,
            duration,
            start_time: None,
            is_complete: false,
        }
    }

    fn calculate_position(&self, angle: f64) -> Position {
        let x = self.center.x + self.radius * angle.cos();
        let z = self.center.z + self.radius * angle.sin();
        Position::new(x, self.center.y, z)
    }
}

impl AnimationModel for CircularModel {
    fn start(&mut self) -> Result<()> {
        self.start_time = Some(Instant::now());
        self.is_complete = false;
        Ok(())
    }

    fn stop(&mut self) -> Result<()> {
        self.start_time = None;
        self.is_complete = true;
        Ok(())
    }

    fn update(&mut self, _time: f64) -> Result<Position> {
        if self.is_complete {
            return Ok(self.calculate_position(2.0 * PI));
        }

        let elapsed = match self.start_time {
            Some(start) => start.elapsed().as_secs_f64(),
            None => 0.0,
        };

        let progress = (elapsed / self.duration).min(1.0);
        
        if progress >= 1.0 {
            self.is_complete = true;
            return Ok(self.calculate_position(2.0 * PI));
        }

        let angle = progress * 2.0 * PI;
        Ok(self.calculate_position(angle))
    }

    fn is_complete(&self) -> Result<bool> {
        Ok(self.is_complete)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circular_model() {
        let mut model = CircularModel::new(
            Position::new(0.0, 0.0, 0.0),
            10.0,
            10.0,
        );

        // Test initial state
        assert!(!model.is_complete().unwrap());

        // Test start
        model.start().unwrap();
        assert!(!model.is_complete().unwrap());

        // Test quarter circle (90 degrees)
        let pos = model.update(2.5).unwrap();
        assert!(approx_eq(pos.x, 0.0));
        assert_eq!(pos.y, 0.0);
        assert!(approx_eq(pos.z, 10.0));

        // Test half circle (180 degrees)
        let pos = model.update(5.0).unwrap();
        assert!(approx_eq(pos.x, -10.0));
        assert_eq!(pos.y, 0.0);
        assert!(approx_eq(pos.z, 0.0));

        // Test completion (360 degrees)
        let pos = model.update(10.0).unwrap();
        assert!(approx_eq(pos.x, 10.0));
        assert_eq!(pos.y, 0.0);
        assert!(approx_eq(pos.z, 0.0));
        assert!(model.is_complete().unwrap());

        // Test stop
        model.stop().unwrap();
        assert!(model.is_complete().unwrap());
    }

    fn approx_eq(a: f64, b: f64) -> bool {
        (a - b).abs() < 0.001
    }
}
