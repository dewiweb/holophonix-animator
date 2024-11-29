use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;
use crate::models::common::{Position, Animation};
use super::AnimationModel;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircularModel {
    pub id: String,
    pub animation: Animation,
    pub position: Position,
    pub center: Position,
    pub radius: f64,
    pub start_angle: f64,
    pub end_angle: f64,
}

impl ObjectFinalize for CircularModel {}

#[napi]
impl CircularModel {
    #[napi(constructor)]
    pub fn new(id: String, animation: Animation, center: Position, radius: f64, start_angle: f64, end_angle: f64) -> Self {
        Self {
            id,
            animation,
            position: center,  // Start at center
            center,
            radius,
            start_angle,
            end_angle,
        }
    }
}

impl AnimationModel for CircularModel {
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
        if self.animation.is_playing && self.animation.is_active && !self.animation.is_paused {
            let progress = self.animation.get_progress();
            let angle = self.start_angle + (self.end_angle - self.start_angle) * progress;
            self.position = Position {
                x: self.center.x + self.radius * angle.cos(),
                y: self.center.y + self.radius * angle.sin(),
                z: self.center.z,
            };
        }
        Ok(())
    }

    fn start(&mut self) {
        self.animation.play();
    }

    fn stop(&mut self) {
        self.animation.stop();
    }

    fn pause(&mut self) {
        self.animation.pause();
    }

    fn resume(&mut self) {
        self.animation.play();
    }

    fn reset(&mut self) {
        self.animation.stop();
        self.position = self.center;
    }

    fn is_complete(&self) -> bool {
        self.animation.is_complete()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::common::AnimationConfig;

    #[test]
    fn test_circular_model() -> napi::Result<()> {
        let config = AnimationConfig::new(
            0.0,
            1.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 0.0),
            "linear".to_string(),
        );

        let animation = Animation::new(config, "test".to_string());
        let center = Position::new(0.0, 0.0, 0.0);
        let mut model = CircularModel::new(
            "test".to_string(),
            animation,
            center,
            1.0,
            0.0,
            2.0 * PI,
        );

        assert!(!model.is_complete());
        model.start();
        
        // Test at different progress points
        model.animation.current_time = 0.0;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, 1.0);
        assert!(pos.y.abs() < 1e-10);
        
        model.animation.current_time = 0.25;
        model.update(0.0)?;
        let pos = model.get_position();
        assert!(pos.x.abs() < 1e-10);
        assert_eq!(pos.y, 1.0);
        
        model.animation.current_time = 0.5;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, -1.0);
        assert!(pos.y.abs() < 1e-10);

        Ok(())
    }
}
