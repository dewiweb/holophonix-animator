use rosc::{OscMessage, OscType};
use crate::osc::types::{OSCError, OSCErrorType, TrackParameters, CartesianCoordinates, PolarCoordinates, Color};

pub struct Protocol;

impl Protocol {
    pub fn validate_track_id(track_id: &str) -> Result<(), OSCError> {
        if track_id.is_empty() {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                "Track ID cannot be empty".to_string(),
            ));
        }
        if track_id.contains('/') {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                "Track ID cannot contain '/'".to_string(),
            ));
        }
        Ok(())
    }

    pub fn validate_coordinates(coords: &CartesianCoordinates) -> Result<(), OSCError> {
        if !(-1000.0..=1000.0).contains(&coords.x) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("X coordinate {} out of range [-1000, 1000]", coords.x),
            ));
        }
        if !(-1000.0..=1000.0).contains(&coords.y) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Y coordinate {} out of range [-1000, 1000]", coords.y),
            ));
        }
        if !(-1000.0..=1000.0).contains(&coords.z) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Z coordinate {} out of range [-1000, 1000]", coords.z),
            ));
        }
        Ok(())
    }

    pub fn validate_polar_coordinates(coords: &PolarCoordinates) -> Result<(), OSCError> {
        if !(-360.0..=360.0).contains(&coords.azim) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Azimuth {} out of range [-360, 360]", coords.azim),
            ));
        }
        if !(-90.0..=90.0).contains(&coords.elev) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Elevation {} out of range [-90, 90]", coords.elev),
            ));
        }
        if !(-1000.0..=1000.0).contains(&coords.dist) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Radius {} out of range [-1000, 1000]", coords.dist),
            ));
        }
        Ok(())
    }

    pub fn validate_color(color: &Color) -> Result<(), OSCError> {
        if !(0.0..=1.0).contains(&color.r) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Red component {} out of range [0, 1]", color.r),
            ));
        }
        if !(0.0..=1.0).contains(&color.g) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Green component {} out of range [0, 1]", color.g),
            ));
        }
        if !(0.0..=1.0).contains(&color.b) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Blue component {} out of range [0, 1]", color.b),
            ));
        }
        if !(0.0..=1.0).contains(&color.a) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Alpha component {} out of range [0, 1]", color.a),
            ));
        }
        Ok(())
    }

    pub fn validate_azimuth(value: f64) -> Result<(), OSCError> {
        if (0.0..=360.0).contains(&value) {
            Ok(())
        } else {
            Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Azimuth value must be between 0 and 360, got {}", value)
            ))
        }
    }

    pub fn validate_elevation(value: f64) -> Result<(), OSCError> {
        if (-90.0..=90.0).contains(&value) {
            Ok(())
        } else {
            Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Elevation value must be between -90 and 90, got {}", value)
            ))
        }
    }

    pub fn validate_distance(value: f64) -> Result<(), OSCError> {
        // Distance is in meters and has no upper limit, but must be non-negative
        if value >= 0.0 {
            Ok(())
        } else {
            Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Distance value must be non-negative, got {}", value)
            ))
        }
    }

    pub fn validate_gain(value: f64) -> Result<(), OSCError> {
        if (-60.0..=12.0).contains(&value) {
            Ok(())
        } else {
            Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Gain value must be between -60 and +12 dB, got {}", value)
            ))
        }
    }

    pub fn validate_speed(value: f64) -> Result<(), OSCError> {
        if value > 0.0 {
            Ok(())
        } else {
            Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Speed value must be positive, got {}", value)
            ))
        }
    }

    pub fn validate_track_parameters(track_id: &str, params: &TrackParameters) -> Result<(), OSCError> {
        // Validate track ID
        Self::validate_track_id(track_id)?;

        // Validate cartesian coordinates
        if let Some(cart) = &params.cartesian {
            Self::validate_coordinates(cart)?;
        }

        // Validate polar coordinates
        if let Some(polar) = &params.polar {
            Self::validate_polar_coordinates(polar)?;
        }

        // Validate gain
        if let Some(gain) = params.gain {
            Self::validate_gain(gain)?;
        }

        // Validate color
        if let Some(color) = &params.color {
            Self::validate_color(color)?;
        }

        Ok(())
    }

    pub fn format_track_address(track_id: &str, parameter: &str) -> Result<String, OSCError> {
        Self::validate_track_id(track_id)?;

        match parameter {
            "xyz" | "aed" | 
            "x" | "y" | "z" | 
            "azim" | "elev" | "dist" |
            "xy" | "ae" |
            "x+" | "x-" | "y+" | "y-" | "z+" | "z-" |
            "azim+" | "azim-" | "elev+" | "elev-" | "dist+" | "dist-" |
            "gain/value" | "mute" | "color" => {
                Ok(format!("/track/{}/{}", track_id, parameter))
            },
            _ => Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Invalid parameter: {}", parameter)
            )),
        }
    }

    pub fn format_track_position_address(track_id: &str, coord_type: &str) -> Result<String, OSCError> {
        Self::validate_track_id(track_id)?;

        match coord_type {
            "cart" => Ok(format!("/track/{}/xyz", track_id)),
            "polar" => Ok(format!("/track/{}/aed", track_id)),
            _ => Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Invalid coordinate type: {}", coord_type)
            )),
        }
    }

    pub fn create_position_message(track_id: &str, coords: &CartesianCoordinates) -> Result<OscMessage, OSCError> {
        Self::validate_coordinates(coords)?;
        
        Ok(OscMessage {
            addr: Self::format_track_position_address(track_id, "cart")?,
            args: vec![
                OscType::Float(coords.x as f32),
                OscType::Float(coords.y as f32),
                OscType::Float(coords.z as f32),
            ],
        })
    }

    pub fn create_polar_message(track_id: &str, coords: &PolarCoordinates) -> Result<OscMessage, OSCError> {
        Self::validate_polar_coordinates(coords)?;
        
        Ok(OscMessage {
            addr: Self::format_track_position_address(track_id, "polar")?,
            args: Self::encode_position(coords),
        })
    }

    pub fn encode_position(coords: &PolarCoordinates) -> Vec<OscType> {
        vec![
            OscType::Float(coords.azim as f32),
            OscType::Float(coords.elev as f32),
            OscType::Float(coords.dist as f32),
        ]
    }

    pub fn create_gain_message(track_id: &str, gain: f64) -> Result<OscMessage, OSCError> {
        Self::validate_gain(gain)?;
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "gain/value")?,
            args: vec![OscType::Float(gain as f32)],
        })
    }

    pub fn create_mute_message(track_id: &str, mute: bool) -> Result<OscMessage, OSCError> {
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "mute")?,
            args: vec![OscType::Int(if mute { 1 } else { 0 })],
        })
    }

    pub fn create_color_message(track_id: &str, color: &Color) -> Result<OscMessage, OSCError> {
        Self::validate_color(color)?;

        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "color")?,
            args: vec![
                OscType::Float(color.r as f32),
                OscType::Float(color.g as f32),
                OscType::Float(color.b as f32),
                OscType::Float(color.a as f32),
            ],
        })
    }

    // Single coordinate messages
    pub fn create_x_message(track_id: &str, x: f64) -> Result<OscMessage, OSCError> {
        if !(-1000.0..=1000.0).contains(&x) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("X coordinate {} out of range [-1000, 1000]", x),
            ));
        }
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "x")?,
            args: vec![OscType::Float(x as f32)],
        })
    }

    pub fn create_y_message(track_id: &str, y: f64) -> Result<OscMessage, OSCError> {
        if !(-1000.0..=1000.0).contains(&y) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Y coordinate {} out of range [-1000, 1000]", y),
            ));
        }
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "y")?,
            args: vec![OscType::Float(y as f32)],
        })
    }

    pub fn create_z_message(track_id: &str, z: f64) -> Result<OscMessage, OSCError> {
        if !(-1000.0..=1000.0).contains(&z) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Z coordinate {} out of range [-1000, 1000]", z),
            ));
        }
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "z")?,
            args: vec![OscType::Float(z as f32)],
        })
    }

    pub fn create_azim_message(track_id: &str, azim: f64) -> Result<OscMessage, OSCError> {
        Self::validate_azimuth(azim)?;
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "azim")?,
            args: vec![OscType::Float(azim as f32)],
        })
    }

    pub fn create_elev_message(track_id: &str, elev: f64) -> Result<OscMessage, OSCError> {
        Self::validate_elevation(elev)?;
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "elev")?,
            args: vec![OscType::Float(elev as f32)],
        })
    }

    pub fn create_dist_message(track_id: &str, dist: f64) -> Result<OscMessage, OSCError> {
        Self::validate_distance(dist)?;
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "dist")?,
            args: vec![OscType::Float(dist as f32)],
        })
    }

    // Coordinate pairs
    pub fn create_xy_message(track_id: &str, x: f64, y: f64) -> Result<OscMessage, OSCError> {
        if !(-1000.0..=1000.0).contains(&x) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("X coordinate {} out of range [-1000, 1000]", x),
            ));
        }
        if !(-1000.0..=1000.0).contains(&y) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Y coordinate {} out of range [-1000, 1000]", y),
            ));
        }
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "xy")?,
            args: vec![
                OscType::Float(x as f32),
                OscType::Float(y as f32),
            ],
        })
    }

    pub fn create_ae_message(track_id: &str, azim: f64, elev: f64) -> Result<OscMessage, OSCError> {
        Self::validate_azimuth(azim)?;
        Self::validate_elevation(elev)?;
        
        Ok(OscMessage {
            addr: Self::format_track_address(track_id, "ae")?,
            args: vec![
                OscType::Float(azim as f32),
                OscType::Float(elev as f32),
            ],
        })
    }

    // Relative movement messages
    pub fn create_relative_movement_message(
        track_id: &str,
        parameter: &str,
        delta: f64
    ) -> Result<OscMessage, OSCError> {
        let (min_delta, max_delta) = match parameter {
            "x" | "y" | "z" => (-1.0, 1.0),
            "azim" => (-360.0, 360.0),
            "elev" => (-90.0, 90.0),
            "dist" => (-1.0, 1.0),
            _ => return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Invalid parameter for relative movement: {}", parameter)
            )),
        };

        if !(min_delta..=max_delta).contains(&delta) {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                format!("Delta value must be between {} and {}", min_delta, max_delta)
            ));
        }

        Ok(OscMessage {
            addr: Self::format_track_address(track_id, &format!("{}{}", parameter, if delta >= 0.0 { "+" } else { "-" }))?,
            args: vec![OscType::Float(delta.abs() as f32)],
        })
    }

    // Query messages
    pub fn create_query_message(parameter_path: &str) -> Result<OscMessage, OSCError> {
        Ok(OscMessage {
            addr: "/get".to_string(),
            args: vec![OscType::String(parameter_path.to_string())],
        })
    }

    // Animation control messages
    pub fn create_animation_message(animation_id: &str, command: &str) -> Result<OscMessage, OSCError> {
        Ok(OscMessage {
            addr: format!("/animation/{}/{}", animation_id, command),
            args: vec![],
        })
    }

    pub fn create_animation_state_message(animation_id: &str, command: &str, value: bool) -> Result<OscMessage, OSCError> {
        Ok(OscMessage {
            addr: format!("/animation/{}/{}", animation_id, command),
            args: vec![OscType::Bool(value)],
        })
    }

    pub fn create_animation_speed_message(animation_id: &str, speed: f64) -> Result<OscMessage, OSCError> {
        Self::validate_speed(speed)?;
        
        Ok(OscMessage {
            addr: format!("/animation/{}/speed", animation_id),
            args: vec![OscType::Float(speed as f32)],
        })
    }
}
