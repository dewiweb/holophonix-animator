use crate::error::Result;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use rosc::{OscMessage, OscPacket, OscType};
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use super::types::{OSCConfig, OSCError, OSCMessage, OSCMessageArg};
use crate::animation::error::AnimatorError;

#[napi]
pub struct OscManager {
    config: Arc<Mutex<OSCConfig>>,
    socket: Arc<Mutex<Option<UdpSocket>>>,
}

#[napi]
impl OscManager {
    #[napi(constructor)]
    pub fn new(config: OSCConfig) -> Self {
        Self {
            config: Arc::new(Mutex::new(config)),
            socket: Arc::new(Mutex::new(None)),
        }
    }

    #[napi]
    pub fn connect(&self) -> Result<(), AnimatorError> {
        let config = self.config.lock().unwrap();
        let socket = UdpSocket::bind("0.0.0.0:0").map_err(|e| {
            OSCError::ConnectionError(format!("Failed to bind socket: {}", e))
        })?;

        socket.set_read_timeout(Some(Duration::from_millis(config.timeout_ms as u64)))
            .map_err(|e| OSCError::ConnectionError(format!("Failed to set timeout: {}", e)))?;

        *self.socket.lock().unwrap() = Some(socket);
        Ok(())
    }

    #[napi]
    pub fn disconnect(&self) -> Result<(), AnimatorError> {
        *self.socket.lock().unwrap() = None;
        Ok(())
    }

    #[napi]
    pub fn send(&self, message: OSCMessage) -> Result<(), AnimatorError> {
        let socket = self.socket.lock().unwrap();
        let config = self.config.lock().unwrap();

        let socket = socket.as_ref().ok_or_else(|| {
            OSCError::ConnectionError("Not connected".to_string())
        })?;

        let osc_msg = OscPacket::Message(OscMessage {
            addr: message.address,
            args: message.args.into_iter().map(|arg| match arg {
                OSCMessageArg::Int(i) => OscType::Int(i),
                OSCMessageArg::Float(f) => OscType::Float(f),
                OSCMessageArg::String(s) => OscType::String(s),
                OSCMessageArg::Blob(b) => OscType::Blob(b),
            }).collect(),
        });

        let msg_buf = rosc::encoder::encode(&osc_msg)
            .map_err(|e| OSCError::SendError(format!("Failed to encode message: {}", e)))?;

        socket.send_to(&msg_buf, format!("{}:{}", config.host, config.port))
            .map_err(|e| OSCError::SendError(format!("Failed to send message: {}", e)))?;

        Ok(())
    }

    #[napi]
    pub fn is_connected(&self) -> bool {
        self.socket.lock().unwrap().is_some()
    }

    #[napi]
    pub fn update_config(&self, config: OSCConfig) -> Result<(), AnimatorError> {
        *self.config.lock().unwrap() = config;
        Ok(())
    }
}
