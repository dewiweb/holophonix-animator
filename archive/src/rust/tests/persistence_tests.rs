use std::{path::PathBuf, time::Duration};
use holophonix_animator_core::{
    state::{persistence::{save_state, load_state}, TrackRegistry, GroupPattern},
    math::vector::Vector3,
    animation::{
        motion::{LinearMotion, CircularMotion, CircularPlane},
        models::MotionModel,
    },
};
use approx::assert_relative_eq;

#[test]
fn test_persistence() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();

    // Add a track with position and metadata
    registry.add_track(track_id.clone());
    registry.update_track_position(&track_id, Vector3::new(1.0, 2.0, 3.0));
    registry.set_track_metadata(&track_id, "key1", "value1");
    registry.set_track_metadata(&track_id, "key2", "value2");

    // Save state
    let path = PathBuf::from("test_persistence.json");
    assert!(save_state(&path, &registry).is_ok());

    // Load state
    let loaded = load_state(&path).unwrap();

    // Verify track was restored
    let track = loaded.get_track(&track_id).unwrap();
    assert_eq!(track.position(), Vector3::new(1.0, 2.0, 3.0));
    assert_eq!(track.get_metadata("key1"), Some("value1"));
    assert_eq!(track.get_metadata("key2"), Some("value2"));
}

#[test]
fn test_save_load_empty_state() {
    let registry = TrackRegistry::new();
    let path = PathBuf::from("test_empty_state.json");
    
    // Save empty state
    assert!(save_state(&path, &registry).is_ok());
    
    // Load empty state
    let loaded = load_state(&path).unwrap();
    assert_eq!(loaded.tracks().count(), 0);
}

#[test]
fn test_save_load_single_track() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Add track and set position
    registry.add_track(track_id.clone());
    registry.update_track_position(&track_id, Vector3::new(0.5, 0.5, 0.5));
    
    let path = PathBuf::from("test_single_track.json");
    
    assert!(save_state(&path, &registry).is_ok());
    let loaded = load_state(&path).unwrap();
    
    assert_eq!(loaded.tracks().count(), 1);
    let track = loaded.get_track(&track_id).unwrap();
    let pos = track.position();
    assert_relative_eq!(pos.x, 0.5, epsilon = 0.001);
    assert_relative_eq!(pos.y, 0.5, epsilon = 0.001);
    assert_relative_eq!(pos.z, 0.5, epsilon = 0.001);
}

#[test]
fn test_save_load_multiple_tracks() {
    let mut registry = TrackRegistry::new();
    
    // Add multiple tracks with different positions
    for i in 0..3 {
        let track_id = format!("track_{}", i);
        registry.add_track(track_id.clone());
        registry.update_track_position(&track_id, Vector3::new(i as f64, i as f64, i as f64));
    }
    
    let path = PathBuf::from("test_multiple_tracks.json");
    assert!(save_state(&path, &registry).is_ok());
    
    // Load and verify
    let loaded = load_state(&path).unwrap();
    assert_eq!(loaded.tracks().count(), 3);
    
    for i in 0..3 {
        let track_id = format!("track_{}", i);
        let track = loaded.get_track(&track_id).unwrap();
        assert_eq!(track.position(), Vector3::new(i as f64, i as f64, i as f64));
    }
}

#[test]
fn test_save_load_track_with_animation() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Add track and bind animation
    registry.add_track(track_id.clone());
    let motion = LinearMotion::new(
        Vector3::new(0.0, 0.0, 0.0),
        Vector3::new(1.0, 1.0, 1.0),
        Duration::from_secs(1),
    );
    registry.bind_animation(&track_id, Box::new(motion));
    
    let path = PathBuf::from("test_track_with_animation.json");
    
    assert!(save_state(&path, &registry).is_ok());
    let mut loaded = load_state(&path).unwrap();
    
    // Update animation and check position
    loaded.update_animation(&track_id, Duration::from_millis(500));
    let track = loaded.get_track(&track_id).unwrap();
    let pos = track.position();
    assert_relative_eq!(pos.x, 0.5, epsilon = 0.001);
    assert_relative_eq!(pos.y, 0.5, epsilon = 0.001);
    assert_relative_eq!(pos.z, 0.5, epsilon = 0.001);
}

#[test]
fn test_save_load_track_with_metadata() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Add track and set metadata
    registry.add_track(track_id.clone());
    registry.set_track_metadata(&track_id, "key1", "value1");
    registry.set_track_metadata(&track_id, "key2", "value2");
    
    let path = PathBuf::from("test_track_with_metadata.json");
    assert!(save_state(&path, &registry).is_ok());
    
    // Load and verify metadata
    let loaded = load_state(&path).unwrap();
    let track = loaded.get_track(&track_id).unwrap();
    assert_eq!(track.get_metadata("key1"), Some("value1"));
    assert_eq!(track.get_metadata("key2"), Some("value2"));
}
