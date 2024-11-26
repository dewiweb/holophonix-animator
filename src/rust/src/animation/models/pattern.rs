use super::{AnimationModel, AnimationParameters, easing};
use crate::models::Position;
use std::fmt;
use std::sync::Arc;

/// Types of patterns available for animation
#[derive(Clone)]
pub enum PatternType {
    /// Linear pattern
    Linear,
    /// Circular pattern
    Circular { radius: f64 },
    /// Spiral pattern
    Spiral { radius: f64, turns: f64 },
    /// Custom pattern defined by parametric equations
    Custom(Arc<dyn Fn(f64) -> Position + Send + Sync + 'static>),
}

impl fmt::Debug for PatternType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PatternType::Linear => write!(f, "Linear"),
            PatternType::Circular { radius } => write!(f, "Circular {{ radius: {} }}", radius),
            PatternType::Spiral { radius, turns } => write!(f, "Spiral {{ radius: {}, turns: {} }}", radius, turns),
            PatternType::Custom(_) => write!(f, "Custom(...)"),
        }
    }
}

impl PartialEq for PatternType {
    fn eq(&self, other: &Self) -> bool {
        match (self, other) {
            (PatternType::Linear, PatternType::Linear) => true,
            (PatternType::Circular { radius: r1 }, PatternType::Circular { radius: r2 }) => (r1 - r2).abs() < 1e-10,
            (PatternType::Spiral { radius: r1, turns: t1 }, PatternType::Spiral { radius: r2, turns: t2 }) => (r1 - r2).abs() < 1e-10 && (t1 - t2).abs() < 1e-10,
            (PatternType::Custom(_), PatternType::Custom(_)) => false, // Custom functions can't be compared
            _ => false,
        }
    }
}

/// Parameters specific to pattern movement
#[derive(Debug, Clone)]
pub struct PatternParams {
    pub pattern_type: PatternType,
    pub frequency: f64,
    pub amplitude: f64,
    pub phase: f64,
    pub scale: Position,
    pub offset: Position,
}

impl PatternParams {
    pub fn new(pattern_type: PatternType) -> Self {
        Self {
            pattern_type,
            frequency: 1.0,
            amplitude: 1.0,
            phase: 0.0,
            scale: Position { x: 1.0, y: 1.0, z: 1.0 },
            offset: Position::default(),
        }
    }

    pub fn evaluate(&self, t: f64) -> Position {
        let t = t * self.frequency + self.phase;
        let result = match &self.pattern_type {
            PatternType::Linear => {
                Position { x: t, y: 0.0, z: 0.0 }
            },
            PatternType::Circular { radius } => {
                let angle = 2.0 * std::f64::consts::PI * t;
                Position { x: radius * angle.cos(), y: radius * angle.sin(), z: 0.0 }
            },
            PatternType::Spiral { radius, turns } => {
                let angle = 2.0 * std::f64::consts::PI * t * turns;
                let r = radius * t;
                Position { x: r * angle.cos(), y: r * angle.sin(), z: 0.0 }
            },
            PatternType::Custom(func) => func(t),
        };
        
        Position {
            x: result.x * self.amplitude,
            y: result.y * self.amplitude,
            z: result.z * self.amplitude,
        }
    }
}

/// Pattern-based movement animation model
pub struct PatternModel {
    params: AnimationParameters,
    pattern_params: PatternParams,
    easing_fn: fn(f64) -> f64,
}

impl PatternModel {
    pub fn new(params: AnimationParameters, pattern_params: PatternParams) -> Self {
        Self {
            params,
            pattern_params,
            easing_fn: easing::linear,
        }
    }

    pub fn with_easing(mut self, easing_fn: fn(f64) -> f64) -> Self {
        self.easing_fn = easing_fn;
        self
    }

    fn apply_pattern_transform(&self, pos: Position) -> Position {
        let scale = &self.pattern_params.scale;
        let offset = &self.pattern_params.offset;
        
        Position {
            x: pos.x * scale.x + offset.x,
            y: pos.y * scale.y + offset.y,
            z: pos.z * scale.z + offset.z,
        }
    }
}

impl AnimationModel for PatternModel {
    fn calculate_position(&self, time: f64) -> Position {
        let t = (time / self.params.duration).min(1.0).max(0.0);
        let eased_t = (self.easing_fn)(t);
        
        let raw_position = self.pattern_params.evaluate(eased_t);
        
        self.apply_pattern_transform(raw_position)
    }

    fn get_duration(&self) -> f64 {
        self.params.duration
    }

    fn reset(&mut self) {
        // No state to reset for pattern model
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_model() -> PatternModel {
        let params = AnimationParameters {
            start_position: Position::default(),
            end_position: Position::default(),
            duration: 2.0,
            speed: 1.0,
            acceleration: None,
            custom_params: vec![],
        };

        let pattern_params = PatternParams::new(PatternType::Linear);
        PatternModel::new(params, pattern_params)
    }

    #[test]
    fn test_linear_pattern() {
        let model = create_test_model();
        
        // Test start position
        let pos = model.calculate_position(0.0);
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        
        // Test quarter cycle
        let pos = model.calculate_position(0.5);
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!(pos.y.abs() < 1e-10);
    }

    #[test]
    fn test_custom_pattern() {
        let mut pattern_params = PatternParams::new(PatternType::Custom(Arc::new(|t| {
            Position { x: t, y: t * t, z: 0.0 }
        })));
        
        let params = AnimationParameters::default();
        let model = PatternModel::new(params, pattern_params);
        
        let pos = model.calculate_position(0.5);
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!((pos.y - 0.25).abs() < 1e-10);
    }

    #[test]
    fn test_pattern_transform() {
        let mut pattern_params = PatternParams::new(PatternType::Linear);
        pattern_params.scale = Position { x: 2.0, y: 2.0, z: 1.0 };
        pattern_params.offset = Position { x: 1.0, y: 1.0, z: 0.0 };
        
        let params = AnimationParameters::default();
        let model = PatternModel::new(params, pattern_params);
        
        let pos = model.calculate_position(0.25);
        assert!(pos.x > 1.0); // Should be scaled and offset
        assert!(pos.y > 1.0);
    }
}
