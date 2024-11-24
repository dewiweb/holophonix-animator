use crate::state::group::*;

#[test]
fn test_group_creation() {
    let mut state = GroupState::new();
    
    assert!(state.create_group("group1".to_string(), "Test Group".to_string()));
    
    // Test duplicate group
    assert!(!state.create_group("group1".to_string(), "Duplicate Group".to_string()));
}

#[test]
fn test_group_removal() {
    let mut state = GroupState::new();
    
    state.create_group("group1".to_string(), "Test Group".to_string());
    assert!(state.remove_group("group1"));
    assert!(!state.remove_group("group1")); // Already removed
}

#[test]
fn test_track_membership() {
    let mut state = GroupState::new();
    
    state.create_group("group1".to_string(), "Test Group".to_string());
    
    assert!(state.add_track_to_group("group1", "track1".to_string()));
    assert!(state.is_track_in_group("group1", "track1"));
    
    assert!(state.remove_track_from_group("group1", "track1"));
    assert!(!state.is_track_in_group("group1", "track1"));
}

#[test]
fn test_group_queries() {
    let mut state = GroupState::new();
    
    state.create_group("group1".to_string(), "Group 1".to_string());
    state.create_group("group2".to_string(), "Group 2".to_string());
    
    state.add_track_to_group("group1", "track1".to_string());
    state.add_track_to_group("group2", "track1".to_string());
    
    let track_groups = state.get_track_groups("track1");
    assert_eq!(track_groups.len(), 2);
    
    let all_groups = state.get_all_groups();
    assert_eq!(all_groups.len(), 2);
}

#[test]
fn test_multiple_tracks_in_group() {
    let mut state = GroupState::new();
    
    state.create_group("group1".to_string(), "Test Group".to_string());
    
    assert!(state.add_track_to_group("group1", "track1".to_string()));
    assert!(state.add_track_to_group("group1", "track2".to_string()));
    
    let group = state.get_group("group1").unwrap();
    assert_eq!(group.track_ids.len(), 2);
    assert!(group.track_ids.contains("track1"));
    assert!(group.track_ids.contains("track2"));
}

#[test]
fn test_track_in_multiple_groups() {
    let mut state = GroupState::new();
    
    state.create_group("group1".to_string(), "Group 1".to_string());
    state.create_group("group2".to_string(), "Group 2".to_string());
    
    state.add_track_to_group("group1", "track1".to_string());
    state.add_track_to_group("group2", "track1".to_string());
    
    assert!(state.is_track_in_group("group1", "track1"));
    assert!(state.is_track_in_group("group2", "track1"));
    
    let track_groups = state.get_track_groups("track1");
    assert_eq!(track_groups.len(), 2);
}
