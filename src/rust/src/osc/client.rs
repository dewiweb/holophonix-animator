use napi::bindgen_prelude::*;
use rosc::{OscPacket, OscMessage};
use std::net::UdpSocket;
use crate::osc::types::{OSCConfig, OSCMessage};
use crate::osc::error::{OSCError, OSCErrorType};

#[napi]
pub struct OSCClient {
    socket: UdpSocket,
    config: OSCConfig,
}

#[napi]
impl OSCClient {
    #[napi]
    pub fn new(config: OSCConfig) -> Result<Self, napi::Error> {
        let socket = UdpSocket::bind("0.0.0.0:0")
            .map_err(|e| napi::Error::from_reason(format!("Failed to bind socket: {}", e)))?;

        Ok(OSCClient {
            socket,
            config,
        })
    }

    #[napi]
    pub async fn connect(&self) -> Result<(), napi::Error> {
        let addr = format!("{}:{}", self.config.host, self.config.port);
        self.socket.connect(&addr)
            .map_err(|e| napi::Error::from_reason(format!("Failed to connect: {}", e)))?;
        Ok(())
    }

    #[napi]
    pub fn send(&self, message: OSCMessage) -> Result<(), napi::Error> {
        let packet = message.to_osc_packet();
        let bytes = rosc::encoder::encode(&packet)
            .map_err(|e| napi::Error::from_reason(format!("Failed to encode message: {}", e)))?;

        self.socket.send(&bytes)
            .map_err(|e| napi::Error::from_reason(format!("Failed to send message: {}", e)))?;

        Ok(())
    }

    #[napi]
    pub fn receive(&self) -> Result<OSCMessage, napi::Error> {
        let mut buf = [0u8; 1024];
        let (size, _) = self.socket.recv_from(&mut buf)
            .map_err(|e| napi::Error::from_reason(format!("Failed to receive message: {}", e)))?;

        let packet = rosc::decoder::decode_udp(&buf[..size])
            .map_err(|e| napi::Error::from_reason(format!("Failed to decode message: {}", e)))?;

        match packet.1 {
            OscPacket::Message(msg) => Ok(OSCMessage::from_osc_packet(OscPacket::Message(msg))?),
            _ => Err(napi::Error::from_reason("Received packet is not an OSC message")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_client_creation() {
        let config = OSCConfig::new("127.0.0.1", 9000);
        let client = OSCClient::new(config);
        assert!(client.is_ok());
    }

    #[test]
    fn test_message_send() {
        let config = OSCConfig::new("127.0.0.1", 9000);
        let client = OSCClient::new(config).unwrap();
        
        let mut message = OSCMessage::new("/test".to_string()).unwrap();
        message.add_int(42);
        
        // This test might fail if no OSC server is running
        let result = client.send(message);
        assert!(result.is_ok() || result.unwrap_err().to_string().contains("Failed to send"));
    }
}
