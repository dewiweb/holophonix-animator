use holophonix_animator_core::{
    state::{TrackRegistry, Group, GroupPattern, GroupRelation},
    math::vector::Vector3,
};
use std::time::Duration;

#[test]
fn test_track_registry() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Test adding track
    assert!(registry.add_track(track_id.clone()));
    assert!(!registry.add_track(track_id.clone())); // Should fail as track already exists
    
    // Test getting track
    let track = registry.get_track(&track_id).unwrap();
    assert_eq!(track.id(), &track_id);
    assert_eq!(track.position(), Vector3::zero());
    
    // Test updating position
    let new_pos = Vector3::new(1.0, 2.0, 3.0);
    assert!(registry.update_track_position(&track_id, new_pos));
    let track = registry.get_track(&track_id).unwrap();
    assert_eq!(track.position(), new_pos);
    
    // Test removing track
    assert!(registry.remove_track(&track_id));
    assert!(!registry.remove_track(&track_id)); // Should fail as track no longer exists
}

#[test]
fn test_group_pattern_matching() {
    let mut registry = TrackRegistry::new();
    let mut group = Group::new("test_group", GroupPattern::Prefix("test".to_string()));
    
    // Add test tracks
    registry.add_track("test1".to_string());
    registry.add_track("test2".to_string());
    registry.add_track("other".to_string());
    
    // Update group members based on pattern
    group.update_members(&registry);
    
    // Check that only tracks with prefix "test" are included
    let members = group.members();
    assert!(members.contains("test1"));
    assert!(members.contains("test2"));
    assert!(!members.contains("other"));
}

#[test]
fn test_group_relations() {
    let mut registry = TrackRegistry::new();
    let mut group = Group::new("test_group", GroupPattern::All);
    
    // Add test tracks
    registry.add_track("track1".to_string());
    registry.add_track("track2".to_string());
    
    // Update group members based on pattern
    group.update_members(&registry);
    
    // Set up relations
    group.set_relation("track1", GroupRelation::Follow("track2".to_string()));
    
    // Update positions
    let target_pos = Vector3::new(1.0, 2.0, 3.0);
    registry.update_track_position("track2", target_pos);
    
    // Update group positions
    group.update_positions(&mut registry, Duration::from_secs(0));
    
    // Check that track1 follows track2
    let track1 = registry.get_track("track1").unwrap();
    assert_eq!(track1.position(), target_pos);
}
