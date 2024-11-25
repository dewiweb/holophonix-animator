use super::{AnimationModel, AnimationParameters, easing};
use crate::models::Position;

/// Types of patterns available for animation
#[derive(Debug, Clone, PartialEq)]
pub enum PatternType {
    /// Figure-8 pattern
    Figure8,
    /// Spiral pattern
    Spiral,
    /// Lissajous pattern
    Lissajous,
    /// Custom pattern defined by parametric equations
    Custom(Box<dyn Fn(f64) -> (f64, f64, f64)>),
}

/// Parameters specific to pattern movement
#[derive(Debug, Clone)]
pub struct PatternParams {
    pub pattern_type: PatternType,
    pub scale: Position,
    pub offset: Position,
    pub frequency: Position,
    pub phase: Position,
}

impl Default for PatternParams {
    fn default() -> Self {
        Self {
            pattern_type: PatternType::Figure8,
            scale: Position { x: 1.0, y: 1.0, z: 1.0 },
            offset: Position::default(),
            frequency: Position { x: 1.0, y: 1.0, z: 1.0 },
            phase: Position::default(),
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

    fn calculate_figure8(&self, t: f64) -> (f64, f64, f64) {
        let angle = 2.0 * std::f64::consts::PI * t;
        let x = angle.sin();
        let y = angle.sin() * angle.cos();
        let z = 0.0;
        (x, y, z)
    }

    fn calculate_spiral(&self, t: f64) -> (f64, f64, f64) {
        let angle = 2.0 * std::f64::consts::PI * t;
        let radius = t;
        let x = angle.cos() * radius;
        let y = angle.sin() * radius;
        let z = t * self.pattern_params.scale.z;
        (x, y, z)
    }

    fn calculate_lissajous(&self, t: f64) -> (f64, f64, f64) {
        let freq = &self.pattern_params.frequency;
        let phase = &self.pattern_params.phase;
        let angle = 2.0 * std::f64::consts::PI * t;
        
        let x = (angle * freq.x + phase.x).sin();
        let y = (angle * freq.y + phase.y).sin();
        let z = (angle * freq.z + phase.z).sin();
        (x, y, z)
    }

    fn apply_pattern_transform(&self, pos: (f64, f64, f64)) -> Position {
        let scale = &self.pattern_params.scale;
        let offset = &self.pattern_params.offset;
        
        Position {
            x: pos.0 * scale.x + offset.x,
            y: pos.1 * scale.y + offset.y,
            z: pos.2 * scale.z + offset.z,
        }
    }
}

impl AnimationModel for PatternModel {
    fn calculate_position(&self, time: f64) -> Position {
        let t = (time / self.params.duration).min(1.0).max(0.0);
        let eased_t = (self.easing_fn)(t);
        
        let raw_position = match &self.pattern_params.pattern_type {
            PatternType::Figure8 => self.calculate_figure8(eased_t),
            PatternType::Spiral => self.calculate_spiral(eased_t),
            PatternType::Lissajous => self.calculate_lissajous(eased_t),
            PatternType::Custom(f) => f(eased_t),
        };
        
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

        let pattern_params = PatternParams::default();
        PatternModel::new(params, pattern_params)
    }

    #[test]
    fn test_figure8_pattern() {
        let model = create_test_model();
        
        // Test start position
        let pos = model.calculate_position(0.0);
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        
        // Test quarter cycle
        let pos = model.calculate_position(0.5);
        assert!((pos.x - 1.0).abs() < 1e-10);
        assert!(pos.y.abs() < 1e-10);
    }

    #[test]
    fn test_custom_pattern() {
        let mut pattern_params = PatternParams::default();
        pattern_params.pattern_type = PatternType::Custom(Box::new(|t| {
            (t, t * t, 0.0)
        }));
        
        let params = AnimationParameters::default();
        let model = PatternModel::new(params, pattern_params);
        
        let pos = model.calculate_position(0.5);
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!((pos.y - 0.25).abs() < 1e-10);
    }

    #[test]
    fn test_pattern_transform() {
        let mut pattern_params = PatternParams::default();
        pattern_params.scale = Position { x: 2.0, y: 2.0, z: 1.0 };
        pattern_params.offset = Position { x: 1.0, y: 1.0, z: 0.0 };
        
        let params = AnimationParameters::default();
        let model = PatternModel::new(params, pattern_params);
        
        let pos = model.calculate_position(0.25);
        assert!(pos.x > 1.0); // Should be scaled and offset
        assert!(pos.y > 1.0);
    }
}
