use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::state::StateManager;
use crate::animation::animation_group::AnimationGroup;

pub struct AnimationTimeline {
    name: String,
    groups: HashMap<String, AnimationGroup>,
    parallel_groups: HashMap<String, AnimationGroup>,
    current_time: f64,
}

impl AnimationTimeline {
    pub fn new(name: String) -> Self {
        Self {
            name,
            groups: HashMap::new(),
            parallel_groups: HashMap::new(),
            current_time: 0.0,
        }
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn groups(&self) -> &HashMap<String, AnimationGroup> {
        &self.groups
    }

    pub fn add_group(&mut self, id: String, group: AnimationGroup) {
        self.groups.insert(id, group);
    }

    pub fn add_parallel_group(&mut self, id: String, group: AnimationGroup) {
        self.parallel_groups.insert(id, group);
    }

    pub fn remove_group(&mut self, id: String) -> Result<(), String> {
        if self.groups.remove(&id).is_none() && self.parallel_groups.remove(&id).is_none() {
            return Err(format!("Group {} not found", id));
        }
        Ok(())
    }

    pub fn get_group(&self, id: &str) -> Option<&AnimationGroup> {
        self.groups.get(id).or_else(|| self.parallel_groups.get(id))
    }

    pub fn is_complete(&self) -> bool {
        self.groups.values().all(|group| group.is_complete()) &&
        self.parallel_groups.values().all(|group| group.is_complete())
    }

    pub async fn update(&mut self, dt: f64, state_manager: Arc<Mutex<StateManager>>) -> Result<(), String> {
        self.current_time += dt;

        // Update parallel groups
        for group in self.parallel_groups.values_mut() {
            group.update(dt, state_manager.clone()).await?;
        }

        // Update sequential groups
        // Find the first non-complete group and update it
        for group in self.groups.values_mut() {
            if !group.is_complete() {
                group.update(dt, state_manager.clone()).await?;
                break;
            }
        }

        Ok(())
    }

    pub fn reset(&mut self) {
        self.current_time = 0.0;
        for group in self.groups.values_mut() {
            group.reset();
        }
        for group in self.parallel_groups.values_mut() {
            group.reset();
        }
    }
}

pub struct TimelineManager {
    timelines: HashMap<String, AnimationTimeline>,
}

impl TimelineManager {
    pub fn new() -> Self {
        Self {
            timelines: HashMap::new(),
        }
    }

    pub fn add_timeline(&mut self, id: String, timeline: AnimationTimeline) {
        self.timelines.insert(id, timeline);
    }

    pub fn remove_timeline(&mut self, id: &str) -> Option<AnimationTimeline> {
        self.timelines.remove(id)
    }

    pub fn get_timeline(&mut self, id: &str) -> Option<&mut AnimationTimeline> {
        self.timelines.get_mut(id)
    }

    pub async fn update_all(&mut self, dt: f64, state_manager: Arc<Mutex<StateManager>>) -> Result<(), String> {
        for timeline in self.timelines.values_mut() {
            timeline.update(dt, state_manager.clone()).await?;
        }
        Ok(())
    }

    pub fn reset_all(&mut self) {
        for timeline in self.timelines.values_mut() {
            timeline.reset();
        }
    }
}
