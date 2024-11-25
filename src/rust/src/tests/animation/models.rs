use crate::animation::models::{
    AnimationModel,
    AnimationParameters,
    linear::LinearModel,
    circular::CircularModel,
    pattern::{PatternModel, PatternParams, PatternType},
};
use crate::models::Position;
use std::time::Duration;

#[test]
fn test_linear_animation() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 10.0, y: 5.0, z: 0.0 },
        duration: 2.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    
    // Test start position
    let pos = model.calculate_position(0.0);
    assert_eq!(pos.x, 0.0);
    assert_eq!(pos.y, 0.0);
    assert_eq!(pos.z, 0.0);

    // Test middle position
    let pos = model.calculate_position(1.0);
    assert_eq!(pos.x, 5.0);
    assert_eq!(pos.y, 2.5);
    assert_eq!(pos.z, 0.0);

    // Test end position
    let pos = model.calculate_position(2.0);
    assert_eq!(pos.x, 10.0);
    assert_eq!(pos.y, 5.0);
    assert_eq!(pos.z, 0.0);
}

#[test]
fn test_circular_animation() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        duration: 4.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![("radius".to_string(), 1.0)],
    };

    let model = CircularModel::new(params);
    
    // Test positions around the circle
    let pos = model.calculate_position(0.0);
    assert!((pos.x - 1.0).abs() < 1e-6);
    assert!(pos.y.abs() < 1e-6);

    let pos = model.calculate_position(1.0);
    assert!(pos.x.abs() < 1e-6);
    assert!((pos.y - 1.0).abs() < 1e-6);

    let pos = model.calculate_position(2.0);
    assert!((pos.x + 1.0).abs() < 1e-6);
    assert!(pos.y.abs() < 1e-6);

    let pos = model.calculate_position(3.0);
    assert!(pos.x.abs() < 1e-6);
    assert!((pos.y + 1.0).abs() < 1e-6);
}

#[test]
fn test_pattern_animation() {
    let pattern_params = PatternParams {
        pattern_type: PatternType::Square,
        size: 2.0,
        rotation: 0.0,
    };

    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        duration: 4.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = PatternModel::new(params, pattern_params);
    
    // Test square pattern corners
    let pos = model.calculate_position(0.0);
    assert!((pos.x - 1.0).abs() < 1e-6);
    assert!((pos.y - 1.0).abs() < 1e-6);

    let pos = model.calculate_position(1.0);
    assert!((pos.x + 1.0).abs() < 1e-6);
    assert!((pos.y - 1.0).abs() < 1e-6);

    let pos = model.calculate_position(2.0);
    assert!((pos.x + 1.0).abs() < 1e-6);
    assert!((pos.y + 1.0).abs() < 1e-6);

    let pos = model.calculate_position(3.0);
    assert!((pos.x - 1.0).abs() < 1e-6);
    assert!((pos.y + 1.0).abs() < 1e-6);
}

#[test]
fn test_animation_duration() {
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 2.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    assert_eq!(model.get_duration(), 2.0);
    assert!(!model.is_complete(1.9));
    assert!(model.is_complete(2.0));
    assert!(model.is_complete(2.1));
}
