use std::collections::{HashMap, HashSet};
use std::time::Duration;
use serde::{Serialize, Deserialize};
use crate::error::{AnimatorError, AnimatorResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnimationType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    Bounce,
    Elastic,
}

impl Default for AnimationType {
    fn default() -> Self {
        Self::Linear
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Animation {
    pub id: String,
    pub name: String,
    pub duration: f64,
    pub animation_type: AnimationType,
    pub properties: HashMap<String, f64>,
    pub active: bool,
}

impl Animation {
    pub fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            duration: 1.0,
            animation_type: AnimationType::Linear,
            properties: HashMap::new(),
            active: false,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimationState {
    active_animations: HashSet<String>,
    animation_data: HashMap<String, Vec<u8>>,
    animations: HashMap<String, Animation>,
    is_simplified_mode: bool,
}

impl AnimationState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_active_animations(&self) -> Vec<String> {
        self.active_animations.iter().cloned().collect()
    }

    pub fn get_active_count(&self) -> usize {
        self.active_animations.len()
    }

    pub fn cleanup_unused(&mut self) -> AnimatorResult<()> {
        let active_set: HashSet<_> = self.active_animations.iter().collect();
        self.animation_data.retain(|k, _| active_set.contains(k));
        self.animations.retain(|k, _| active_set.contains(k));
        Ok(())
    }

    pub fn add_animation(&mut self, id: String, data: Vec<u8>) -> AnimatorResult<()> {
        self.animation_data.insert(id.clone(), data);
        Ok(())
    }

    pub fn remove_animation(&mut self, id: &str) -> AnimatorResult<()> {
        self.active_animations.remove(id);
        self.animation_data.remove(id);
        self.animations.remove(id);
        Ok(())
    }

    pub fn get_animation_data(&self, id: &str) -> Option<&Vec<u8>> {
        self.animation_data.get(id)
    }

    pub fn set_simplified_mode(&mut self, enabled: bool) -> AnimatorResult<()> {
        self.is_simplified_mode = enabled;
        Ok(())
    }

    pub fn is_simplified_mode(&self) -> bool {
        self.is_simplified_mode
    }

    pub fn clear_all(&mut self) -> AnimatorResult<()> {
        self.active_animations.clear();
        self.animation_data.clear();
        self.animations.clear();
        Ok(())
    }

    pub fn validate(&self) -> AnimatorResult<()> {
        // Ensure all active animations have corresponding data
        for id in &self.active_animations {
            if !self.animation_data.contains_key(id) {
                return Err(AnimatorError::validation_error(&format!(
                    "Active animation {} has no data", id
                )));
            }
        }
        Ok(())
    }

    pub fn update_positions(&mut self) -> AnimatorResult<()> {
        // Add position update logic if needed
        Ok(())
    }

    pub fn add_animation_details(&mut self, animation: Animation) -> bool {
        if self.animations.contains_key(&animation.id) {
            return false;
        }
        self.animations.insert(animation.id.clone(), animation);
        true
    }

    pub fn get_animation(&self, id: &str) -> Option<&Animation> {
        self.animations.get(id)
    }

    pub fn get_active_animations_details(&self) -> Vec<Animation> {
        self.active_animations
            .iter()
            .filter_map(|id| self.animations.get(id))
            .cloned()
            .collect()
    }

    pub fn update_animation(&mut self, id: &str, animation: Animation) -> bool {
        if let Some(existing) = self.animations.get_mut(id) {
            *existing = animation;
            true
        } else {
            false
        }
    }

    pub fn set_animation_active(&mut self, id: &str, active: bool) -> bool {
        if !self.animations.contains_key(id) {
            return false;
        }

        if active {
            self.active_animations.insert(id.to_string())
        } else {
            self.active_animations.remove(id)
        }
    }

    pub fn notify_change(&mut self, animation_id: String) {
        // Add notification logic if needed
    }

    pub fn restore_checkpoint(&mut self) -> AnimatorResult<()> {
        // Add checkpoint restoration logic
        Ok(())
    }

    pub fn cleanup(&mut self) -> AnimatorResult<()> {
        self.clear_all()
    }

    pub fn clear_cache(&mut self) -> AnimatorResult<()> {
        self.animation_data.clear();
        Ok(())
    }

    pub fn save(&self) -> AnimatorResult<()> {
        // Add save logic if needed
        Ok(())
    }
}

#[derive(Debug, Default)]
pub struct AnimationStateManager {
    active_animations: Vec<String>,
    animation_data: HashMap<String, Vec<u8>>,
}

impl AnimationStateManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_active_animations(&self) -> Vec<String> {
        self.active_animations.clone()
    }

    pub fn get_active_count(&self) -> usize {
        self.active_animations.len()
    }

    pub fn cleanup_unused(&mut self) -> Result<(), ()> {
        let active_set: HashSet<_> = self.active_animations.iter().collect();
        self.animation_data.retain(|k, _| active_set.contains(k));
        Ok(())
    }

    pub fn add_animation(&mut self, id: String, data: Vec<u8>) -> Result<(), ()> {
        self.active_animations.push(id.clone());
        self.animation_data.insert(id, data);
        Ok(())
    }

    pub fn remove_animation(&mut self, id: &str) -> Result<(), ()> {
        self.active_animations.retain(|x| x != id);
        self.animation_data.remove(id);
        Ok(())
    }

    pub fn get_animation_data(&self, id: &str) -> Option<&Vec<u8>> {
        self.animation_data.get(id)
    }
}
