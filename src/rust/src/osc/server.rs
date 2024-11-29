use std::net::UdpSocket;
use std::sync::Arc;
use tokio::sync::Mutex;
use rosc::{OscMessage, OscPacket, OscType};
use crate::error::AnimatorResult;
use crate::state::core::StateManager;
use crate::osc::types::{OSCError, OSCErrorType, PolarCoordinates, CartesianCoordinates, Position};
use crate::osc::protocol::Protocol;
use std::f64::consts::PI;

pub struct OSCServer {
    socket: UdpSocket,
    state: Arc<Mutex<StateManager>>,
}

impl OSCServer {
    pub fn new(host: String, port: u16, state: Arc<Mutex<StateManager>>) -> AnimatorResult<Self> {
        let addr = format!("{}:{}", host, port);
        let socket = UdpSocket::bind(&addr)?;
        Ok(Self { socket, state })
    }

    pub async fn start(&self) -> AnimatorResult<()> {
        let mut buf = [0u8; 1024];
        loop {
            match self.socket.recv_from(&mut buf) {
                Ok((size, _)) => {
                    let packet = rosc::decoder::decode(&buf[..size])?;
                    if let OscPacket::Message(msg) = packet {
                        self.handle_message(msg).await?;
                    }
                }
                Err(e) => {
                    eprintln!("Error receiving OSC message: {}", e);
                }
            }
        }
    }

    async fn handle_message(&self, message: OscMessage) -> AnimatorResult<()> {
        let addr_parts: Vec<&str> = message.addr.split('/').collect();
        if addr_parts.len() < 4 || addr_parts[1] != "track" {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid OSC address - must start with /track/".to_string()
            ));
        }

        let track_id = addr_parts[2].to_string();
        let command = addr_parts[3];

        match command {
            "xyz" => {
                self.handle_xyz_message(&track_id, &message.args).await?;
            }
            "aed" => {
                self.handle_aed_message(&track_id, &message.args).await?;
            }
            "gain" => {
                if message.args.len() != 1 {
                    return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "gain command requires 1 float argument".to_string()
                    ));
                }
                let gain = match &message.args[0] {
                    OscType::Float(v) => *v as f64,
                    _ => return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "gain value must be a float".to_string()
                    )),
                };
                let mut state = self.state.lock().await;
                state.update_gain(track_id, gain)?;
            }
            "mute" => {
                if message.args.len() != 1 {
                    return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "mute command requires 1 boolean argument".to_string()
                    ));
                }
                let mute = match &message.args[0] {
                    OscType::Bool(b) => *b,
                    _ => return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "mute value must be a boolean".to_string()
                    )),
                };
                let mut state = self.state.lock().await;
                state.update_mute(track_id, mute)?;
            }
            "color" => {
                if message.args.len() != 4 {
                    return Err(OSCError::new(
                        OSCErrorType::Protocol,
                        "color command requires 4 float arguments (RGBA)".to_string()
                    ));
                }
                let r = message.args[0].float().unwrap_or(0.0) as f64;
                let g = message.args[1].float().unwrap_or(0.0) as f64;
                let b = message.args[2].float().unwrap_or(0.0) as f64;
                let a = message.args[3].float().unwrap_or(1.0) as f64;
                let mut state = self.state.lock().await;
                state.update_color(track_id, r, g, b, a)?;
            }
            _ => {
                return Err(OSCError::new(
                    OSCErrorType::Protocol,
                    format!("Unknown command: {}", command)
                ));
            }
        }
        Ok(())
    }

    async fn handle_xyz_message(&self, track_id: &str, args: &[OscType]) -> AnimatorResult<()> {
        match args {
            [OscType::Float(x), OscType::Float(y), OscType::Float(z)] => {
                let cartesian = CartesianCoordinates::new(*x as f64, *y as f64, *z as f64);
                
                // Validate cartesian coordinates
                Protocol::validate_coordinates(&cartesian)?;
                
                let mut state = self.state.lock().await;
                state.update_position(track_id.to_string(), cartesian.x, cartesian.y, cartesian.z)?;
                Ok(())
            }
            _ => Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid xyz arguments - expected 3 float values".to_string(),
            )),
        }
    }

    async fn handle_aed_message(&self, track_id: &str, args: &[OscType]) -> AnimatorResult<()> {
        match args {
            [OscType::Float(a), OscType::Float(e), OscType::Float(r)] => {
                let polar = PolarCoordinates::new(*a as f64, *e as f64, *r as f64);
                
                // Validate polar coordinates
                Protocol::validate_polar_coordinates(&polar)?;
                
                // Convert to Position using the built-in method
                let position = Position::from_aed(polar.azim, polar.elev, polar.dist);
                
                let mut state = self.state.lock().await;
                state.update_position(track_id.to_string(), position.x, position.y, position.z)?;
                Ok(())
            }
            _ => Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid aed arguments - expected 3 float values".to_string(),
            )),
        }
    }
}

// Coordinate conversion function
fn aed_to_xyz(azim: f64, elev: f64, dist: f64) -> (f64, f64, f64) {
    let azim_rad = azim * PI / 180.0;
    let elev_rad = elev * PI / 180.0;
    
    // Convert from spherical (azimuth, elevation, distance) to cartesian (x, y, z)
    let x = dist * azim_rad.cos() * elev_rad.cos();
    let y = dist * azim_rad.sin() * elev_rad.cos();
    let z = dist * elev_rad.sin();
    
    (x, y, z)
}
