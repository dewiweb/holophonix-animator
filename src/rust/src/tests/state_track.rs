use crate::state::track::*;

#[test]
fn test_track_creation() {
    let mut state = TrackState::new();
    
    assert!(state.add_track(
        "track1".to_string(),
        "Test Track".to_string(),
        (0.0, 0.0)
    ));
    
    // Test duplicate track
    assert!(!state.add_track(
        "track1".to_string(),
        "Duplicate Track".to_string(),
        (0.0, 0.0)
    ));
}

#[test]
fn test_track_removal() {
    let mut state = TrackState::new();
    
    state.add_track("track1".to_string(), "Test Track".to_string(), (0.0, 0.0));
    assert!(state.remove_track("track1"));
    assert!(!state.remove_track("track1")); // Already removed
}

#[test]
fn test_track_position() {
    let mut state = TrackState::new();
    
    state.add_track("track1".to_string(), "Test Track".to_string(), (0.0, 0.0));
    
    assert!(state.update_position("track1", (1.0, 1.0)));
    let track = state.get_track("track1").unwrap();
    assert_eq!(track.position, (1.0, 1.0));
    
    // Test non-existent track
    assert!(!state.update_position("track2", (1.0, 1.0)));
}

#[test]
fn test_track_active_state() {
    let mut state = TrackState::new();
    
    state.add_track("track1".to_string(), "Test Track".to_string(), (0.0, 0.0));
    
    assert!(state.set_active("track1", false));
    let track = state.get_track("track1").unwrap();
    assert!(!track.active);
    
    assert!(state.set_active("track1", true));
    let track = state.get_track("track1").unwrap();
    assert!(track.active);
}

#[test]
fn test_track_queries() {
    let mut state = TrackState::new();
    
    state.add_track("track1".to_string(), "Active Track".to_string(), (0.0, 0.0));
    state.add_track("track2".to_string(), "Inactive Track".to_string(), (1.0, 1.0));
    state.set_active("track2", false);
    
    let all_tracks = state.get_all_tracks();
    assert_eq!(all_tracks.len(), 2);
    
    let active_tracks = state.get_active_tracks();
    assert_eq!(active_tracks.len(), 1);
    assert_eq!(active_tracks[0].name, "Active Track");
}
