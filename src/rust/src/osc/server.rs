use std::net::UdpSocket;
use std::sync::Arc;
use tokio::sync::Mutex;
use rosc::{OscMessage, OscPacket, OscType};
use crate::osc::types::{OSCConfig, OSCError, OSCErrorType, TrackState};
use crate::osc::protocol::Protocol;
use crate::state::StateManager;

pub struct OSCServer {
    socket: Arc<Mutex<UdpSocket>>,
    config: OSCConfig,
    state_manager: Arc<Mutex<StateManager>>,
}

impl OSCServer {
    pub fn new(config: OSCConfig) -> Result<Self, OSCError> {
        return Err(OSCError::new(
            OSCErrorType::Protocol,
            "OSCServer::new() is deprecated. Use OSCServer::with_state_manager() instead.".to_string()
        ));
    }

    pub fn with_state_manager(config: OSCConfig, state_manager: Arc<Mutex<StateManager>>) -> Result<Self, OSCError> {
        let socket = UdpSocket::bind(format!("{}:{}", config.server_address, config.server_port))
            .map_err(|e| OSCError::new(
                OSCErrorType::Connection,
                format!("Failed to bind to {}:{} - {}", config.server_address, config.server_port, e)
            ))?;

        Ok(Self {
            socket: Arc::new(Mutex::new(socket)),
            config,
            state_manager,
        })
    }

    pub async fn start_listening(&self) -> Result<(), OSCError> {
        let socket = self.socket.lock().await;
        let mut buf = [0u8; 1024];

        loop {
            let (size, _addr) = socket.recv_from(&mut buf).map_err(|e| 
                OSCError::new(OSCErrorType::Network, format!("Failed to receive OSC message: {}", e))
            )?;

            let packet = rosc::decoder::decode_udp(&buf[..size]).map_err(|e| 
                OSCError::new(OSCErrorType::Decoding, format!("Failed to decode OSC message: {}", e))
            )?;

            match packet {
                (_, OscPacket::Message(message)) => {
                    self.handle_message(message).await?;
                },
                _ => continue,
            }
        }
    }

    async fn handle_message(&self, message: OscMessage) -> Result<(), OSCError> {
        let track_id = self.extract_track_id(&message.addr)?;
        let mut state_manager = self.state_manager.lock().await;
        
        // Process the message based on its path
        let addr_parts: Vec<&str> = message.addr.split('/').filter(|s| !s.is_empty()).collect();
        match addr_parts.get(1) {
            Some(&"track") => self.handle_track_message(&mut state_manager, &track_id, &addr_parts[2..], &message).await?,
            Some(&"animation") => self.handle_animation_message(&mut state_manager, &track_id, &addr_parts[2..], &message).await?,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid OSC address: {}", message.addr)
            )),
        }
        
        Ok(())
    }

    async fn handle_track_message(
        &self,
        state_manager: &mut StateManager,
        track_id: &str,
        addr_parts: &[&str],
        message: &OscMessage
    ) -> Result<(), OSCError> {
        match addr_parts.first() {
            Some(&"position") => {
                let float_args = self.get_float_args(&message.args)?;
                if float_args.len() == 2 {
                    state_manager.update_track_position(track_id, (float_args[0], float_args[1]))?;
                    state_manager.notify_track_change(track_id.to_string());
                }
            },
            Some(&"gain") => {
                let float_args = self.get_float_args(&message.args)?;
                if float_args.len() == 1 {
                    let mut track_state = state_manager.track_state().lock().unwrap();
                    if let Some(track) = track_state.get_track_mut(track_id) {
                        track.gain = float_args[0];
                        state_manager.notify_track_change(track_id.to_string());
                    }
                }
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid track parameter".to_string()
            )),
        }
        Ok(())
    }

    async fn handle_animation_message(
        &self,
        state_manager: &mut StateManager,
        track_id: &str,
        addr_parts: &[&str],
        message: &OscMessage
    ) -> Result<(), OSCError> {
        match addr_parts.first() {
            Some(&"create") => {
                let string_args = self.get_string_args(&message.args)?;
                if string_args.len() == 2 {
                    let anim_id = &string_args[0];
                    let model_type = &string_args[1];
                    let mut animation_state = state_manager.animation_state().lock().unwrap();
                    // Create animation based on model_type and parameters
                    // This is simplified - you'll need to handle different animation models
                    state_manager.notify_animation_change(anim_id.to_string());
                }
            },
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid animation command".to_string()
            )),
        }
        Ok(())
    }

    fn get_float_args(&self, args: &[OscType]) -> Result<Vec<f32>, OSCError> {
        args.iter()
            .map(|arg| self.get_float_arg(arg))
            .collect()
    }

    fn get_string_args(&self, args: &[OscType]) -> Result<Vec<String>, OSCError> {
        args.iter()
            .map(|arg| match arg {
                OscType::String(s) => Ok(s.clone()),
                _ => Err(OSCError::new(
                    OSCErrorType::Protocol,
                    "Invalid string argument type".to_string()
                )),
            })
            .collect()
    }

    fn get_float_arg(&self, arg: &OscType) -> Result<f32, OSCError> {
        match arg {
            OscType::Float(f) => Ok(*f),
            OscType::Double(d) => Ok(*d as f32),
            OscType::Int(i) => Ok(*i as f32),
            _ => Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid float argument type".to_string()
            )),
        }
    }

    fn extract_track_id(&self, path: &str) -> Result<String, OSCError> {
        let addr_parts: Vec<&str> = path.split('/').collect();
        if addr_parts.len() < 3 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid OSC address format: {}", path)
            ));
        }

        let track_id = addr_parts[2].to_string();
        Protocol::validate_track_id(&track_id)?;

        Ok(track_id)
    }

    pub async fn get_track_state(&self, track_id: &str) -> Option<TrackState> {
        let state_manager = self.state_manager.lock().await;
        let track_state = state_manager.track_state().lock().unwrap();
        track_state.get_track(track_id).cloned()
    }
}
