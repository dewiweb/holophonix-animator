use crate::osc::protocol::Protocol;
use crate::osc::types::{CartesianCoordinates, PolarCoordinates, Color, TrackParameters, OSCErrorType};

#[test]
fn test_validate_track_id() {
    // Valid track ID
    assert!(Protocol::validate_track_id("1").is_ok());
    
    // Empty track ID
    let err = Protocol::validate_track_id("").unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
    
    // Invalid track ID format
    let err = Protocol::validate_track_id("track/1").unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
}

#[test]
fn test_validate_cartesian_coordinates() {
    // Valid coordinates
    let valid_coords = CartesianCoordinates {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };
    assert!(Protocol::validate_cartesian_coordinates(&valid_coords).is_ok());

    let valid_coords = CartesianCoordinates {
        x: 1.0,
        y: -1.0,
        z: 0.5,
    };
    assert!(Protocol::validate_cartesian_coordinates(&valid_coords).is_ok());

    // Invalid x coordinate
    let invalid_coords = CartesianCoordinates {
        x: 1.5,
        y: 0.0,
        z: 0.0,
    };
    let err = Protocol::validate_cartesian_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));

    // Invalid y coordinate
    let invalid_coords = CartesianCoordinates {
        x: 0.0,
        y: -1.5,
        z: 0.0,
    };
    let err = Protocol::validate_cartesian_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));

    // Invalid z coordinate
    let invalid_coords = CartesianCoordinates {
        x: 0.0,
        y: 0.0,
        z: 2.0,
    };
    let err = Protocol::validate_cartesian_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
}

#[test]
fn test_validate_polar_coordinates() {
    // Valid coordinates
    let valid_coords = PolarCoordinates {
        azim: 0.0,
        elev: 0.0,
        dist: 0.0,
    };
    assert!(Protocol::validate_polar_coordinates(&valid_coords).is_ok());

    let valid_coords = PolarCoordinates {
        azim: 360.0,
        elev: 90.0,
        dist: 1.0,
    };
    assert!(Protocol::validate_polar_coordinates(&valid_coords).is_ok());

    // Invalid azimuth
    let invalid_coords = PolarCoordinates {
        azim: 361.0,
        elev: 0.0,
        dist: 0.0,
    };
    let err = Protocol::validate_polar_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));

    // Invalid elevation
    let invalid_coords = PolarCoordinates {
        azim: 0.0,
        elev: 91.0,
        dist: 0.0,
    };
    let err = Protocol::validate_polar_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));

    // Invalid distance
    let invalid_coords = PolarCoordinates {
        azim: 0.0,
        elev: 0.0,
        dist: 2.0,
    };
    let err = Protocol::validate_polar_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
}

#[test]
fn test_validate_track_parameters() {
    // Valid parameters
    let valid_params = TrackParameters {
        gain: 0.0,
        mute: false,
        solo: false,
        color: Color::Red,
    };
    assert!(Protocol::validate_track_parameters(&valid_params).is_ok());

    // Invalid gain
    let invalid_params = TrackParameters {
        gain: 1.5,
        mute: false,
        solo: false,
        color: Color::Red,
    };
    let err = Protocol::validate_track_parameters(&invalid_params).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
}

#[test]
fn test_format_track_address() {
    assert_eq!(Protocol::format_track_address("1"), "/track/1");
    assert_eq!(Protocol::format_track_address("42"), "/track/42");
}

#[test]
fn test_format_track_position_address() {
    assert_eq!(Protocol::format_track_position_address("1"), "/track/1/position");
    assert_eq!(Protocol::format_track_position_address("42"), "/track/42/position");
}

#[test]
fn test_create_messages() {
    let track_id = "1";
    let position = CartesianCoordinates {
        x: 0.0,
        y: 0.0,
        z: 0.0,
    };
    let params = TrackParameters {
        gain: 0.0,
        mute: false,
        solo: false,
        color: Color::Red,
    };

    let messages = Protocol::create_messages(track_id, &position, &params).unwrap();
    assert!(!messages.is_empty());

    // Verify position message
    let position_msg = messages.iter().find(|msg| msg.address.ends_with("/position")).unwrap();
    assert_eq!(position_msg.args.len(), 3);

    // Verify parameters messages
    let gain_msg = messages.iter().find(|msg| msg.address.ends_with("/gain")).unwrap();
    assert_eq!(gain_msg.args.len(), 1);
}
