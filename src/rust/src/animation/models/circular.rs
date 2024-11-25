use std::f64::consts::PI;
use super::{AnimationModel, AnimationParameters, easing};
use crate::models::Position;

/// Parameters specific to circular movement
#[derive(Debug, Clone)]
pub struct CircularParams {
    pub radius: f64,
    pub start_angle: f64,
    pub end_angle: f64,
    pub clockwise: bool,
    pub center: Position,
}

impl Default for CircularParams {
    fn default() -> Self {
        Self {
            radius: 1.0,
            start_angle: 0.0,
            end_angle: 2.0 * PI,
            clockwise: true,
            center: Position::default(),
        }
    }
}

/// Circular movement animation model
pub struct CircularModel {
    params: AnimationParameters,
    circular_params: CircularParams,
    easing_fn: fn(f64) -> f64,
}

impl CircularModel {
    pub fn new(params: AnimationParameters, circular_params: CircularParams) -> Self {
        Self {
            params,
            circular_params,
            easing_fn: easing::linear,
        }
    }

    pub fn with_easing(mut self, easing_fn: fn(f64) -> f64) -> Self {
        self.easing_fn = easing_fn;
        self
    }

    fn calculate_angle(&self, t: f64) -> f64 {
        let start = self.circular_params.start_angle;
        let end = self.circular_params.end_angle;
        let angle_diff = if self.circular_params.clockwise {
            if end < start { end + 2.0 * PI - start } else { end - start }
        } else {
            if start < end { start + 2.0 * PI - end } else { start - end }
        };

        let current_angle = start + angle_diff * t;
        if self.circular_params.clockwise {
            current_angle
        } else {
            start - (current_angle - start)
        }
    }
}

impl AnimationModel for CircularModel {
    fn calculate_position(&self, time: f64) -> Position {
        let t = (time / self.params.duration).min(1.0).max(0.0);
        let eased_t = (self.easing_fn)(t);
        
        // Calculate current angle
        let angle = self.calculate_angle(eased_t);
        
        // Calculate position on circle
        let x = self.circular_params.center.x + 
                self.circular_params.radius * angle.cos();
        let y = self.circular_params.center.y + 
                self.circular_params.radius * angle.sin();
        
        Position {
            x,
            y,
            z: self.circular_params.center.z, // Z remains constant in circular motion
        }
    }

    fn get_duration(&self) -> f64 {
        self.params.duration
    }

    fn reset(&mut self) {
        // No state to reset for circular model
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_model() -> CircularModel {
        let params = AnimationParameters {
            start_position: Position::default(),
            end_position: Position::default(),
            duration: 2.0,
            speed: 1.0,
            acceleration: None,
            custom_params: vec![],
        };

        let circular_params = CircularParams {
            radius: 1.0,
            start_angle: 0.0,
            end_angle: PI,
            clockwise: true,
            center: Position::default(),
        };

        CircularModel::new(params, circular_params)
    }

    #[test]
    fn test_circular_movement() {
        let model = create_test_model();
        
        // Test start position (radius = 1.0, angle = 0)
        let pos = model.calculate_position(0.0);
        assert!((pos.x - 1.0).abs() < 1e-10); // cos(0) = 1
        assert!(pos.y.abs() < 1e-10);         // sin(0) = 0
        
        // Test middle position (radius = 1.0, angle = π/2)
        let pos = model.calculate_position(1.0);
        assert!(pos.x.abs() < 1e-10);         // cos(π/2) = 0
        assert!((pos.y - 1.0).abs() < 1e-10); // sin(π/2) = 1
        
        // Test end position (radius = 1.0, angle = π)
        let pos = model.calculate_position(2.0);
        assert!((pos.x + 1.0).abs() < 1e-10); // cos(π) = -1
        assert!(pos.y.abs() < 1e-10);         // sin(π) = 0
    }

    #[test]
    fn test_counter_clockwise() {
        let mut circular_params = CircularParams::default();
        circular_params.clockwise = false;
        
        let params = AnimationParameters::default();
        let model = CircularModel::new(params, circular_params);
        
        // Test movement direction
        let pos1 = model.calculate_position(0.25);
        let pos2 = model.calculate_position(0.5);
        
        // In counter-clockwise motion, y should decrease from pos1 to pos2
        assert!(pos2.y < pos1.y);
    }

    #[test]
    fn test_custom_center() {
        let mut circular_params = CircularParams::default();
        circular_params.center = Position { x: 1.0, y: 2.0, z: 3.0 };
        
        let params = AnimationParameters::default();
        let model = CircularModel::new(params, circular_params);
        
        let pos = model.calculate_position(0.0);
        assert_eq!(pos.z, 3.0); // Z should match center
        assert!((pos.x - 2.0).abs() < 1e-10); // Center.x + radius
        assert_eq!(pos.y, 2.0); // Center.y + 0
    }
}
