use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::state::StateManager;
use crate::animation::models::AnimationModel;

pub struct AnimationGroup {
    name: String,
    animations: HashMap<String, Box<dyn AnimationModel>>,
    current_time: f64,
}

impl AnimationGroup {
    pub fn new(name: String) -> Self {
        Self {
            name,
            animations: HashMap::new(),
            current_time: 0.0,
        }
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn animations(&self) -> &HashMap<String, Box<dyn AnimationModel>> {
        &self.animations
    }

    pub fn add_animation(&mut self, id: String, animation: Box<dyn AnimationModel>) {
        self.animations.insert(id, animation);
    }

    pub fn remove_animation(&mut self, id: String) {
        self.animations.remove(&id);
    }

    pub fn is_complete(&self) -> bool {
        self.animations.values().all(|anim| anim.is_complete(self.current_time))
    }

    pub async fn update(&mut self, dt: f64, state_manager: Arc<Mutex<StateManager>>) -> Result<(), String> {
        self.current_time += dt;
        
        // Update each animation's state
        for (id, animation) in self.animations.iter() {
            let position = animation.calculate_position(self.current_time);
            let mut state = state_manager.lock().await;
            // Update state with new position
            if let Err(e) = state.update_track_position(id.clone(), (position.x, position.y)) {
                return Err(format!("Failed to update track position: {}", e));
            }
        }
        
        Ok(())
    }

    pub fn reset(&mut self) {
        self.current_time = 0.0;
    }
}

pub struct AnimationGroupManager {
    groups: HashMap<String, AnimationGroup>,
}

impl AnimationGroupManager {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
        }
    }

    pub fn add_group(&mut self, id: String, group: AnimationGroup) {
        self.groups.insert(id, group);
    }

    pub fn remove_group(&mut self, id: &str) -> Option<AnimationGroup> {
        self.groups.remove(id)
    }

    pub fn get_group(&mut self, id: &str) -> Option<&mut AnimationGroup> {
        self.groups.get_mut(id)
    }

    pub fn groups(&self) -> &HashMap<String, AnimationGroup> {
        &self.groups
    }

    pub async fn update_all(&mut self, dt: f64, state_manager: Arc<Mutex<StateManager>>) -> Result<(), String> {
        for group in self.groups.values_mut() {
            group.update(dt, state_manager.clone()).await?;
        }
        Ok(())
    }

    pub fn reset_all(&mut self) {
        for group in self.groups.values_mut() {
            group.reset();
        }
    }
}
