use std::time::Duration;
use crate::{Position, error::AnimatorResult};
use super::models::{Animation, AnimationModel, AnimationConfig, AnimationType, LinearModel};

pub trait AnimationPlugin: Send + Sync {
    fn name(&self) -> &str;
    fn create_model(&self, animation: &Animation) -> AnimatorResult<Box<dyn AnimationModel>>;
    fn update(&mut self, animation: &mut Animation, delta: Duration) -> AnimatorResult<Position>;
}

pub struct DefaultPlugin;

impl DefaultPlugin {
    pub fn new() -> Self {
        Self
    }
}

impl AnimationPlugin for DefaultPlugin {
    fn name(&self) -> &str {
        "default"
    }

    fn create_model(&self, animation: &Animation) -> AnimatorResult<Box<dyn AnimationModel>> {
        Ok(animation.model.clone())
    }

    fn update(&mut self, animation: &mut Animation, delta: Duration) -> AnimatorResult<Position> {
        animation.update(delta)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::animation::models::{AnimationConfig, LinearModel, AnimationType};

    #[test]
    fn test_default_plugin() {
        let plugin = DefaultPlugin::new();
        
        let model = Box::new(LinearModel {
            start_position: Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
            end_position: Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0),
        });

        let config = AnimationConfig {
            start_position: Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
            end_position: Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0),
            model_type: AnimationType::Linear,
            radius: 0.0,
            positions: vec![],
            duration: 1000.0,
            loop_count: 1,
        };

        let mut animation = Animation::new("test".to_string(), config, model);
        animation.start().unwrap();

        let pos = plugin.update(&mut animation, Duration::from_millis(500)).unwrap();
        assert_eq!(pos.x, 0.5);
        assert_eq!(pos.y, 0.5);
        assert_eq!(pos.z, 0.5);
    }
}
