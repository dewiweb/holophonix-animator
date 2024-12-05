use std::collections::HashMap;
use std::time::Duration;

use crate::error::{AnimatorError, AnimatorResult};
use crate::animation::{
    models::{Animation, AnimationState, Position},
    AnimationGroup,
};

#[derive(Debug, Default)]
pub struct AnimationEngine {
    animations: HashMap<String, Animation>,
    groups: HashMap<String, AnimationGroup>,
}

impl AnimationEngine {
    pub fn new() -> Self {
        Self {
            animations: HashMap::new(),
            groups: HashMap::new(),
        }
    }

    pub fn add_animation(&mut self, id: String, animation: Animation) -> AnimatorResult<()> {
        if self.animations.contains_key(&id) {
            return Err(AnimatorError::DuplicateAnimation(id));
        }
        self.animations.insert(id, animation);
        Ok(())
    }

    pub fn remove_animation(&mut self, id: &str) -> AnimatorResult<()> {
        self.animations
            .remove(id)
            .ok_or_else(|| AnimatorError::AnimationNotFound(id.to_string()))?;
        Ok(())
    }

    pub fn get_animation(&self, id: &str) -> AnimatorResult<&Animation> {
        self.animations
            .get(id)
            .ok_or_else(|| AnimatorError::AnimationNotFound(id.to_string()))
    }

    pub fn get_animation_mut(&mut self, id: &str) -> AnimatorResult<&mut Animation> {
        self.animations
            .get_mut(id)
            .ok_or_else(|| AnimatorError::AnimationNotFound(id.to_string()))
    }

    pub fn add_group(&mut self, id: String) -> AnimatorResult<()> {
        if self.groups.contains_key(&id) {
            return Err(AnimatorError::DuplicateAnimation(id));
        }
        let group = AnimationGroup::new(id.clone());
        self.groups.insert(id, group);
        Ok(())
    }

    pub fn remove_group(&mut self, id: &str) -> AnimatorResult<()> {
        self.groups
            .remove(id)
            .ok_or_else(|| AnimatorError::GroupNotFound(id.to_string()))?;
        Ok(())
    }

    pub fn get_group(&self, id: &str) -> AnimatorResult<&AnimationGroup> {
        self.groups
            .get(id)
            .ok_or_else(|| AnimatorError::GroupNotFound(id.to_string()))
    }

    pub fn get_group_mut(&mut self, id: &str) -> AnimatorResult<&mut AnimationGroup> {
        self.groups
            .get_mut(id)
            .ok_or_else(|| AnimatorError::GroupNotFound(id.to_string()))
    }

    pub fn add_to_group(&mut self, group_id: &str, animation_id: &str) -> AnimatorResult<()> {
        let animation = self.get_animation(animation_id)?.clone();
        let group = self.get_group_mut(group_id)?;
        group.add_animation(animation_id.to_string(), animation)
    }

    pub fn remove_from_group(&mut self, group_id: &str, animation_id: &str) -> AnimatorResult<()> {
        let group = self.get_group_mut(group_id)?;
        group.remove_animation(animation_id)
    }

    pub fn start_group(&mut self, group_id: &str) -> AnimatorResult<()> {
        let group = self.get_group_mut(group_id)?;
        for animation in group.animations.values_mut() {
            animation.state = AnimationState::Playing;
        }
        Ok(())
    }

    pub fn stop_group(&mut self, group_id: &str) -> AnimatorResult<()> {
        let group = self.get_group_mut(group_id)?;
        for animation in group.animations.values_mut() {
            animation.state = AnimationState::Stopped;
        }
        Ok(())
    }

    pub fn pause_group(&mut self, group_id: &str) -> AnimatorResult<()> {
        let group = self.get_group_mut(group_id)?;
        for animation in group.animations.values_mut() {
            animation.state = AnimationState::Paused;
        }
        Ok(())
    }

    pub fn update(&mut self, dt: Duration) -> AnimatorResult<()> {
        // Update individual animations
        for animation in self.animations.values_mut() {
            if animation.state == AnimationState::Playing {
                animation.update(dt)?;
            }
        }

        // Update animation groups
        for group in self.groups.values_mut() {
            for animation in group.animations.values_mut() {
                if animation.state == AnimationState::Playing {
                    animation.update(dt)?;
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::animation::models::{Keyframe, Position};

    #[test]
    fn test_animation_lifecycle() {
        let mut engine = AnimationEngine::new();
        let animation = Animation::new(
            "test",
            vec![
                Keyframe::new(0.0, Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)),
                Keyframe::new(1.0, Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0)),
            ],
            Duration::from_secs(1),
        );

        // Test adding animation
        assert!(engine.add_animation("test".to_string(), animation.clone()).is_ok());
        assert!(engine.add_animation("test".to_string(), animation.clone()).is_err());

        // Test getting animation
        let stored = engine.get_animation("test");
        assert!(stored.is_ok());
        assert_eq!(stored.unwrap().id, "test");

        // Test removing animation
        assert!(engine.remove_animation("test").is_ok());
        assert!(engine.remove_animation("test").is_err());
    }

    #[test]
    fn test_group_operations() {
        let mut engine = AnimationEngine::new();
        
        // Create a group
        assert!(engine.add_group("group1".to_string()).is_ok());
        
        // Create an animation
        let animation = Animation::new(
            "anim1",
            vec![
                Keyframe::new(0.0, Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)),
                Keyframe::new(1.0, Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0)),
            ],
            Duration::from_secs(1),
        );
        
        // Add animation to engine
        assert!(engine.add_animation("anim1".to_string(), animation).is_ok());
        
        // Add animation to group
        assert!(engine.add_to_group("group1", "anim1").is_ok());
        
        // Test group controls
        assert!(engine.start_group("group1").is_ok());
        assert!(engine.pause_group("group1").is_ok());
        assert!(engine.stop_group("group1").is_ok());
        
        // Remove animation from group
        assert!(engine.remove_from_group("group1", "anim1").is_ok());
        
        // Remove group
        assert!(engine.remove_group("group1").is_ok());
    }
}
