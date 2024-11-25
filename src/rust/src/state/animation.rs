use std::collections::HashMap;
use std::time::Duration;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnimationType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Animation {
    pub id: String,
    pub name: String,
    pub duration: Duration,
    pub animation_type: AnimationType,
    pub active: bool,
}

impl Animation {
    pub fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            duration: Duration::from_secs(1),
            animation_type: AnimationType::Linear,
            active: false,
        }
    }
}

#[derive(Default, Serialize, Deserialize)]
pub struct AnimationState {
    animations: HashMap<String, Animation>,
}

impl AnimationState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_animation(&mut self, animation: Animation) -> bool {
        if self.animations.contains_key(&animation.id) {
            return false;
        }
        self.animations.insert(animation.id.clone(), animation);
        true
    }

    pub fn remove_animation(&mut self, id: &str) -> bool {
        self.animations.remove(id).is_some()
    }

    pub fn get_animation(&self, id: &str) -> Option<&Animation> {
        self.animations.get(id)
    }

    pub fn get_active_animations(&self) -> Vec<Animation> {
        self.animations.values()
            .filter(|a| a.active)
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
        if let Some(animation) = self.animations.get_mut(id) {
            animation.active = active;
            true
        } else {
            false
        }
    }
}
