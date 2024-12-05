use crate::osc::error::{OSCError, OSCErrorType};
use crate::osc::types::{OSCConfig, OSCMessage};
use rosc::{OscMessage, OscPacket, OscType};
use std::net::{SocketAddr, UdpSocket};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

pub struct OSCServer {
    socket: Arc<Mutex<Option<UdpSocket>>>,
    config: OSCConfig,
    tx: mpsc::Sender<OSCMessage>,
    rx: mpsc::Receiver<OSCMessage>,
}

impl OSCServer {
    pub fn new(config: OSCConfig) -> Self {
        let (tx, rx) = mpsc::channel(100);
        OSCServer {
            socket: Arc::new(Mutex::new(None)),
            config,
            tx,
            rx,
        }
    }

    pub async fn connect(&mut self) -> Result<(), OSCError> {
        let addr = format!("{}:{}", self.config.host, self.config.port);
        let socket = UdpSocket::bind(&addr).map_err(|e| {
            OSCError::new(
                OSCErrorType::ConnectionError,
                format!("Failed to bind to {}: {}", addr, e),
            )
        })?;

        socket.set_nonblocking(true).map_err(|e| {
            OSCError::new(
                OSCErrorType::ConnectionError,
                format!("Failed to set non-blocking mode: {}", e),
            )
        })?;

        *self.socket.lock().unwrap() = Some(socket);
        Ok(())
    }

    pub fn disconnect(&mut self) {
        *self.socket.lock().unwrap() = None;
    }

    pub async fn send_message(&self, message: OSCMessage) -> Result<(), OSCError> {
        let socket = self.socket.lock().unwrap();
        let socket = socket.as_ref().ok_or_else(|| {
            OSCError::new(
                OSCErrorType::NotConnected,
                "Cannot send message: OSC server not connected".to_string(),
            )
        })?;

        let osc_msg = OscPacket::Message(OscMessage {
            addr: message.address.clone(),
            args: message.args.into_iter().map(|arg| arg.into()).collect(),
        });

        let msg_buf = rosc::encoder::encode(&osc_msg).map_err(|e| {
            OSCError::new(
                OSCErrorType::SerializationError,
                format!("Failed to encode OSC message: {}", e),
            )
        })?;

        let dest = format!("{}:{}", self.config.host, self.config.port)
            .parse::<SocketAddr>()
            .map_err(|e| {
                OSCError::new(
                    OSCErrorType::InvalidAddress,
                    format!("Invalid destination address: {}", e),
                )
            })?;

        socket.send_to(&msg_buf, dest).map_err(|e| {
            OSCError::new(
                OSCErrorType::SendError,
                format!("Failed to send OSC message: {}", e),
            )
        })?;

        Ok(())
    }

    pub async fn receive_message(&mut self) -> Result<OSCMessage, OSCError> {
        let socket = self.socket.lock().unwrap();
        let socket = socket.as_ref().ok_or_else(|| {
            OSCError::new(
                OSCErrorType::NotConnected,
                "Cannot receive message: OSC server not connected".to_string(),
            )
        })?;

        let mut buf = [0u8; 1024];
        let (size, _) = socket.recv_from(&mut buf).map_err(|e| {
            OSCError::new(
                OSCErrorType::ReceiveError,
                format!("Failed to receive OSC message: {}", e),
            )
        })?;

        let packet = rosc::decoder::decode(&buf[..size]).map_err(|e| {
            OSCError::new(
                OSCErrorType::DecodingError,
                format!("Failed to decode OSC message: {}", e),
            )
        })?;

        match packet {
            OscPacket::Message(msg) => Ok(msg.into()),
            _ => Err(OSCError::new(
                OSCErrorType::DecodingError,
                "Received packet is not an OSC message".to_string(),
            )),
        }
    }

    pub fn get_sender(&self) -> mpsc::Sender<OSCMessage> {
        self.tx.clone()
    }

    pub fn get_receiver(&mut self) -> &mut mpsc::Receiver<OSCMessage> {
        &mut self.rx
    }
}

use std::net::UdpSocket;
use rosc::{OscMessage, OscPacket};
use crate::osc::{
    error::OSCErrorType,
    types::OSCConfig,
};

pub trait OSCServerTrait {
    fn send(&mut self, address: &str, args: Vec<f32>) -> Result<(), OSCErrorType>;
    fn start(&mut self) -> Result<(), OSCErrorType>;
    fn stop(&mut self) -> Result<(), OSCErrorType>;
}

pub struct UDPOSCServer {
    socket: Option<UdpSocket>,
    config: OSCConfig,
}

impl UDPOSCServer {
    pub fn new(config: OSCConfig) -> Self {
        Self {
            socket: None,
            config,
        }
    }

    fn ensure_socket(&mut self) -> Result<(), OSCErrorType> {
        if self.socket.is_none() {
            let addr = format!("0.0.0.0:{}", self.config.port);
            let socket = UdpSocket::bind(&addr)
                .map_err(|_| OSCErrorType::ConnectionFailed)?;
            self.socket = Some(socket);
        }
        Ok(())
    }
}

impl OSCServerTrait for UDPOSCServer {
    fn send(&mut self, address: &str, args: Vec<f32>) -> Result<(), OSCErrorType> {
        self.ensure_socket()?;
        
        let msg = OscMessage {
            addr: address.to_string(),
            args: args.into_iter().map(|f| f.into()).collect(),
        };
        
        let packet = OscPacket::Message(msg);
        let buf = rosc::encoder::encode(&packet)
            .map_err(|_| OSCErrorType::SerializationError)?;
            
        if let Some(socket) = &self.socket {
            let target = format!("{}:{}", self.config.host, self.config.port);
            socket.send_to(&buf, target)
                .map_err(|_| OSCErrorType::ConnectionFailed)?;
        }
        
        Ok(())
    }

    fn start(&mut self) -> Result<(), OSCErrorType> {
        self.ensure_socket()
    }

    fn stop(&mut self) -> Result<(), OSCErrorType> {
        self.socket = None;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::osc::types::OSCMessageArg;

    #[tokio::test]
    async fn test_server_connection() {
        let config = OSCConfig {
            host: "127.0.0.1".to_string(),
            port: 9000,
        };
        let mut server = OSCServer::new(config);
        assert!(server.connect().await.is_ok());
        server.disconnect();
    }

    #[tokio::test]
    async fn test_message_send_receive() {
        let config = OSCConfig {
            host: "127.0.0.1".to_string(),
            port: 9001,
        };
        let mut server = OSCServer::new(config);
        server.connect().await.unwrap();

        let message = OSCMessage {
            address: "/test".to_string(),
            args: vec![OSCMessageArg::Float(42.0)],
        };

        assert!(server.send_message(message).await.is_ok());
        server.disconnect();
    }
}
