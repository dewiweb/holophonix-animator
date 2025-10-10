use holophonix_animator_core::{
    state::{Track, TrackRegistry, history::{History, HistoryAction}},
    math::vector::Vector3,
};
use std::time::Duration;

#[test]
fn test_history_basic() {
    let mut history = History::new();
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Test empty history
    assert!(history.undo().is_none());
    assert!(history.redo().is_none());
    
    // Test adding a track
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(0.0, 0.0, 0.0));
    history.record_add(track.clone());
    
    // Test undo
    let action = history.undo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Test redo
    let action = history.redo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Test undo again
    let action = history.undo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Test no more undos
    assert!(history.undo().is_none());
}

#[test]
fn test_history_multiple_actions() {
    let mut history = History::new();
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Add track
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(0.0, 0.0, 0.0));
    history.record_add(track.clone());
    
    // Modify track
    let old_track = track.clone();
    let mut new_track = track.clone();
    new_track.set_position(Vector3::new(1.0, 1.0, 1.0));
    history.record_modify(old_track, new_track);
    
    // Remove track
    let track = track.clone();
    history.record_remove(track);
    registry.remove_track(&track_id);
    
    // Test undo sequence
    let action = history.undo().unwrap(); // Undo remove
    assert!(matches!(action, HistoryAction::RemoveTrack(_)));
    
    let action = history.undo().unwrap(); // Undo modify
    assert!(matches!(action, HistoryAction::ModifyTrack { .. }));
    
    let action = history.undo().unwrap(); // Undo add
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Test redo sequence
    let action = history.redo().unwrap(); // Redo add
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    let action = history.redo().unwrap(); // Redo modify
    assert!(matches!(action, HistoryAction::ModifyTrack { .. }));
    
    let action = history.redo().unwrap(); // Redo remove
    assert!(matches!(action, HistoryAction::RemoveTrack(_)));
    
    // Test no more redos
    assert!(history.redo().is_none());
}

#[test]
fn test_history_clear() {
    let mut history = History::new();
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    
    // Add some actions
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(0.0, 0.0, 0.0));
    history.record_add(track.clone());
    
    let old_track = track.clone();
    let mut new_track = track.clone();
    new_track.set_position(Vector3::new(1.0, 1.0, 1.0));
    history.record_modify(old_track, new_track);
    
    // Clear history
    history.clear();
    
    // Verify no actions remain
    assert!(history.undo().is_none());
    assert!(history.redo().is_none());
}

#[test]
fn test_undo_redo_track_addition() {
    let mut registry = TrackRegistry::new();
    let mut history = History::new();
    
    // Add a track
    let track_id = "test".to_string();
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(1.0, 2.0, 3.0));
    history.record_add(track.clone());
    
    assert!(registry.get_track("test").is_some());
    
    // Undo the addition
    let action = history.undo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Redo the addition
    let action = history.redo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
}

#[test]
fn test_undo_redo_track_modification() {
    let mut registry = TrackRegistry::new();
    let mut history = History::new();
    
    // Add a track
    let track_id = "test".to_string();
    registry.add_track(track_id.clone());
    let mut track = Track::new(&track_id, Vector3::new(1.0, 2.0, 3.0));
    registry.update_track_position(&track_id, track.position());
    
    // Modify track position
    let old_track = track.clone();
    track.set_position(Vector3::new(4.0, 5.0, 6.0));
    registry.update_track_position(&track_id, track.position());
    history.record_modify(old_track, track.clone());
    
    // Verify current state
    assert_eq!(registry.get_track("test").unwrap().position(), Vector3::new(4.0, 5.0, 6.0));
    
    // Undo the modification
    let action = history.undo().unwrap();
    if let HistoryAction::ModifyTrack { before, after: _ } = action {
        registry.update_track_position(before.id(), before.position());
    }
    
    // Verify state after undo
    assert_eq!(registry.get_track("test").unwrap().position(), Vector3::new(1.0, 2.0, 3.0));
    
    // Redo the modification
    let action = history.redo().unwrap();
    if let HistoryAction::ModifyTrack { before: _, after } = action {
        registry.update_track_position(after.id(), after.position());
    }
    
    // Verify state after redo
    assert_eq!(registry.get_track("test").unwrap().position(), Vector3::new(4.0, 5.0, 6.0));
}

#[test]
fn test_history_limit() {
    let mut registry = TrackRegistry::new();
    let mut history = History::new();
    
    // Add more than MAX_HISTORY tracks
    for i in 0..150 {
        let track_id = format!("track_{}", i);
        registry.add_track(track_id.clone());
        let track = Track::new(&track_id, Vector3::new(0.0, 0.0, 0.0));
        history.record_add(track.clone());
    }
    
    // Verify history is limited
    let mut undo_count = 0;
    while history.undo().is_some() {
        undo_count += 1;
    }
    assert!(undo_count < 150);
}

#[test]
fn test_history_branching() {
    let mut registry = TrackRegistry::new();
    let mut history = History::new();
    
    // Add a track
    let track_id = "test".to_string();
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(1.0, 2.0, 3.0));
    history.record_add(track.clone());
    
    // Undo the addition
    let action = history.undo().unwrap();
    assert!(matches!(action, HistoryAction::AddTrack(_)));
    
    // Record a new change
    let track_id = "test2".to_string();
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(4.0, 5.0, 6.0));
    history.record_add(track.clone());
    
    // Verify redo stack is cleared
    assert!(!history.can_redo());
}

#[test]
fn test_undo_redo_track_removal() {
    let mut registry = TrackRegistry::new();
    let mut history = History::new();
    
    // Add a track
    let track_id = "test".to_string();
    registry.add_track(track_id.clone());
    let track = Track::new(&track_id, Vector3::new(1.0, 2.0, 3.0));
    registry.update_track_position(&track_id, track.position());
    
    // Remove the track
    history.record_remove(track.clone());
    registry.remove_track(&track_id);
    
    // Verify track is removed
    assert!(registry.get_track("test").is_none());
    
    // Undo the removal
    let action = history.undo().unwrap();
    if let HistoryAction::RemoveTrack(track) = action {
        registry.add_track(track.id().to_string());
        registry.update_track_position(track.id(), track.position());
    }
    
    // Verify track is restored
    let restored_track = registry.get_track("test").unwrap();
    assert_eq!(restored_track.position(), Vector3::new(1.0, 2.0, 3.0));
    
    // Redo the removal
    let action = history.redo().unwrap();
    if let HistoryAction::RemoveTrack(_) = action {
        registry.remove_track(&track_id);
    }
    
    // Verify track is removed again
    assert!(registry.get_track("test").is_none());
}
