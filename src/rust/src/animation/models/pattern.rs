use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use crate::models::common::{Position, Animation, AnimationConfig};
use super::{AnimationModel, easing};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternModel {
    pub id: String,
    pub animation: Animation,
    pub position: Position,
    pub center: Position,
    pub scale: f64,
    pub rotation: f64,
}

impl ObjectFinalize for PatternModel {}

#[napi]
impl PatternModel {
    #[napi(constructor)]
    pub fn new(id: String, animation: Animation, center: Position, scale: f64, rotation: f64) -> Self {
        Self {
            id,
            animation,
            position: center,
            center,
            scale,
            rotation,
        }
    }

    fn apply_pattern_transform(&self, progress: f64) -> Position {
        let angle = progress * 2.0 * std::f64::consts::PI + self.rotation;
        Position {
            x: self.center.x + self.scale * angle.cos(),
            y: self.center.y + self.scale * angle.sin(),
            z: self.center.z,
        }
    }
}

impl AnimationModel for PatternModel {
    fn get_id(&self) -> &str {
        &self.id
    }

    fn get_animation(&self) -> &Animation {
        &self.animation
    }

    fn get_position(&self) -> Position {
        self.position
    }

    fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        self.animation.update(delta_time)?;
        if self.animation.is_playing {
            let progress = self.animation.get_progress();
            self.position = self.apply_pattern_transform(progress);
        }
        Ok(())
    }

    fn start(&mut self) {
        self.animation.start();
    }

    fn stop(&mut self) {
        self.animation.stop();
    }

    fn pause(&mut self) {
        self.animation.pause();
    }

    fn resume(&mut self) {
        self.animation.resume();
    }

    fn reset(&mut self) {
        self.animation.reset();
        self.position = self.center;
    }

    fn is_complete(&self) -> bool {
        self.animation.is_complete()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::consts::PI;

    fn create_test_model() -> PatternModel {
        let config = AnimationConfig::new(
            0.0,
            1.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 0.0),
            "linear".to_string(),
        );

        let animation = Animation::new(config, "test".to_string());
        let center = Position::new(0.0, 0.0, 0.0);

        PatternModel::new(
            "test".to_string(),
            animation,
            center,
            1.0,
            0.0,
        )
    }

    #[test]
    fn test_pattern_movement() -> napi::Result<()> {
        let mut model = create_test_model();
        model.start();

        // Test at start (0 radians)
        model.animation.current_time = 0.0;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, 1.0); // cos(0) = 1
        assert_eq!(pos.y, 0.0); // sin(0) = 0
        assert_eq!(pos.z, 0.0);

        // Test at quarter circle (PI/2 radians)
        model.animation.current_time = 0.25;
        model.update(0.0)?;
        let pos = model.get_position();
        assert!(pos.x.abs() < 1e-10); // cos(PI/2) ≈ 0
        assert_eq!(pos.y, 1.0);       // sin(PI/2) = 1
        assert_eq!(pos.z, 0.0);

        // Test at half circle (PI radians)
        model.animation.current_time = 0.5;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, -1.0);      // cos(PI) = -1
        assert!(pos.y.abs() < 1e-10); // sin(PI) ≈ 0
        assert_eq!(pos.z, 0.0);

        Ok(())
    }

    #[test]
    fn test_with_rotation() -> napi::Result<()> {
        let mut model = PatternModel::new(
            "test".to_string(),
            Animation::new(
                AnimationConfig::new(
                    0.0,
                    1.0,
                    Position::new(0.0, 0.0, 0.0),
                    Position::new(1.0, 1.0, 0.0),
                    "linear".to_string(),
                ),
                "test".to_string(),
            ),
            Position::new(0.0, 0.0, 0.0),
            1.0,
            PI / 2.0, // 90 degree rotation
        );

        model.start();
        model.animation.current_time = 0.0;
        model.update(0.0)?;
        let pos = model.get_position();
        assert!(pos.x.abs() < 1e-10); // cos(PI/2) ≈ 0
        assert_eq!(pos.y, 1.0);       // sin(PI/2) = 1

        Ok(())
    }
}
