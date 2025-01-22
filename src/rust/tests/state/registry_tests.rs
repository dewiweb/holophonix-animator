use holophonix_animator_core::{
    state::{Track, registry::TrackRegistry},
    math::vector::Vector3,
};
use std::collections::HashSet;

#[test]
fn test_registry_creation_and_basic_operations() {
    let mut registry = TrackRegistry::new();
    
    // Test empty registry
    assert_eq!(registry.track_count(), 0);
    assert!(registry.get_track("track1").is_none());
    
    // Add a track
    let track = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
    registry.add_track(track);
    
    assert_eq!(registry.track_count(), 1);
    assert!(registry.get_track("track1").is_some());
}

#[test]
fn test_track_removal() {
    let mut registry = TrackRegistry::new();
    let track = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
    registry.add_track(track);
    
    // Remove existing track
    assert!(registry.remove_track("track1"));
    assert_eq!(registry.track_count(), 0);
    
    // Try to remove non-existent track
    assert!(!registry.remove_track("track2"));
}

#[test]
fn test_track_retrieval_and_modification() {
    let mut registry = TrackRegistry::new();
    let track = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
    registry.add_track(track);
    
    // Modify track through registry
    {
        let track = registry.get_track_mut("track1").unwrap();
        track.set_position(Vector3::new(1.0, 1.0, 1.0));
        track.set_active(true);
    }
    
    // Verify modifications
    let track = registry.get_track("track1").unwrap();
    assert_eq!(track.position(), Vector3::new(1.0, 1.0, 1.0));
    assert!(track.is_active());
}

#[test]
fn test_duplicate_track_handling() {
    let mut registry = TrackRegistry::new();
    
    // Add first track
    let track1 = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
    assert!(registry.add_track(track1));
    
    // Try to add second track with same ID
    let track2 = Track::new("track1", Vector3::new(1.0, 1.0, 1.0));
    assert!(!registry.add_track(track2));
    
    // Verify first track remained unchanged
    let track = registry.get_track("track1").unwrap();
    assert_eq!(track.position(), Vector3::new(0.0, 0.0, 0.0));
}

#[test]
fn test_track_iteration() {
    let mut registry = TrackRegistry::new();
    
    // Add multiple tracks
    let track_ids = vec!["track1", "track2", "track3"];
    for id in &track_ids {
        let track = Track::new(id, Vector3::new(0.0, 0.0, 0.0));
        registry.add_track(track);
    }
    
    // Collect all track IDs through iteration
    let mut found_ids: HashSet<String> = registry.iter()
        .map(|track| track.id().to_string())
        .collect();
    
    // Verify all tracks were iterated
    assert_eq!(found_ids.len(), track_ids.len());
    for id in track_ids {
        assert!(found_ids.remove(id));
    }
    assert!(found_ids.is_empty());
}

#[test]
fn test_bulk_operations() {
    let mut registry = TrackRegistry::new();
    
    // Add multiple tracks
    let positions = vec![
        ("track1", Vector3::new(0.0, 0.0, 0.0)),
        ("track2", Vector3::new(1.0, 1.0, 1.0)),
        ("track3", Vector3::new(2.0, 2.0, 2.0)),
    ];
    
    for (id, pos) in &positions {
        let track = Track::new(id, *pos);
        registry.add_track(track);
    }
    
    // Test bulk activation
    registry.set_all_active(true);
    for track in registry.iter() {
        assert!(track.is_active());
    }
    
    // Test bulk position offset
    let offset = Vector3::new(1.0, 1.0, 1.0);
    registry.offset_all_positions(offset);
    
    for (id, original_pos) in &positions {
        let track = registry.get_track(id).unwrap();
        assert_eq!(track.position(), *original_pos + offset);
    }
}
