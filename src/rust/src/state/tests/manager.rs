use std::time::Duration;
use tempfile::tempdir;
use crate::state::{
    StateManager,
    models::{State, AnimationModel, TrackState, GroupState},
    events::StateChange,
};

#[test]
fn test_state_manager_creation() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Verify all states are initialized
    assert!(manager.track_state().lock().unwrap().get_all_tracks().is_empty());
    assert!(manager.animation_state().lock().unwrap().get_all_animations().is_empty());
    assert!(manager.group_state().lock().unwrap().get_all_groups().is_empty());
    assert!(manager.selection_state().lock().unwrap().get_selected_tracks().is_empty());
    assert_eq!(
        manager.timeline_state().lock().unwrap().get_state().total_duration,
        Duration::from_secs(300)
    );
}

#[test]
fn test_track_management() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Add a track
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
    }
    
    // Verify track position
    let position = manager.get_track_position("track1").unwrap().unwrap();
    assert_eq!(position, (0.0, 0.0));
    
    // Update track position
    manager.update_track_position("track1", (1.0, 1.0)).unwrap();
    
    // Verify updated position
    let position = manager.get_track_position("track1").unwrap().unwrap();
    assert_eq!(position, (1.0, 1.0));
}

#[test]
fn test_animation_management() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Add a track and animation
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
        
        let mut animation_state = manager.animation_state().lock().unwrap();
        animation_state.add_animation(
            "anim1".to_string(),
            "track1".to_string(),
            AnimationModel::Linear { 
                start: (0.0, 0.0),
                end: (1.0, 1.0),
                duration: Duration::from_secs(5)
            }
        );
    }
    
    // Get active animations
    let animations = manager.get_active_animations().unwrap();
    assert_eq!(animations.len(), 1);
    assert_eq!(animations[0].id, "anim1");
}

#[test]
fn test_group_management() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Add tracks and create a group
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
        track_state.add_track("track2".to_string(), (1.0, 1.0));
        
        let mut group_state = manager.group_state().lock().unwrap();
        group_state.create_group("group1".to_string());
        group_state.add_track_to_group("group1", "track1");
        group_state.add_track_to_group("group1", "track2");
    }
    
    // Verify group membership
    let group_state = manager.group_state().lock().unwrap();
    let tracks = group_state.get_group_tracks("group1").unwrap();
    assert_eq!(tracks.len(), 2);
    assert!(tracks.contains("track1"));
    assert!(tracks.contains("track2"));
}

#[test]
fn test_selection_management() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Add tracks and select them
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
        track_state.add_track("track2".to_string(), (1.0, 1.0));
        
        let mut selection_state = manager.selection_state().lock().unwrap();
        selection_state.select_track("track1");
        selection_state.select_track("track2");
    }
    
    // Verify selection
    let selection_state = manager.selection_state().lock().unwrap();
    let selected = selection_state.get_selected_tracks();
    assert_eq!(selected.len(), 2);
    assert!(selected.contains("track1"));
    assert!(selected.contains("track2"));
}

#[test]
fn test_state_persistence() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Add some state data
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
        
        let mut animation_state = manager.animation_state().lock().unwrap();
        animation_state.add_animation(
            "anim1".to_string(),
            "track1".to_string(),
            AnimationModel::Linear { 
                start: (0.0, 0.0),
                end: (1.0, 1.0),
                duration: Duration::from_secs(5)
            }
        );
    }
    
    // Save state
    manager.save_state().unwrap();
    
    // Create new manager and load state
    let new_manager = StateManager::new(temp_dir.path().to_path_buf());
    new_manager.load_state().unwrap();
    
    // Verify loaded state
    let track_state = new_manager.track_state().lock().unwrap();
    assert!(track_state.get_track("track1").is_some());
    
    let animation_state = new_manager.animation_state().lock().unwrap();
    assert!(animation_state.get_animation("anim1").is_some());
}

#[test]
fn test_change_notifications() {
    let temp_dir = tempdir().unwrap();
    let manager = StateManager::new(temp_dir.path().to_path_buf());
    
    // Subscribe to changes
    let (tx, rx) = std::sync::mpsc::channel();
    manager.subscribe_to_changes(tx);
    
    // Make some changes
    {
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
    }
    
    // Verify notification
    let notification = rx.try_recv().unwrap();
    assert!(matches!(notification, StateChange::TrackAdded { .. }));
}
