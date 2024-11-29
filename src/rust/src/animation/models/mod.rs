use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use crate::models::position::Position;
use crate::error::AnimatorResult;

pub mod easing;
pub mod linear;
pub mod circular;
pub mod custom_path;
pub mod pattern;

pub use linear::LinearModel;
pub use circular::CircularModel;
pub use pattern::PatternModel;
pub use custom_path::CustomPathModel;
pub use easing::EasingFunction;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub duration: f64,
    pub model_type: String,
    pub model_params: serde_json::Value,
    #[napi(skip)]
    pub is_running: bool,
    #[napi(skip)]
    pub is_looping: bool,
    #[napi(skip)]
    pub speed: f64,
}

impl ObjectFinalize for Animation {}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String, duration: f64, model_type: String, model_params: serde_json::Value) -> Self {
        Self {
            id,
            duration,
            model_type,
            model_params,
            is_running: false,
            is_looping: false,
            speed: 1.0,
        }
    }

    #[napi]
    pub fn start(&mut self) {
        self.is_running = true;
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_running = false;
    }

    #[napi]
    pub fn set_looping(&mut self, looping: bool) {
        self.is_looping = looping;
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::from("default"),
            duration: 1.0,
            model_type: String::from("linear"),
            model_params: serde_json::Value::Null,
            is_running: false,
            is_looping: false,
            speed: 1.0,
        }
    }
}

/// Common traits for all animation models
pub trait AnimationModel {
    fn get_id(&self) -> &str;
    fn get_animation(&self) -> &Animation;
    fn get_position(&self) -> Position;
    fn update(&mut self, delta_time: f64) -> AnimatorResult<()>;
    fn start(&mut self);
    fn stop(&mut self);
    fn pause(&mut self);
    fn resume(&mut self);
    fn reset(&mut self);
    fn is_complete(&self) -> bool;
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct BaseAnimationModel {
    pub id: String,
    #[napi(skip)]
    pub animation: Animation,
    pub position: Position,
}

impl ObjectFinalize for BaseAnimationModel {}

#[napi]
impl BaseAnimationModel {
    #[napi(constructor)]
    pub fn new(id: String, animation: Animation, position: Position) -> Self {
        Self {
            id,
            animation,
            position,
        }
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        Ok(())
    }

    #[napi]
    pub fn start(&mut self) {
        self.animation.start();
    }

    #[napi]
    pub fn stop(&mut self) {
        self.animation.stop();
    }

    #[napi]
    pub fn pause(&mut self) {
        self.animation.is_running = false;
    }

    #[napi]
    pub fn resume(&mut self) {
        self.animation.is_running = true;
    }

    #[napi]
    pub fn reset(&mut self) {
        self.animation.stop();
    }

    #[napi]
    pub fn is_complete(&self) -> bool {
        !self.animation.is_running
    }
}

impl AnimationModel for BaseAnimationModel {
    fn get_id(&self) -> &str {
        &self.id
    }

    fn get_animation(&self) -> &Animation {
        &self.animation
    }

    fn get_position(&self) -> Position {
        self.position.clone()
    }

    fn update(&mut self, delta_time: f64) -> AnimatorResult<()> {
        self.update(delta_time).map_err(|e| AnimatorResult::Error(e))
    }

    fn start(&mut self) {
        self.start()
    }

    fn stop(&mut self) {
        self.stop()
    }

    fn pause(&mut self) {
        self.pause()
    }

    fn resume(&mut self) {
        self.resume()
    }

    fn reset(&mut self) {
        self.reset()
    }

    fn is_complete(&self) -> bool {
        self.is_complete()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinearParams {
    pub start_pos: Position,
    pub end_pos: Position,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircularParams {
    pub center: Position,
    pub radius: f64,
    pub start_angle: f64,
    pub end_angle: f64,
}

pub fn interpolate_position(start: &Position, end: &Position, t: f64) -> Position {
    Position {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
    }
}

pub fn calculate_circular_position(params: &CircularParams, t: f64) -> Position {
    let angle = params.start_angle + (params.end_angle - params.start_angle) * t;
    let angle_rad = angle * std::f64::consts::PI / 180.0;
    
    Position {
        x: params.center.x + params.radius * angle_rad.cos(),
        y: params.center.y + params.radius * angle_rad.sin(),
        z: params.center.z,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestModel {
        id: String,
        animation: Animation,
        position: Position,
    }

    impl AnimationModel for TestModel {
        fn get_id(&self) -> &str {
            &self.id
        }

        fn get_animation(&self) -> &Animation {
            &self.animation
        }

        fn get_position(&self) -> Position {
            self.position.clone()
        }

        fn update(&mut self, _delta_time: f64) -> AnimatorResult<()> {
            Ok(())
        }

        fn start(&mut self) {}
        fn stop(&mut self) {}
        fn pause(&mut self) {}
        fn resume(&mut self) {}
        fn reset(&mut self) {}

        fn is_complete(&self) -> bool {
            true
        }
    }

    #[test]
    fn test_is_complete() {
        let mut model = BaseAnimationModel::new(
            "test".to_string(),
            Animation::default(),
            Position::default(),
        );
        assert!(!model.is_complete());
    }

    #[test]
    fn test_animation_model() {
        let model = TestModel {
            id: "test".to_string(),
            animation: Animation::default(),
            position: Position::default(),
        };
        assert_eq!(model.get_id(), "test");
        assert!(model.is_complete());
    }
}
