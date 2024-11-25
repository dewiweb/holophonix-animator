mod linear;
mod circular;
mod pattern;
mod custom_path;

pub use linear::LinearModel;
pub use circular::CircularModel;
pub use pattern::PatternModel;
pub use custom_path::CustomPathModel;

use crate::models::Position;

/// Common traits for all animation models
pub trait AnimationModel {
    /// Calculate position at given time
    fn calculate_position(&self, time: f64) -> Position;
    
    /// Get the duration of the animation
    fn get_duration(&self) -> f64;
    
    /// Check if the animation is complete
    fn is_complete(&self, time: f64) -> bool {
        time >= self.get_duration()
    }
    
    /// Reset the animation state
    fn reset(&mut self);
}

/// Parameters that can be animated
#[derive(Debug, Clone)]
pub enum AnimationParameter {
    Position(Position),
    Speed(f64),
    Acceleration(f64),
    Radius(f64),
    Angle(f64),
    Custom(String, f64),
}

/// Common parameters for all animation models
#[derive(Debug, Clone)]
pub struct AnimationParameters {
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub speed: f64,
    pub acceleration: Option<f64>,
    pub custom_params: Vec<(String, f64)>,
}

impl Default for AnimationParameters {
    fn default() -> Self {
        Self {
            start_position: Position::default(),
            end_position: Position::default(),
            duration: 1.0,
            speed: 1.0,
            acceleration: None,
            custom_params: Vec::new(),
        }
    }
}

/// Easing functions for smooth animations
pub mod easing {
    pub fn linear(t: f64) -> f64 {
        t
    }
    
    pub fn ease_in_quad(t: f64) -> f64 {
        t * t
    }
    
    pub fn ease_out_quad(t: f64) -> f64 {
        t * (2.0 - t)
    }
    
    pub fn ease_in_out_quad(t: f64) -> f64 {
        if t < 0.5 {
            2.0 * t * t
        } else {
            -1.0 + (4.0 - 2.0 * t) * t
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestModel {
        duration: f64,
    }

    impl AnimationModel for TestModel {
        fn calculate_position(&self, _time: f64) -> Position {
            Position::default()
        }

        fn get_duration(&self) -> f64 {
            self.duration
        }

        fn reset(&mut self) {}
    }

    #[test]
    fn test_is_complete() {
        let model = TestModel { duration: 2.0 };
        assert!(!model.is_complete(1.0));
        assert!(model.is_complete(2.0));
        assert!(model.is_complete(3.0));
    }

    #[test]
    fn test_easing_functions() {
        // Test linear
        assert_eq!(easing::linear(0.5), 0.5);
        
        // Test ease_in_quad
        assert!(easing::ease_in_quad(0.5) < 0.5);
        
        // Test ease_out_quad
        assert!(easing::ease_out_quad(0.5) > 0.5);
        
        // Test ease_in_out_quad
        assert_eq!(easing::ease_in_out_quad(0.5), 0.5);
    }
}
