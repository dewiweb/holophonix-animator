use std::{
    sync::{Arc, Mutex},
    time::Duration,
    collections::HashMap,
};

use crate::{Position, error::{AnimatorResult, AnimatorError}};
use super::models::Animation;

pub struct Timeline {
    animations: Arc<Mutex<HashMap<String, Animation>>>,
    current_time: Duration,
}

impl Timeline {
    pub fn new() -> Self {
        Self {
            animations: Arc::new(Mutex::new(HashMap::new())),
            current_time: Duration::from_secs(0),
        }
    }

    pub fn add_animation(&self, animation: Animation) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().unwrap();
        animations.insert(animation.id.clone(), animation);
        Ok(())
    }

    pub fn remove_animation(&self, id: &str) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().unwrap();
        animations.remove(id);
        Ok(())
    }

    pub fn update(&mut self, delta: Duration) -> AnimatorResult<()> {
        self.current_time += delta;
        let mut animations = self.animations.lock().unwrap();
        
        for animation in animations.values_mut() {
            animation.update(delta)?;
        }

        Ok(())
    }

    pub fn clear(&mut self) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().unwrap();
        animations.clear();
        self.current_time = Duration::from_secs(0);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::animation::models::{AnimationConfig, LinearModel, AnimationType};

    #[test]
    fn test_timeline() {
        let mut timeline = Timeline::new();
        
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

        let animation = Animation::new("test".to_string(), config, model);
        timeline.add_animation(animation).unwrap();

        timeline.update(Duration::from_millis(500)).unwrap();
        assert_eq!(timeline.current_time, Duration::from_millis(500));

        timeline.clear().unwrap();
        assert_eq!(timeline.current_time, Duration::from_secs(0));
        assert!(timeline.animations.lock().unwrap().is_empty());
    }
}
