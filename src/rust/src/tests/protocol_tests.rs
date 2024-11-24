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
        dist: 1.1,
    };
    let err = Protocol::validate_polar_coordinates(&invalid_coords).unwrap_err();
    assert!(matches!(err.error_type, OSCErrorType::Validation));
}

#[test]
fn test_validate_track_parameters() {
    // Valid parameters
    let valid_params = TrackParameters {
        cartesian: Some(CartesianCoordinates {
            x: 0.5,
            y: -0.5,
            z: 0.0,
        }),
        polar: None,
        gain: Some(-6.0),
        mute: Some(false),
        color: Some(Color {
            r: 1.0,
            g: 0.5,
            b: 0.0,
            a: 1.0,
        }),
    };

    assert!(Protocol::validate_track_parameters("1", &valid_params).is_ok());

    // Test invalid gain
    let invalid_gain_params = TrackParameters {
        cartesian: None,
        polar: None,
        gain: Some(-70.0),
        mute: None,
        color: None,
    };
    assert!(Protocol::validate_track_parameters("1", &invalid_gain_params).is_err());

    // Test invalid color
    let invalid_color_params = TrackParameters {
        cartesian: None,
        polar: None,
        gain: None,
        mute: None,
        color: Some(Color {
            r: 1.5,
            g: 0.5,
            b: 0.0,
            a: 1.0,
        }),
    };
    assert!(Protocol::validate_track_parameters("1", &invalid_color_params).is_err());
}

#[test]
fn test_format_track_address() {
    assert_eq!(
        Protocol::format_track_address("1", "xyz").unwrap(),
        "/track/1/xyz"
    );

    assert_eq!(
        Protocol::format_track_address("1", "gain/value").unwrap(),
        "/track/1/gain/value"
    );

    assert!(Protocol::format_track_address("", "xyz").is_err());
    assert!(Protocol::format_track_address("1", "invalid").is_err());
}

#[test]
fn test_format_track_position_address() {
    // Valid cartesian address
    let addr = Protocol::format_track_position_address("1", "cart").unwrap();
    assert_eq!(addr, "/track/1/xyz");
    
    // Valid polar address
    let addr = Protocol::format_track_position_address("1", "polar").unwrap();
    assert_eq!(addr, "/track/1/aed");
    
    // Invalid coordinate type
    assert!(Protocol::format_track_position_address("1", "invalid").is_err());
    
    // Invalid track ID
    assert!(Protocol::format_track_position_address("track/1", "cart").is_err());
}

#[test]
fn test_create_messages() {
    let track_id = "1";
    let cart_coords = CartesianCoordinates {
        x: 0.5,
        y: -0.5,
        z: 0.0,
    };
    let polar_coords = PolarCoordinates {
        azim: 180.0,
        elev: 45.0,
        dist: 0.5,
    };
    let color = Color {
        r: 1.0,
        g: 0.5,
        b: 0.0,
        a: 1.0,
    };

    let position_msg = Protocol::create_position_message(track_id, &cart_coords).unwrap();
    assert_eq!(position_msg.addr, "/track/1/xyz");

    let polar_msg = Protocol::create_polar_message(track_id, &polar_coords).unwrap();
    assert_eq!(polar_msg.addr, "/track/1/aed");

    let gain_msg = Protocol::create_gain_message(track_id, -6.0).unwrap();
    assert_eq!(gain_msg.addr, "/track/1/gain/value");

    let mute_msg = Protocol::create_mute_message(track_id, false).unwrap();
    assert_eq!(mute_msg.addr, "/track/1/mute");

    let color_msg = Protocol::create_color_message(track_id, &color).unwrap();
    assert_eq!(color_msg.addr, "/track/1/color");
}
