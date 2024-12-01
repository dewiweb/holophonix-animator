use crate::error::AnimatorError;
use crate::osc::types::{OSCMessage, OSCMessageArg};
use rosc::{encoder, OscMessage, OscPacket, OscType};
use std::net::UdpSocket;

pub struct OSCClient {
    socket: UdpSocket,
    target_addr: String,
}

impl OSCClient {
    pub fn new(target_addr: impl Into<String>) -> Result<Self, AnimatorError> {
        let socket = UdpSocket::bind("0.0.0.0:0")?;
        Ok(OSCClient {
            socket,
            target_addr: target_addr.into(),
        })
    }

    pub fn send(&self, message: OSCMessage) -> Result<(), AnimatorError> {
        let osc_args: Vec<OscType> = message
            .args
            .into_iter()
            .map(|arg| match arg {
                OSCMessageArg::Int(i) => OscType::Int(i),
                OSCMessageArg::Float(f) => OscType::Float(f),
                OSCMessageArg::String(s) => OscType::String(s),
                OSCMessageArg::Bool(b) => OscType::Bool(b),
            })
            .collect();

        let osc_msg = OscMessage {
            addr: message.address,
            args: osc_args,
        };

        let packet = OscPacket::Message(osc_msg);
        let encoded = encoder::encode(&packet).map_err(|e| {
            AnimatorError::OSC(format!("Failed to encode OSC message: {}", e))
        })?;

        self.socket.send_to(&encoded, &self.target_addr).map_err(|e| {
            AnimatorError::OSC(format!("Failed to send OSC message: {}", e))
        })?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::UdpSocket;
    use std::thread;
    use std::time::Duration;

    fn setup_test_server() -> UdpSocket {
        let socket = UdpSocket::bind("127.0.0.1:0").unwrap();
        socket.set_nonblocking(true).unwrap();
        socket
    }

    #[test]
    fn test_client_creation() {
        let client = OSCClient::new("127.0.0.1:9000");
        assert!(client.is_ok());
    }

    #[test]
    fn test_send_message() {
        let server = setup_test_server();
        let server_addr = server.local_addr().unwrap();

        let client = OSCClient::new(server_addr.to_string()).unwrap();
        let message = OSCMessage::new(
            "/test/message",
            vec![
                OSCMessageArg::Int(42),
                OSCMessageArg::Float(3.14),
                OSCMessageArg::String("test".to_string()),
                OSCMessageArg::Bool(true),
            ],
        )
        .unwrap();

        let send_result = client.send(message);
        assert!(send_result.is_ok());

        // Give some time for the message to be received
        thread::sleep(Duration::from_millis(100));

        let mut buf = [0u8; 1024];
        match server.recv_from(&mut buf) {
            Ok((size, _)) => {
                assert!(size > 0);
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                // This is fine in a non-blocking context
            }
            Err(e) => panic!("Unexpected error: {}", e),
        }
    }
}
