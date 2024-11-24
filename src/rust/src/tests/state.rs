use std::path::PathBuf;
use std::time::Duration;

use crate::state::*;

#[test]
fn test_state_manager_creation() {
    let state_manager = StateManager::new(PathBuf::from("./test_saves"));
    assert!(state_manager.track_state().lock().is_ok());
    assert!(state_manager.animation_state().lock().is_ok());
    assert!(state_manager.group_state().lock().is_ok());
    assert!(state_manager.timeline_state().lock().is_ok());
}

#[test]
fn test_state_notifications() {
    let state_manager = StateManager::new(PathBuf::from("./test_saves"));
    
    // Subscribe to changes
    let receiver = state_manager.subscribe_to_changes("test_subscriber".to_string()).unwrap();
    
    // Make some changes
    state_manager.notify_track_change("track1".to_string());
    state_manager.notify_group_change("group1".to_string());
    state_manager.notify_animation_change("anim1".to_string());
    
    // Check notifications
    let notification = receiver.try_recv().unwrap();
    match notification.change_type {
        StateChange::Track(id) => assert_eq!(id, "track1"),
        _ => panic!("Unexpected change type"),
    }
    
    let notification = receiver.try_recv().unwrap();
    match notification.change_type {
        StateChange::Group(id) => assert_eq!(id, "group1"),
        _ => panic!("Unexpected change type"),
    }
    
    let notification = receiver.try_recv().unwrap();
    match notification.change_type {
        StateChange::Animation(id) => assert_eq!(id, "anim1"),
        _ => panic!("Unexpected change type"),
    }
}

#[test]
fn test_state_persistence() {
    let save_dir = PathBuf::from("./test_saves");
    let state_manager = StateManager::new(save_dir.clone());
    
    // Add some test data
    {
        let mut tracks = state_manager.track_state().lock().unwrap();
        tracks.add_track("track1".to_string(), "Test Track".to_string(), (0.0, 0.0));
    }
    
    {
        let mut groups = state_manager.group_state().lock().unwrap();
        groups.create_group("group1".to_string(), "Test Group".to_string());
    }
    
    // Save state
    state_manager.save_state().unwrap();
    
    // Create new state manager and load state
    let mut new_state_manager = StateManager::new(save_dir);
    new_state_manager.load_state().unwrap();
    
    // Verify loaded data
    {
        let tracks = new_state_manager.track_state().lock().unwrap();
        let track = tracks.get_track("track1").unwrap();
        assert_eq!(track.name, "Test Track");
    }
    
    {
        let groups = new_state_manager.group_state().lock().unwrap();
        let group = groups.get_group("group1").unwrap();
        assert_eq!(group.name, "Test Group");
    }
}

#[test]
fn test_animation_engine_interface() {
    let state_manager = StateManager::new(PathBuf::from("./test_saves"));
    
    // Add a track and animation
    {
        let mut tracks = state_manager.track_state().lock().unwrap();
        tracks.add_track("track1".to_string(), "Test Track".to_string(), (0.0, 0.0));
    }
    
    {
        let mut animations = state_manager.animation_state().lock().unwrap();
        animations.add_animation(
            "anim1".to_string(),
            AnimationModel::Linear {
                start: (0.0, 0.0),
                end: (1.0, 1.0),
                duration: 1.0,
            },
            "track1".to_string(),
        );
    }
    
    // Test animation engine interface methods
    let active_animations = state_manager.get_active_animations().unwrap();
    assert_eq!(active_animations.len(), 1);
    
    let track_pos = state_manager.get_track_position("track1").unwrap();
    assert_eq!(track_pos, Some((0.0, 0.0)));
    
    state_manager.update_track_position("track1", (1.0, 1.0)).unwrap();
    let new_pos = state_manager.get_track_position("track1").unwrap();
    assert_eq!(new_pos, Some((1.0, 1.0)));
}

#[test]
fn test_napi_bridge_interface() {
    let state_manager = StateManager::new(PathBuf::from("./test_saves"));
    
    // Subscribe to changes through N-API interface
    let receiver = state_manager.subscribe_to_changes("test_bridge".to_string()).unwrap();
    
    // Make some changes
    state_manager.notify_track_change("track1".to_string());
    
    // Check notification
    let notification = receiver.try_recv().unwrap();
    match notification.change_type {
        StateChange::Track(id) => assert_eq!(id, "track1"),
        _ => panic!("Unexpected change type"),
    }
    
    // Get state snapshot
    let snapshot = state_manager.get_state_snapshot().unwrap();
    assert_eq!(snapshot.version, env!("CARGO_PKG_VERSION"));
}
