pub mod group;
pub mod models;
pub mod interpolation;
pub mod cycle;
pub mod timeline;

use std::sync::{Arc, Mutex};
use crate::state::StateManager;

/// The main Animation Engine that coordinates all animation-related functionality
pub struct AnimationEngine {
    state_manager: Arc<Mutex<StateManager>>,
    group_manager: group::GroupManager,
    timeline_manager: timeline::TimelineManager,
}

impl AnimationEngine {
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> Self {
        Self {
            state_manager,
            group_manager: group::GroupManager::new(),
            timeline_manager: timeline::TimelineManager::new(),
        }
    }

    /// Initialize the animation engine
    pub fn initialize(&mut self) -> Result<(), String> {
        // Initialize components
        self.group_manager.initialize()?;
        self.timeline_manager.initialize()?;
        Ok(())
    }

    /// Process a single animation frame
    pub fn process_frame(&mut self, delta_time: f64) -> Result<(), String> {
        // Update timeline
        self.timeline_manager.update(delta_time)?;

        // Process group animations
        self.group_manager.process_frame(delta_time)?;

        // Update state
        if let Ok(mut state) = self.state_manager.lock() {
            state.update_positions()?;
        }

        Ok(())
    }

    /// Clean up resources
    pub fn cleanup(&mut self) -> Result<(), String> {
        self.group_manager.cleanup()?;
        self.timeline_manager.cleanup()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation_engine_creation() {
        let state_manager = Arc::new(Mutex::new(StateManager::new()));
        let engine = AnimationEngine::new(state_manager);
        // Add more specific tests
    }
}
