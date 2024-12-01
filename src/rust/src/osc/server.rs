use crate::error::AnimatorError;
use crate::osc::types::{OSCMessage, OSCMessageArg};
use rosc::{decoder, OscPacket, OscType};
use std::net::UdpSocket;
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

pub trait OSCMessageHandler: Send + 'static {
    fn handle_message(&mut self, message: OSCMessage) -> Result<(), AnimatorError>;
}

pub trait OSCServerTrait: Send + 'static {
    fn start(&mut self) -> Result<(), AnimatorError>;
    fn stop(&mut self) -> Result<(), AnimatorError>;
}

pub struct OSCServer {
    socket: Option<Arc<UdpSocket>>,
    handler: Arc<Mutex<Box<dyn OSCMessageHandler>>>,
    thread_handle: Option<JoinHandle<()>>,
    running: Arc<Mutex<bool>>,
}

impl OSCServer {
    pub fn new(
        bind_addr: impl Into<String>,
        handler: Box<dyn OSCMessageHandler>,
    ) -> Result<Self, AnimatorError> {
        let socket = UdpSocket::bind(bind_addr.into())?;
        socket.set_nonblocking(true)?;

        Ok(Self {
            socket: Some(Arc::new(socket)),
            handler: Arc::new(Mutex::new(handler)),
            thread_handle: None,
            running: Arc::new(Mutex::new(false)),
        })
    }
}

impl OSCServerTrait for OSCServer {
    fn start(&mut self) -> Result<(), AnimatorError> {
        if self.thread_handle.is_some() {
            return Err(AnimatorError::State("Server already running".to_string()));
        }

        let socket = self
            .socket
            .as_ref()
            .ok_or_else(|| AnimatorError::State("Server socket not initialized".to_string()))?
            .clone();
        let handler = self.handler.clone();
        let running = self.running.clone();

        *running.lock().unwrap() = true;

        let handle = thread::spawn(move || {
            let mut buf = [0u8; 1024];
            while *running.lock().unwrap() {
                match socket.recv_from(&mut buf) {
                    Ok((size, _addr)) => {
                        if let Ok(packet) = decoder::decode_udp(&buf[..size]) {
                            if let Err(e) = Self::handle_packet(packet, &handler) {
                                eprintln!("Error handling OSC packet: {}", e);
                            }
                        }
                    }
                    Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                        // Non-blocking socket, just continue
                        thread::sleep(std::time::Duration::from_millis(1));
                    }
                    Err(e) => {
                        eprintln!("Error receiving OSC packet: {}", e);
                    }
                }
            }
        });

        self.thread_handle = Some(handle);
        Ok(())
    }

    fn stop(&mut self) -> Result<(), AnimatorError> {
        if let Some(_) = self.thread_handle.take() {
            *self.running.lock().unwrap() = false;
        }
        Ok(())
    }
}

impl OSCServer {
    fn handle_packet(
        packet: OscPacket,
        handler: &Arc<Mutex<Box<dyn OSCMessageHandler>>>,
    ) -> Result<(), AnimatorError> {
        match packet {
            OscPacket::Message(msg) => {
                let args = msg
                    .args
                    .into_iter()
                    .map(|arg| match arg {
                        OscType::Int(i) => OSCMessageArg::Int(i),
                        OscType::Float(f) => OSCMessageArg::Float(f),
                        OscType::String(s) => OSCMessageArg::String(s),
                        OscType::Bool(b) => OSCMessageArg::Bool(b),
                        _ => return Err(AnimatorError::OSC("Unsupported OSC type".to_string())),
                    })
                    .collect::<Result<Vec<_>, _>>()?;

                let message = OSCMessage {
                    address: msg.addr,
                    args,
                };

                handler.lock().unwrap().handle_message(message)?;
            }
            OscPacket::Bundle(_) => {
                return Err(AnimatorError::OSC("Bundle packets not supported".to_string()));
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::osc::client::OSCClient;
    use std::sync::mpsc;
    use std::time::Duration;

    struct TestHandler {
        sender: mpsc::Sender<OSCMessage>,
    }

    impl OSCMessageHandler for TestHandler {
        fn handle_message(&mut self, message: OSCMessage) -> Result<(), AnimatorError> {
            self.sender.send(message).map_err(|e| {
                AnimatorError::OSC(format!("Failed to send message to test channel: {}", e))
            })?;
            Ok(())
        }
    }

    #[test]
    fn test_server_lifecycle() {
        let (tx, _rx) = mpsc::channel();
        let handler = Box::new(TestHandler { sender: tx });
        let mut server = OSCServer::new("127.0.0.1:0", handler).unwrap();

        assert!(server.start().is_ok());
        assert!(server.start().is_err()); // Should fail when already running
        assert!(server.stop().is_ok());
    }

    #[test]
    fn test_message_handling() {
        let (tx, rx) = mpsc::channel();
        let handler = Box::new(TestHandler { sender: tx });
        let mut server = OSCServer::new("127.0.0.1:0", handler).unwrap();
        let server_addr = server
            .socket
            .as_ref()
            .unwrap()
            .local_addr()
            .unwrap()
            .to_string();

        server.start().unwrap();

        // Create a client to send test messages
        let client = OSCClient::new(server_addr).unwrap();
        let test_message = OSCMessage::new(
            "/test/message",
            vec![
                OSCMessageArg::Int(42),
                OSCMessageArg::Float(3.14),
                OSCMessageArg::String("test".to_string()),
                OSCMessageArg::Bool(true),
            ],
        )
        .unwrap();

        client.send(test_message.clone()).unwrap();

        // Wait for the message to be processed
        let received = rx.recv_timeout(Duration::from_secs(1)).unwrap();
        assert_eq!(received.address, test_message.address);
        assert_eq!(received.args.len(), test_message.args.len());

        server.stop().unwrap();
    }
}
