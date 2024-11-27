use std::net::UdpSocket;
use std::sync::Arc;
use tokio::sync::Mutex;
use rosc::{OscMessage, OscPacket};
use crate::osc::types::{OSCConfig, TrackParameters, OSCError, OSCErrorType};
use crate::osc::protocol::Protocol;

pub struct OSCClient {
    socket: Arc<Mutex<UdpSocket>>,
    config: OSCConfig,
}

impl OSCClient {
    pub fn new(config: OSCConfig) -> Result<Self, OSCError> {
        let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| 
            OSCError::new(OSCErrorType::Connection, format!("Failed to bind socket: {}", e))
        )?;

        socket.connect(format!("{}:{}", config.client_address, config.client_port)).map_err(|e| 
            OSCError::new(OSCErrorType::Connection, format!("Failed to connect to {}:{} - {}", 
                config.client_address, config.client_port, e))
        )?;

        Ok(Self {
            socket: Arc::new(Mutex::new(socket)),
            config,
        })
    }

    pub async fn send_track_parameters(&self, track_id: &str, params: &TrackParameters) -> Result<(), OSCError> {
        Protocol::validate_track_parameters(track_id, params)?;
        let messages = self.create_track_messages(track_id, params)?;
        for msg in messages {
            self.send_message(&msg).await?;
        }
        Ok(())
    }

    async fn send_message(&self, message: &OscMessage) -> Result<(), OSCError> {
        let packet = OscPacket::Message(message.clone());
        let buf = rosc::encoder::encode(&packet).map_err(|e| 
            OSCError::new(OSCErrorType::Encoding, format!("Failed to encode OSC message: {}", e))
        )?;

        let socket = self.socket.lock().await;
        socket.send(&buf).map_err(|e| 
            OSCError::new(OSCErrorType::Network, format!("Failed to send OSC message: {}", e))
        )?;

        Ok(())
    }

    fn create_track_messages(&self, track_id: &str, params: &TrackParameters) -> Result<Vec<OscMessage>, OSCError> {
        let mut messages = Vec::new();

        // Position messages
        if let Some(cart) = &params.cartesian {
            messages.push(Protocol::create_position_message(track_id, cart)?);
        }

        if let Some(polar) = &params.polar {
            messages.push(Protocol::create_polar_message(track_id, polar)?);
        }

        // Gain message
        if let Some(gain) = params.gain {
            messages.push(Protocol::create_gain_message(track_id, gain)?);
        }

        // Mute message
        if let Some(mute) = params.mute {
            messages.push(Protocol::create_mute_message(track_id, mute)?);
        }

        // Color message
        if let Some(color) = &params.color {
            messages.push(Protocol::create_color_message(track_id, color)?);
        }

        Ok(messages)
    }
}
