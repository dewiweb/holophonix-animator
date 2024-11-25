use super::{AnimationModel, AnimationParameters, easing};
use crate::models::Position;

/// Linear movement animation model
pub struct LinearModel {
    params: AnimationParameters,
    easing_fn: fn(f64) -> f64,
}

impl LinearModel {
    pub fn new(params: AnimationParameters) -> Self {
        Self {
            params,
            easing_fn: easing::linear,
        }
    }

    pub fn with_easing(mut self, easing_fn: fn(f64) -> f64) -> Self {
        self.easing_fn = easing_fn;
        self
    }

    fn interpolate(&self, start: f64, end: f64, t: f64) -> f64 {
        let eased_t = (self.easing_fn)(t);
        start + (end - start) * eased_t
    }
}

impl AnimationModel for LinearModel {
    fn calculate_position(&self, time: f64) -> Position {
        let t = (time / self.params.duration).min(1.0).max(0.0);
        
        // Apply acceleration if specified
        let t = if let Some(accel) = self.params.acceleration {
            t * t * accel
        } else {
            t
        };

        Position {
            x: self.interpolate(
                self.params.start_position.x,
                self.params.end_position.x,
                t
            ),
            y: self.interpolate(
                self.params.start_position.y,
                self.params.end_position.y,
                t
            ),
            z: self.interpolate(
                self.params.start_position.z,
                self.params.end_position.z,
                t
            ),
        }
    }

    fn get_duration(&self) -> f64 {
        self.params.duration
    }

    fn reset(&mut self) {
        // No state to reset for linear model
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_model() -> LinearModel {
        let params = AnimationParameters {
            start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
            end_position: Position { x: 10.0, y: 20.0, z: 30.0 },
            duration: 2.0,
            speed: 1.0,
            acceleration: None,
            custom_params: vec![],
        };
        LinearModel::new(params)
    }

    #[test]
    fn test_linear_interpolation() {
        let model = create_test_model();
        
        // Test start position
        let pos = model.calculate_position(0.0);
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);
        
        // Test middle position
        let pos = model.calculate_position(1.0);
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 10.0);
        assert_eq!(pos.z, 15.0);
        
        // Test end position
        let pos = model.calculate_position(2.0);
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 20.0);
        assert_eq!(pos.z, 30.0);
    }

    #[test]
    fn test_with_easing() {
        let model = create_test_model().with_easing(easing::ease_in_quad);
        
        // Test middle position with easing
        let pos = model.calculate_position(1.0);
        assert!(pos.x < 5.0); // Should be less than linear due to ease-in
    }

    #[test]
    fn test_duration() {
        let model = create_test_model();
        assert_eq!(model.get_duration(), 2.0);
    }
}
