use super::*;
use std::time::Duration;
use crate::math::vector::Vector3;
use crate::animation::motion::{CircularMotion, CircularPlane};
use approx::assert_relative_eq;

#[test]
fn test_isobarycentric_basic() {
    let mut registry = TrackRegistry::new();
    
    // Create three tracks in a triangle
    let track1 = "track1".to_string();
    let track2 = "track2".to_string();
    let track3 = "track3".to_string();
    
    registry.add_track(track1.clone());
    registry.add_track(track2.clone());
    registry.add_track(track3.clone());
    
    registry.update_track_position(&track1, Vector3::new(1.0, 0.0, 0.0));
    registry.update_track_position(&track2, Vector3::new(-0.5, 0.866, 0.0));
    registry.update_track_position(&track3, Vector3::new(-0.5, -0.866, 0.0));
    
    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);
    
    // Set isobarycentric relation for all tracks
    let relation = GroupRelation::Isobarycentric {
        reference_distance: Some(1.0),
        maintain_plane: true,
    };
    
    for track_id in [&track1, &track2, &track3] {
        group.set_relation(track_id, relation.clone());
    }
    
    // Update positions
    group.update_positions(&mut registry, Duration::from_secs(0));
    
    // Check that all points are equidistant from center
    let center = Vector3::zero(); // Should be at origin due to symmetry
    
    for track_id in [&track1, &track2, &track3] {
        let pos = registry.get_track(track_id).unwrap().position();
        assert_relative_eq!(
            (pos - center).magnitude(),
            1.0,
            epsilon = 1e-10
        );
    }
    
    // Check that points form an equilateral triangle
    let pos1 = registry.get_track(&track1).unwrap().position();
    let pos2 = registry.get_track(&track2).unwrap().position();
    let pos3 = registry.get_track(&track3).unwrap().position();
    
    let dist12 = (pos1 - pos2).magnitude();
    let dist23 = (pos2 - pos3).magnitude();
    let dist31 = (pos3 - pos1).magnitude();
    
    assert_relative_eq!(dist12, dist23, epsilon = 1e-10);
    assert_relative_eq!(dist23, dist31, epsilon = 1e-10);
}

#[test]
fn test_isobarycentric_with_motion() {
    let mut registry = TrackRegistry::new();
    
    // Create two tracks with circular motion
    let track1 = "track1".to_string();
    let track2 = "track2".to_string();
    
    registry.add_track(track1.clone());
    registry.add_track(track2.clone());
    
    // Set up circular motions with different radii
    let motion1 = CircularMotion::new(
        Vector3::zero(),
        2.0,
        1.0,
        CircularPlane::XY,
    );
    let motion2 = CircularMotion::new(
        Vector3::zero(),
        1.0,
        1.0,
        CircularPlane::XY,
    );
    
    registry.set_track_motion(&track1, Box::new(motion1));
    registry.set_track_motion(&track2, Box::new(motion2));
    
    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);
    
    // Set isobarycentric relation
    let relation = GroupRelation::Isobarycentric {
        reference_distance: Some(1.5),
        maintain_plane: true,
    };
    
    for track_id in [&track1, &track2] {
        group.set_relation(track_id, relation.clone());
    }
    
    // Check positions at different times
    for t in [0.0, 0.25, 0.5, 0.75] {
        let time = Duration::from_secs_f64(t);
        group.update_positions(&mut registry, time);
        
        // Calculate center
        let pos1 = registry.get_track(&track1).unwrap().position();
        let pos2 = registry.get_track(&track2).unwrap().position();
        let center = (pos1 + pos2) / 2.0;
        
        // Check distances from center
        assert_relative_eq!(
            (pos1 - center).magnitude(),
            1.5,
            epsilon = 1e-10
        );
        assert_relative_eq!(
            (pos2 - center).magnitude(),
            1.5,
            epsilon = 1e-10
        );
    }
}

#[test]
fn test_isobarycentric_maintain_plane() {
    let mut registry = TrackRegistry::new();
    
    // Create four tracks forming a square
    let track_ids = vec![
        "track1".to_string(),
        "track2".to_string(),
        "track3".to_string(),
        "track4".to_string(),
    ];
    
    for track_id in &track_ids {
        registry.add_track(track_id.clone());
    }
    
    // Set initial positions in XY plane
    registry.update_track_position(&track_ids[0], Vector3::new(1.0, 1.0, 0.0));
    registry.update_track_position(&track_ids[1], Vector3::new(-1.0, 1.0, 0.0));
    registry.update_track_position(&track_ids[2], Vector3::new(-1.0, -1.0, 0.0));
    registry.update_track_position(&track_ids[3], Vector3::new(1.0, -1.0, 0.0));
    
    let mut group = Group::new("test_group", GroupPattern::All);
    group.update_members(&registry);
    
    // Set isobarycentric relation with plane maintenance
    let relation = GroupRelation::Isobarycentric {
        reference_distance: None, // Use initial distances
        maintain_plane: true,
    };
    
    for track_id in &track_ids {
        group.set_relation(track_id, relation.clone());
    }
    
    // Perturb one point out of plane
    registry.update_track_position(&track_ids[0], Vector3::new(1.0, 1.0, 1.0));
    
    // Update positions
    group.update_positions(&mut registry, Duration::from_secs(0));
    
    // Check that all points lie in the same plane
    let pos1 = registry.get_track(&track_ids[0]).unwrap().position();
    let pos2 = registry.get_track(&track_ids[1]).unwrap().position();
    let pos3 = registry.get_track(&track_ids[2]).unwrap().position();
    let pos4 = registry.get_track(&track_ids[3]).unwrap().position();
    
    // Calculate normal of plane using three points
    let v1 = pos2 - pos1;
    let v2 = pos3 - pos1;
    let normal = v1.cross(&v2).normalize();
    
    // Check that fourth point lies in the same plane
    let v4 = pos4 - pos1;
    assert_relative_eq!(
        v4.dot(&normal),
        0.0,
        epsilon = 1e-10
    );
}
