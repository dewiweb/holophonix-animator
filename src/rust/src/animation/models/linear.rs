use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use crate::models::common::{Position, Animation, AnimationConfig};
use super::AnimationModel;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinearModel {
    pub id: String,
    pub animation: Animation,
    pub position: Position,
    pub start_position: Position,
    pub end_position: Position,
}

impl ObjectFinalize for LinearModel {}

#[napi]
impl LinearModel {
    #[napi(constructor)]
    pub fn new(id: String, animation: Animation, start_position: Position, end_position: Position) -> Self {
        Self {
            id,
            animation,
            position: start_position,
            start_position,
            end_position,
        }
    }
}

impl AnimationModel for LinearModel {
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
            self.position = Position {
                x: self.start_position.x + (self.end_position.x - self.start_position.x) * progress,
                y: self.start_position.y + (self.end_position.y - self.start_position.y) * progress,
                z: self.start_position.z + (self.end_position.z - self.start_position.z) * progress,
            };
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
        self.position = self.start_position;
    }

    fn is_complete(&self) -> bool {
        self.animation.is_complete()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_model() -> LinearModel {
        let config = AnimationConfig::new(
            0.0,
            1.0,
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 0.0),
            "linear".to_string(),
        );

        let animation = Animation::new(config, "test".to_string());
        let start_pos = Position::new(0.0, 0.0, 0.0);
        let end_pos = Position::new(1.0, 1.0, 0.0);

        LinearModel::new(
            "test".to_string(),
            animation,
            start_pos,
            end_pos,
        )
    }

    #[test]
    fn test_linear_interpolation() -> napi::Result<()> {
        let mut model = create_test_model();
        model.start();

        // Test at start
        model.animation.current_time = 0.0;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);

        // Test at middle
        model.animation.current_time = 0.5;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, 0.5);
        assert_eq!(pos.y, 0.5);
        assert_eq!(pos.z, 0.0);

        // Test at end
        model.animation.current_time = 1.0;
        model.update(0.0)?;
        let pos = model.get_position();
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 1.0);
        assert_eq!(pos.z, 0.0);

        Ok(())
    }
}
