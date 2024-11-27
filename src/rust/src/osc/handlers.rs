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

        let mut coords = track_state.parameters.cartesian.clone().unwrap_or_default();
        match self.parameter.as_str() {
            "x" => {
                Protocol::validate_coordinate(value)?;
                coords.x = value;
            },
            "y" => {
                Protocol::validate_coordinate(value)?;
                coords.y = value;
            },
            "z" => {
                Protocol::validate_coordinate(value)?;
                coords.z = value;
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Unknown cartesian parameter: {}", self.parameter)
            )),
        }
        track_state.parameters.cartesian = Some(coords);
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

        let mut coords = track_state.parameters.polar.clone().unwrap_or_default();
        match self.parameter.as_str() {
            "azim" => {
                Protocol::validate_azimuth(value)?;
                coords.azim = value;
            },
            "elev" => {
                Protocol::validate_elevation(value)?;
                coords.elev = value;
            },
            "dist" => {
                Protocol::validate_distance(value)?;
                coords.dist = value;
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Unknown polar parameter: {}", self.parameter)
            )),
        }
        track_state.parameters.polar = Some(coords);
        Ok(())
    }
}

pub struct GainHandler;

impl MessageHandler for GainHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid gain value argument".to_string()
            ));
        }

        let gain = match &args[0] {
            OscType::Float(f) => *f as f64,
            _ => return Err(OSCError::new(
                OSCErrorType::Validation,
                "Invalid gain value type".to_string()
            )),
        };

        Protocol::validate_gain(gain)?;
        track_state.parameters.gain = Some(gain);
        Ok(())
    }
}

pub struct MuteHandler;

impl MessageHandler for MuteHandler {
    fn handle(&self, track_state: &mut TrackState, args: &[OscType]) -> Result<(), OSCError> {
        if args.len() != 1 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid mute value argument".to_string()
            ));
        }

        let value = match &args[0] {
            OscType::Bool(b) => *b,
            _ => return Err(OSCError::new(
                OSCErrorType::Validation,
                "Invalid mute value type".to_string()
            )),
        };

        track_state.parameters.mute = Some(value);
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
        track_state.parameters.color = Some(color);
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
        match self.command.as_str() {
            "play" => {
                track_state.animation.playing = true;
                track_state.animation.paused = false;
            },
            "pause" => {
                track_state.animation.paused = true;
            },
            "stop" => {
                track_state.animation.playing = false;
                track_state.animation.paused = false;
            },
            "active" => {
                if args.len() != 1 {
                    return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "Invalid active value argument".to_string()
                    ));
                }
                match &args[0] {
                    OscType::Bool(value) => track_state.animation.active = *value,
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
                    OscType::Bool(value) => track_state.animation.loop_enabled = *value,
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
                track_state.animation.speed = speed;
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Unknown animation command: {}", self.command)
            )),
        }
        Ok(())
    }
}
