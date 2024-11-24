use std::net::UdpSocket;
use std::sync::Arc;
use tokio::sync::Mutex;
use rosc::{OscMessage, OscPacket, OscType};
use crate::osc::types::{OSCConfig, TrackState, OSCError, OSCErrorType};
use crate::osc::protocol::Protocol;
use crate::osc::handlers::*;

pub struct OSCServer {
    socket: Arc<Mutex<UdpSocket>>,
    config: OSCConfig,
    track_states: Arc<Mutex<HashMap<String, TrackState>>>,
}

impl OSCServer {
    pub fn new(config: OSCConfig) -> Result<Self, OSCError> {
        let socket = UdpSocket::bind(format!("{}:{}", config.server_address, config.server_port))
            .map_err(|e| OSCError::new(
                OSCErrorType::Connection,
                format!("Failed to bind to {}:{} - {}", config.server_address, config.server_port, e)
            ))?;

        Ok(Self {
            socket: Arc::new(Mutex::new(socket)),
            config,
            track_states: Arc::new(Mutex::new(HashMap::new())),
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
        let addr_parts: Vec<&str> = message.addr.split('/').collect();
        if addr_parts.len() < 3 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Invalid OSC address format: {}", message.addr)
            ));
        }

        let track_id = addr_parts[2].to_string();
        Protocol::validate_track_id(&track_id)?;

        let mut states = self.track_states.lock().await;
        let track_state = states.entry(track_id.clone()).or_insert_with(TrackState::default);

        self.handle_message(track_state, message).await?;

        Ok(())
    }

    async fn handle_message(&self, track_state: &mut TrackState, message: OscMessage) -> Result<(), OSCError> {
        let addr_parts: Vec<&str> = message.addr.split('/').filter(|s| !s.is_empty()).collect();
        if addr_parts.len() < 2 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid OSC address".to_string()
            ));
        }

        match addr_parts[0] {
            "track" => self.handle_track_message(track_state, &addr_parts[1..], &message)?,
            "animation" => self.handle_animation_message(track_state, &addr_parts[1..], &message)?,
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Unknown OSC address prefix: {}", addr_parts[0])
            )),
        }

        Ok(())
    }

    fn handle_track_message(&self, track_state: &mut TrackState, addr_parts: &[&str], message: &OscMessage) -> Result<(), OSCError> {
        if addr_parts.len() < 2 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid track message address".to_string()
            ));
        }

        let track_id = addr_parts[0];
        Protocol::validate_track_id(track_id)?;

        let handler: Box<dyn MessageHandler> = match addr_parts[1] {
            "x" | "y" | "z" => Box::new(CartesianHandler::new(addr_parts[1])),
            "azim" | "elev" | "dist" => Box::new(PolarHandler::new(addr_parts[1])),
            "gain" => Box::new(GainHandler),
            "mute" => Box::new(MuteHandler),
            "color" => Box::new(ColorHandler),
            _ => return Err(OSCError::new(
                OSCErrorType::Protocol,
                format!("Unknown track parameter: {}", addr_parts[1])
            )),
        };

        handler.handle(track_state, &message.args)
    }

    fn handle_animation_message(&self, track_state: &mut TrackState, addr_parts: &[&str], message: &OscMessage) -> Result<(), OSCError> {
        if addr_parts.len() < 2 {
            return Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid animation message address".to_string()
            ));
        }

        let handler = AnimationHandler::new(addr_parts[1]);
        handler.handle(track_state, &message.args)
    }

    fn get_float_arg(&self, arg: &OscType) -> Result<f32, OSCError> {
        match arg {
            OscType::Float(f) => Ok(*f),
            _ => Err(OSCError::new(
                OSCErrorType::Protocol,
                "Invalid float argument type".to_string()
            )),
        }
    }

    pub async fn get_track_state(&self, track_id: &str) -> Option<TrackState> {
        let states = self.track_states.lock().await;
        states.get(track_id).cloned()
    }

    pub async fn get_all_track_states(&self) -> HashMap<String, TrackState> {
        let states = self.track_states.lock().await;
        states.clone()
    }
}
