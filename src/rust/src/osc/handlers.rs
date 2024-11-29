use rosc::OscType;
use crate::osc::types::{TrackState, Color, OSCError, OSCErrorType};
use crate::osc::protocol::Protocol;

pub trait MessageHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError>;
}

pub struct CartesianHandler {
    parameter: String,
}

impl CartesianHandler {
    pub fn new(parameter: &str) -> Self {
        Self {
            parameter: parameter.to_string(),
        }
    }
}

impl MessageHandler for CartesianHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid {} coordinate argument", self.parameter)
            ));
        }

        let value = match &args[0] {
            OscType::Float(f) => *f as f64,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid {} coordinate type", self.parameter)
            )),
        };

        match self.parameter.as_str() {
            "x" => {
                Protocol::validate_coordinates(&CartesianCoordinates { x: value, y: 0.0, z: 0.0 })?;
                track_state.position.x = value;
            },
            "y" => {
                Protocol::validate_coordinates(&CartesianCoordinates { x: 0.0, y: value, z: 0.0 })?;
                track_state.position.y = value;
            },
            "z" => {
                Protocol::validate_coordinates(&CartesianCoordinates { x: 0.0, y: 0.0, z: value })?;
                track_state.position.z = value;
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid coordinate parameter: {}", self.parameter)
            )),
        }
        Ok(())
    }
}

pub struct PolarHandler {
    parameter: String,
}

impl PolarHandler {
    pub fn new(parameter: &str) -> Self {
        Self {
            parameter: parameter.to_string(),
        }
    }
}

impl MessageHandler for PolarHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid {} coordinate argument", self.parameter)
            ));
        }

        let value = match &args[0] {
            OscType::Float(f) => *f as f64,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid {} coordinate type", self.parameter)
            )),
        };

        // Convert polar coordinates to cartesian
        match self.parameter.as_str() {
            "azimuth" => {
                Protocol::validate_azimuth(value)?;
                // TODO: Implement polar to cartesian conversion
                // For now, just store in position
                track_state.position.x = value;
            },
            "elevation" => {
                Protocol::validate_elevation(value)?;
                track_state.position.y = value;
            },
            "distance" => {
                Protocol::validate_distance(value)?;
                track_state.position.z = value;
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid polar parameter: {}", self.parameter)
            )),
        }
        Ok(())
    }
}

pub struct GainHandler;

impl MessageHandler for GainHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid gain argument".to_string()
            ));
        }

        let gain = match &args[0] {
            OscType::Float(f) => *f as f64,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid gain type".to_string()
            )),
        };

        Protocol::validate_gain(gain)?;
        track_state.gain = Some(gain);
        Ok(())
    }
}

pub struct MuteHandler;

impl MessageHandler for MuteHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid mute argument".to_string()
            ));
        }

        let value = match &args[0] {
            OscType::Bool(b) => *b,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid mute type".to_string()
            )),
        };

        track_state.mute = Some(value);
        Ok(())
    }
}

pub struct ColorHandler;

impl MessageHandler for ColorHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 4 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid color arguments".to_string()
            ));
        }

        let color = Color {
            r: match &args[0] { OscType::Float(f) => *f as f64, _ => return Err(OSCError::new(OSCErrorType::Protocol, "Invalid color type".to_string())) },
            g: match &args[1] { OscType::Float(f) => *f as f64, _ => return Err(OSCError::new(OSCErrorType::Protocol, "Invalid color type".to_string())) },
            b: match &args[2] { OscType::Float(f) => *f as f64, _ => return Err(OSCError::new(OSCErrorType::Protocol, "Invalid color type".to_string())) },
            a: match &args[3] { OscType::Float(f) => *f as f64, _ => return Err(OSCError::new(OSCErrorType::Protocol, "Invalid color type".to_string())) },
        };

        Protocol::validate_color(&color)?;
        // Set the color if provided
        if let Some(color_value) = Some(color) {
            track_state.color = color_value;
        }
        Ok(())
    }
}

pub struct AnimationHandler {
    command: String,
}

impl AnimationHandler {
    pub fn new(command: &str) -> Self {
        Self {
            command: command.to_string(),
        }
    }
}

impl MessageHandler for AnimationHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        // Check if animation exists and is active
        if let Some(animation) = track_state.animation.as_mut() {
            match self.command.as_str() {
                "play" => {
                    animation.set_playing(true);
                    animation.set_paused(false);
                },
                "pause" => {
                    animation.set_paused(true);
                },
                "stop" => {
                    animation.set_playing(false);
                    animation.set_paused(false);
                },
                "active" => {
                    if args.len() != 1 {
                        return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid active value argument".to_string()
                        ));
                    }
                    match &args[0] {
                        OscType::Bool(value) => animation.set_active(*value),
                        _ => return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid active value type".to_string()
                        )),
                    }
                },
                "loop" => {
                    if args.len() != 1 {
                        return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid loop value argument".to_string()
                        ));
                    }
                    match &args[0] {
                        OscType::Bool(value) => animation.set_loop_enabled(*value),
                        _ => return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid loop value type".to_string()
                        )),
                    }
                },
                "speed" => {
                    if args.len() != 1 {
                        return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid speed value argument".to_string()
                        ));
                    }
                    let speed = match &args[0] {
                        OscType::Float(f) => *f as f64,
                        _ => return Err(OSCError::new(
                            OSCErrorType::Protocol,
                            "Invalid speed value type".to_string()
                        )),
                    };
                    Protocol::validate_speed(speed)?;
                    animation.set_speed(speed);
                },
                _ => return Err(OSCError::new(
                    OSCErrorType::Protocol,
                    format!("Unknown animation command: {}", self.command)
                )),
            }
        } else {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "No animation assigned to track".to_string()
            ));
        }
        Ok(())
    }
}
