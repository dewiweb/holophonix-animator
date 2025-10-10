use holophonix_animator_core::{
    state::{Track, TrackRegistry, group::{Group, GroupPattern, GroupRelation}},
    math::vector::Vector3,
};
use std::collections::HashSet;

#[test]
fn test_group_creation_from_pattern() {
    let mut registry = TrackRegistry::new();
    
    // Add test tracks
    for i in 1..=5 {
        let track = Track::new(&format!("track{}", i), Vector3::new(0.0, 0.0, 0.0));
        registry.add_track(track);
    }
    
    // Create group with range pattern
    let pattern = GroupPattern::Range { start: 1, end: 3 };
    let group = Group::new("group1", pattern);
    
    // Verify group members
    let members: HashSet<_> = group.resolve_members(&registry).collect();
    assert_eq!(members.len(), 3);
    assert!(members.contains("track1"));
    assert!(members.contains("track2"));
    assert!(members.contains("track3"));
}

#[test]
fn test_group_creation_from_set() {
    let mut registry = TrackRegistry::new();
    
    // Add test tracks
    for i in 1..=5 {
        let track = Track::new(&format!("track{}", i), Vector3::new(0.0, 0.0, 0.0));
        registry.add_track(track);
    }
    
    // Create group with set pattern
    let pattern = GroupPattern::Set(vec!["track1".to_string(), "track3".to_string(), "track5".to_string()]);
    let group = Group::new("group2", pattern);
    
    // Verify group members
    let members: HashSet<_> = group.resolve_members(&registry).collect();
    assert_eq!(members.len(), 3);
    assert!(members.contains("track1"));
    assert!(members.contains("track3"));
    assert!(members.contains("track5"));
}

#[test]
fn test_leader_follower_relation() {
    let mut registry = TrackRegistry::new();
    
    // Add leader and follower tracks
    let leader = Track::new("leader", Vector3::new(0.0, 0.0, 0.0));
    let follower1 = Track::new("follower1", Vector3::new(1.0, 0.0, 0.0));
    let follower2 = Track::new("follower2", Vector3::new(0.0, 1.0, 0.0));
    
    registry.add_track(leader);
    registry.add_track(follower1);
    registry.add_track(follower2);
    
    // Create group with leader-follower relation
    let pattern = GroupPattern::Set(vec!["leader".to_string(), "follower1".to_string(), "follower2".to_string()]);
    let mut group = Group::new("leader_group", pattern);
    group.set_relation(GroupRelation::LeaderFollower { leader: "leader".to_string() });
    
    // Move leader
    {
        let leader = registry.get_track_mut("leader").unwrap();
        leader.set_position(Vector3::new(1.0, 1.0, 1.0));
    }
    
    // Apply relation
    group.apply_relation(&mut registry);
    
    // Verify followers moved relative to leader
    let follower1_pos = registry.get_track("follower1").unwrap().position();
    let follower2_pos = registry.get_track("follower2").unwrap().position();
    
    assert_eq!(follower1_pos, Vector3::new(2.0, 1.0, 1.0));
    assert_eq!(follower2_pos, Vector3::new(1.0, 2.0, 1.0));
}

#[test]
fn test_isobarycentric_relation() {
    let mut registry = TrackRegistry::new();
    
    // Add tracks in triangle formation
    let track1 = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
    let track2 = Track::new("track2", Vector3::new(1.0, 0.0, 0.0));
    let track3 = Track::new("track3", Vector3::new(0.5, 1.0, 0.0));
    
    registry.add_track(track1);
    registry.add_track(track2);
    registry.add_track(track3);
    
    // Create group with isobarycentric relation
    let pattern = GroupPattern::Set(vec!["track1".to_string(), "track2".to_string(), "track3".to_string()]);
    let mut group = Group::new("iso_group", pattern);
    group.set_relation(GroupRelation::Isobarycentric);
    
    // Move one track
    {
        let track = registry.get_track_mut("track1").unwrap();
        track.set_position(Vector3::new(1.0, 1.0, 0.0));
    }
    
    // Apply relation
    group.apply_relation(&mut registry);
    
    // Verify formation is maintained (other tracks moved to maintain relative positions)
    let track2_pos = registry.get_track("track2").unwrap().position();
    let track3_pos = registry.get_track("track3").unwrap().position();
    
    // Check that distances between points are maintained
    let original_side = 1.0f32; // Original side length of triangle
    assert_relative_eq!(
        (track2_pos - Vector3::new(1.0, 1.0, 0.0)).magnitude(),
        original_side,
        epsilon = 1e-5
    );
    assert_relative_eq!(
        (track3_pos - Vector3::new(1.0, 1.0, 0.0)).magnitude(),
        original_side,
        epsilon = 1e-5
    );
}

#[test]
fn test_group_pattern_combination() {
    let mut registry = TrackRegistry::new();
    
    // Add test tracks
    for i in 1..=10 {
        let track = Track::new(&format!("track{}", i), Vector3::new(0.0, 0.0, 0.0));
        registry.add_track(track);
    }
    
    // Create group with combined pattern
    let pattern = GroupPattern::Union(vec![
        GroupPattern::Range { start: 1, end: 3 },
        GroupPattern::Set(vec!["track5".to_string(), "track7".to_string()]),
    ]);
    let group = Group::new("combined_group", pattern);
    
    // Verify group members
    let members: HashSet<_> = group.resolve_members(&registry).collect();
    assert_eq!(members.len(), 5);
    assert!(members.contains("track1"));
    assert!(members.contains("track2"));
    assert!(members.contains("track3"));
    assert!(members.contains("track5"));
    assert!(members.contains("track7"));
}
