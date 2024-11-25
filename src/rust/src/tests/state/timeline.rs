use std::time::Duration;
use crate::state::timeline::*;

#[test]
fn test_timeline_creation() {
    let timeline = Timeline::new(Duration::from_secs(60));
    let state = timeline.get_state();
    
    assert_eq!(state.current_time, Duration::from_secs(0));
    assert_eq!(state.total_duration, Duration::from_secs(60));
    assert!(!state.is_playing);
    assert!(!state.loop_enabled);
}

#[test]
fn test_timeline_playback() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    timeline.play();
    assert!(timeline.get_state().is_playing);
    
    timeline.pause();
    assert!(!timeline.get_state().is_playing);
}

#[test]
fn test_timeline_seek() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    timeline.seek(Duration::from_secs(30));
    assert_eq!(timeline.get_state().current_time, Duration::from_secs(30));
    
    // Test seeking beyond duration
    timeline.seek(Duration::from_secs(90));
    assert_eq!(timeline.get_state().current_time, Duration::from_secs(60));
}

#[test]
fn test_timeline_duration() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    timeline.seek(Duration::from_secs(45));
    timeline.set_duration(Duration::from_secs(30));
    
    // Current time should be clamped to new duration
    assert_eq!(timeline.get_state().current_time, Duration::from_secs(30));
    assert_eq!(timeline.get_state().total_duration, Duration::from_secs(30));
}

#[test]
fn test_timeline_loop() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    timeline.set_loop(true);
    assert!(timeline.get_state().loop_enabled);
    
    timeline.set_loop(false);
    assert!(!timeline.get_state().loop_enabled);
}

#[test]
fn test_timeline_markers() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    assert!(timeline.add_marker(
        "marker1".to_string(),
        Duration::from_secs(15),
        "Quarter".to_string(),
    ));
    
    assert!(timeline.add_marker(
        "marker2".to_string(),
        Duration::from_secs(30),
        "Half".to_string(),
    ));
    
    // Test duplicate marker
    assert!(!timeline.add_marker(
        "marker1".to_string(),
        Duration::from_secs(45),
        "Three Quarters".to_string(),
    ));
    
    let marker = timeline.get_marker("marker1").unwrap();
    assert_eq!(marker.timestamp, Duration::from_secs(15));
    assert_eq!(marker.label, "Quarter");
}

#[test]
fn test_timeline_marker_ranges() {
    let mut timeline = Timeline::new(Duration::from_secs(60));
    
    timeline.add_marker(
        "marker1".to_string(),
        Duration::from_secs(15),
        "Quarter".to_string(),
    );
    
    timeline.add_marker(
        "marker2".to_string(),
        Duration::from_secs(30),
        "Half".to_string(),
    );
    
    timeline.add_marker(
        "marker3".to_string(),
        Duration::from_secs(45),
        "Three Quarters".to_string(),
    );
    
    let markers = timeline.get_markers_in_range(
        Duration::from_secs(10),
        Duration::from_secs(35),
    );
    
    assert_eq!(markers.len(), 2);
    assert_eq!(markers[0].label, "Quarter");
    assert_eq!(markers[1].label, "Half");
}
