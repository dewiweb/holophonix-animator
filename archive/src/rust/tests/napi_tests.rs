#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
use holophonix_animator_core::{
    state::{TrackRegistry, Group, GroupPattern, GroupRelation},
    math::vector::Vector3,
    napi::napi_bindings::{
        JsBooleanWrapper, JsArrayWrapper, JsOptionalWrapper,
        Vector3JSNapi as Vector3JS,
        GroupPatternJSNapi as GroupPatternJS,
        GroupRelationJSNapi as GroupRelationJS,
        TrackRegistryJSNapi as TrackRegistryJS,
        GroupJSNapi as GroupJS,
    },
};

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_track_registry_binding() {
    // Create a track registry
    let mut registry = TrackRegistryJS::new();
    
    // Test adding a track
    let track_id = "test_track".to_string();
    assert!(registry.add_track(track_id.clone()));
    assert!(!registry.add_track(track_id.clone())); // Should fail as track already exists
    
    // Test getting track position
    let pos = registry.get_track_position(track_id.clone()).unwrap();
    assert_eq!(pos.x, 0.0);
    assert_eq!(pos.y, 0.0);
    assert_eq!(pos.z, 0.0);
    
    // Test updating position
    let new_pos = Vector3JS { x: 1.0, y: 2.0, z: 3.0 };
    assert!(registry.update_track_position(track_id.clone(), new_pos.clone()));
    
    let updated_pos = registry.get_track_position(track_id.clone()).unwrap();
    assert_eq!(updated_pos.x, new_pos.x);
    assert_eq!(updated_pos.y, new_pos.y);
    assert_eq!(updated_pos.z, new_pos.z);
    
    // Test removing track
    assert!(registry.remove_track(track_id.clone()));
    assert!(!registry.remove_track(track_id.clone())); // Should fail as track no longer exists
}

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_group_binding() {
    let mut registry = TrackRegistryJS::new();
    let mut group = GroupJS::new("test_group".to_string(), GroupPatternJS::all());
    
    // Add test tracks
    let track1 = "track1".to_string();
    let track2 = "track2".to_string();
    registry.add_track(track1.clone());
    registry.add_track(track2.clone());
    
    // Update group members
    group.update_members(&registry);
    
    // Test track membership
    let members = group.get_members();
    assert!(members.contains(&track1));
    assert!(members.contains(&track2));
    
    // Test isobarycentric relation
    let relation = GroupRelationJS::isobarycentric(Some(1.0), true);
    
    group.set_relation(track1.clone(), relation.clone());
    group.set_relation(track2.clone(), relation);
    
    // Set initial positions
    registry.update_track_position(
        track1.clone(),
        Vector3JS { x: 1.0, y: 0.0, z: 0.0 }
    );
    registry.update_track_position(
        track2.clone(),
        Vector3JS { x: -1.0, y: 0.0, z: 0.0 }
    );
    
    // Update positions
    group.update_positions(&mut registry, 0.0);
    
    // Check that tracks maintain equal distance from center
    let pos1 = registry.get_track_position(track1).unwrap();
    let pos2 = registry.get_track_position(track2).unwrap();
    
    let center = Vector3JS {
        x: (pos1.x + pos2.x) / 2.0,
        y: (pos1.y + pos2.y) / 2.0,
        z: (pos1.z + pos2.z) / 2.0,
    };
    
    let dist1 = ((pos1.x - center.x).powi(2) + 
                 (pos1.y - center.y).powi(2) + 
                 (pos1.z - center.z).powi(2)).sqrt();
    let dist2 = ((pos2.x - center.x).powi(2) + 
                 (pos2.y - center.y).powi(2) + 
                 (pos2.z - center.z).powi(2)).sqrt();
    
    assert!((dist1 - dist2).abs() < 1e-10);
}

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_group_pattern_types() {
    // Test All pattern
    let pattern_all = GroupPatternJS::all();
    let rust_pattern_all: GroupPattern = (&pattern_all).into();
    assert!(matches!(rust_pattern_all, GroupPattern::All));

    // Test Pattern pattern
    let pattern_regex = GroupPatternJS::pattern("test.*".to_string());
    let rust_pattern_regex: GroupPattern = (&pattern_regex).into();
    assert!(matches!(rust_pattern_regex, GroupPattern::Pattern(p) if p == "test.*"));

    // Test List pattern
    let pattern_list = GroupPatternJS::list(vec!["track1".to_string(), "track2".to_string()]);
    let rust_pattern_list: GroupPattern = (&pattern_list).into();
    assert!(matches!(rust_pattern_list, GroupPattern::List(l) if l == vec!["track1", "track2"]));
}

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_group_relation_types() {
    // Test None relation
    let relation_none = GroupRelationJS::none();
    let rust_relation_none: GroupRelation = (&relation_none).into();
    assert!(matches!(rust_relation_none, GroupRelation::None));

    // Test Follow relation
    let relation_follow = GroupRelationJS::follow("target".to_string());
    let rust_relation_follow: GroupRelation = (&relation_follow).into();
    assert!(matches!(rust_relation_follow, GroupRelation::Follow(t) if t == "target"));

    // Test Offset relation
    let offset = Vector3JS { x: 1.0, y: 2.0, z: 3.0 };
    let relation_offset = GroupRelationJS::offset(offset);
    let rust_relation_offset: GroupRelation = (&relation_offset).into();
    assert!(matches!(rust_relation_offset, GroupRelation::Offset(o) if o.x() == 1.0 && o.y() == 2.0 && o.z() == 3.0));

    // Test Rotate relation
    let axis = Vector3JS { x: 0.0, y: 1.0, z: 0.0 };
    let center = Some(Vector3JS { x: 0.0, y: 0.0, z: 0.0 });
    let relation_rotate = GroupRelationJS::rotate(90.0, axis, center);
    let rust_relation_rotate: GroupRelation = (&relation_rotate).into();
    assert!(matches!(rust_relation_rotate, GroupRelation::Rotate { angle, axis, center } 
        if angle == 90.0 
        && axis.y() == 1.0 
        && center.is_some()));

    // Test Phase relation
    let relation_phase = GroupRelationJS::phase(45.0);
    let rust_relation_phase: GroupRelation = (&relation_phase).into();
    assert!(matches!(rust_relation_phase, GroupRelation::Phase(p) if p == 45.0));

    // Test Isobarycentric relation
    let relation_iso = GroupRelationJS::isobarycentric(Some(1.0), true);
    let rust_relation_iso: GroupRelation = (&relation_iso).into();
    assert!(matches!(rust_relation_iso, GroupRelation::Isobarycentric { reference_distance, maintain_plane } 
        if reference_distance == Some(1.0) && maintain_plane));
}

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_vector3_conversion() {
    // Test creating Vector3JS
    let v_js = Vector3JS { x: 1.0, y: 2.0, z: 3.0 };
    
    // Test converting to Rust Vector3
    let v_rust: Vector3 = (&v_js).into();
    assert_eq!(v_rust.x(), v_js.x);
    assert_eq!(v_rust.y(), v_js.y);
    assert_eq!(v_rust.z(), v_js.z);
    
    // Test converting back to JS
    let v_js2: Vector3JS = (&v_rust).into();
    assert_eq!(v_js2.x, v_js.x);
    assert_eq!(v_js2.y, v_js.y);
    assert_eq!(v_js2.z, v_js.z);
}

#[cfg(all(test, feature = "node-api", not(debug_assertions)))]
#[test]
fn test_error_handling() {
    let mut registry = TrackRegistryJS::new();
    
    // Test getting non-existent track
    let result = registry.get_track_position("nonexistent".to_string());
    assert!(result.is_none());
    
    // Test updating non-existent track
    let pos = Vector3JS { x: 1.0, y: 2.0, z: 3.0 };
    assert!(!registry.update_track_position("nonexistent".to_string(), pos));
}
