// State management tests
pub mod animation;
pub mod group;
pub mod manager;
pub mod timeline;
pub mod track;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{State, StateManager, StateUpdate};
    use std::time::Duration;

    #[test]
    fn test_state_manager() {
        let mut manager = StateManager::new();
        let state = State::new();
        
        manager.update_state(StateUpdate::new(state.clone()));
        assert_eq!(manager.current_state(), &state);
    }

    #[test]
    fn test_state_update() {
        let state = State::new();
        let update = StateUpdate::new(state.clone());
        
        assert_eq!(update.state(), &state);
        assert!(update.timestamp() > 0);
    }
}
