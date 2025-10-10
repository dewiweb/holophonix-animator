use super::*;
use std::time::Duration;
use crate::math::vector::Vector3;
use crate::animation::motion::{CircularMotion, CircularPlane, MotionModel};

#[test]
fn test_group_rotation() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    registry.add_track(track_id.clone());
    registry.update_track_position(&track_id, Vector3::new(1.0, 0.0, 0.0));

    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);

    // Test rotation around Z axis by 90 degrees
    group.set_relation(&track_id, GroupRelation::Rotate {
        angle: std::f64::consts::PI / 2.0,
        axis: Vector3::new(0.0, 0.0, 1.0),
        center: Some(Vector3::zero()),
    });

    group.update_positions(&mut registry, Duration::from_secs(0));
    let pos = registry.get_track(&track_id).unwrap().position();
    
    assert!((pos.x() + 0.0).abs() < 1e-10);
    assert!((pos.y() - 1.0).abs() < 1e-10);
    assert!((pos.z() - 0.0).abs() < 1e-10);
}

#[test]
fn test_phase_offset() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    registry.add_track(track_id.clone());

    // Create a circular motion
    let motion = CircularMotion::new(
        Vector3::zero(),
        1.0,
        1.0, // 1 Hz = 1 second per cycle
        CircularPlane::XY,
    );
    registry.set_track_motion(&track_id, Box::new(motion));

    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);

    // Test 90 degree phase offset
    group.set_relation(&track_id, GroupRelation::Phase(90.0));

    // At t=0, with 90° phase offset, position should be at (0,1,0)
    group.update_positions(&mut registry, Duration::from_secs(0));
    let pos = registry.get_track(&track_id).unwrap().position();
    
    assert!((pos.x() - 0.0).abs() < 1e-10);
    assert!((pos.y() - 1.0).abs() < 1e-10);
    assert!((pos.z() - 0.0).abs() < 1e-10);
}

#[test]
fn test_speed_and_scale() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    registry.add_track(track_id.clone());

    // Create a circular motion
    let motion = CircularMotion::new(
        Vector3::zero(),
        1.0,
        1.0,
        CircularPlane::XY,
    );
    registry.set_track_motion(&track_id, Box::new(motion));

    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);

    // Test double speed
    group.set_speed_factor(2.0);
    group.update_positions(&mut registry, Duration::from_secs_f64(0.25));
    let pos1 = registry.get_track(&track_id).unwrap().position();

    // Should be equivalent to normal speed at t=0.5
    registry.set_track_motion(&track_id, Box::new(motion)); // Reset motion
    group.set_speed_factor(1.0);
    group.update_positions(&mut registry, Duration::from_secs_f64(0.5));
    let pos2 = registry.get_track(&track_id).unwrap().position();

    assert!((pos1.x() - pos2.x()).abs() < 1e-10);
    assert!((pos1.y() - pos2.y()).abs() < 1e-10);
    assert!((pos1.z() - pos2.z()).abs() < 1e-10);

    // Test double scale
    group.set_scale_factor(2.0);
    group.update_positions(&mut registry, Duration::from_secs(0));
    let pos = registry.get_track(&track_id).unwrap().position();
    
    assert!((pos.x() - 2.0).abs() < 1e-10);
    assert!((pos.y() - 0.0).abs() < 1e-10);
    assert!((pos.z() - 0.0).abs() < 1e-10);
}

#[test]
fn test_time_offset() {
    let mut registry = TrackRegistry::new();
    let track_id = "test_track".to_string();
    registry.add_track(track_id.clone());

    // Create a circular motion
    let motion = CircularMotion::new(
        Vector3::zero(),
        1.0,
        1.0,
        CircularPlane::XY,
    );
    registry.set_track_motion(&track_id, Box::new(motion));

    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);

    // Test with 0.25s offset
    group.set_time_offset(Duration::from_secs_f64(0.25));
    group.update_positions(&mut registry, Duration::from_secs(0));
    let pos1 = registry.get_track(&track_id).unwrap().position();

    // Should be equivalent to no offset at t=0.25
    registry.set_track_motion(&track_id, Box::new(motion)); // Reset motion
    group.set_time_offset(Duration::from_secs(0));
    group.update_positions(&mut registry, Duration::from_secs_f64(0.25));
    let pos2 = registry.get_track(&track_id).unwrap().position();

    assert!((pos1.x() - pos2.x()).abs() < 1e-10);
    assert!((pos1.y() - pos2.y()).abs() < 1e-10);
    assert!((pos1.z() - pos2.z()).abs() < 1e-10);
}
