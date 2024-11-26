use std::net::UdpSocket;
use std::sync::Arc;
use tokio::sync::Mutex;
use rosc::{OscMessage, OscPacket, OscType};
use crate::osc::types::{OSCConfig, OSCError, OSCErrorType, TrackState, TrackParameters, AnimationState};
use crate::osc::protocol::Protocol;
use crate::state::core::StateManager;

pub struct OSCServer {
    socket: Arc<Mutex<UdpSocket>>,
    config: OSCConfig,
    state_manager: Option<Arc<Mutex<StateManager>>>,
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
            state_manager: Some(state_manager),
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
                    self.handle_message(message.addr, &message.args).await?;
                },
                _ => continue,
            }
        }
    }

    pub async fn handle_message(
        &mut self,
        addr: &str,
        args: &[OscType],
    ) -> Result<bool, OSCError> {
        let track_id = self.extract_track_id(addr)?;
        
        match addr {
            a if a.ends_with("/position") => {
                let float_args = self.parse_float_args(args, 3)?;
                self.handle_track_position(&track_id, &float_args).await?;
            }
            a if a.ends_with("/parameters") => {
                let params = self.parse_track_parameters(args)?;
                self.handle_track_parameters(&track_id, params).await?;
            }
            _ => return Ok(false),
        }
        
        Ok(true)
    }

    async fn handle_track_position(
        &mut self,
        track_id: &str,
        position: &[f64],
    ) -> Result<(), OSCError> {
        if position.len() != 3 {
            return Err(OSCError::new(
                OSCErrorType::InvalidArguments,
                "Position must have exactly 3 coordinates".to_string(),
            ));
        }

        let state_manager = match &mut self.state_manager {
            Some(manager) => manager,
            None => return Err(OSCError::new(
                OSCErrorType::RuntimeError,
                "State manager not initialized".to_string(),
            )),
        };

        let mut state = state_manager.lock().await.map_err(|e| 
            OSCError::state_error(format!("Failed to acquire state lock: {}", e))
        )?;

        state.update_track_position(
            track_id.to_string(),
            (position[0], position[1], position[2]),
        ).await.map_err(|e| OSCError::state_error(e.to_string()))?;

        Ok(())
    }

    async fn handle_track_parameters(
        &mut self,
        track_id: &str,
        params: TrackParameters,
    ) -> Result<(), OSCError> {
        let state_manager = match &mut self.state_manager {
            Some(manager) => manager,
            None => return Err(OSCError::new(
                OSCErrorType::RuntimeError,
                "State manager not initialized".to_string(),
            )),
        };

        let mut state = state_manager.lock().await.map_err(|e| 
            OSCError::state_error(format!("Failed to acquire state lock: {}", e))
        )?;

        state.update_track_parameters(track_id.to_string(), params)
            .await
            .map_err(|e| OSCError::state_error(e.to_string()))?;

        Ok(())
    }

    fn parse_float_args(&self, args: &[OscType], count: usize) -> Result<Vec<f64>, OSCError> {
        if args.len() != count {
            return Err(OSCError::new(
                OSCErrorType::InvalidArguments,
                format!("Expected {} arguments, got {}", count, args.len())
            ));
        }

        args.iter()
            .map(|arg| self.parse_float_arg(arg))
            .collect()
    }

    fn parse_float_arg(&self, arg: &OscType) -> Result<f64, OSCError> {
        match arg {
            OscType::Float(f) => Ok(*f as f64),
            OscType::Double(d) => Ok(*d),
            OscType::Int(i) => Ok(*i as f64),
            _ => Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid float argument type".to_string()
            )),
        }
    }

    fn parse_track_parameters(&self, args: &[OscType]) -> Result<TrackParameters, OSCError> {
        // Implement logic to get track parameters from OSC message
        unimplemented!()
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
        if let Some(state_manager) = &self.state_manager {
            let state_manager = state_manager.lock().await;
            let track_state = state_manager.track_state().lock().unwrap();
            track_state.get_track(track_id).cloned()
        } else {
            None
        }
    }
}
