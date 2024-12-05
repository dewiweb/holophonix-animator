pub mod client;
pub mod error;
pub mod server;
pub mod types;

pub use client::OSCClient;
pub use error::{OSCError, OSCErrorType};
pub use server::OSCServer;
pub use types::{
    OSCConfig, OSCMessage, OSCMessageArg, OSCMessageArgType,
    OSCMessageArgInt, OSCMessageArgFloat, OSCMessageArgString, OSCMessageArgBool,
};

use napi::bindgen_prelude::*;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex;

pub trait OSCServer: Send {
    fn send(&mut self, address: &str, args: Vec<f32>) -> Result<(), OSCErrorType>;
    fn start(&mut self) -> Result<(), OSCErrorType>;
    fn stop(&mut self) -> Result<(), OSCErrorType>;
}

#[napi]
pub struct OSC {
    server: Arc<Mutex<Box<dyn OSCServer>>>,
}

#[napi]
impl OSC {
    #[napi(constructor)]
    pub fn new(config: OSCConfig) -> Self {
        let server: Box<dyn OSCServer> = Box::new(UDPOSCServer::new(config));
        OSC {
            server: Arc::new(Mutex::new(server)),
        }
    }

    #[napi]
    pub async fn connect(&self) -> Result<(), napi::Error> {
        let mut server = self.server.lock().await;
        server.start().map_err(|e| e.into())
    }

    #[napi]
    pub async fn disconnect(&self) -> Result<(), napi::Error> {
        let mut server = self.server.lock().await;
        server.stop().map_err(|e| e.into())
    }

    #[napi]
    pub async fn send_message(&self, message: &OSCMessage) -> Result<(), napi::Error> {
        let mut server = self.server.lock().await;
        let args: Vec<f32> = message.args.iter().map(|arg| match arg {
            OSCMessageArg::Int(i) => *i as f32,
            OSCMessageArg::Float(f) => *f,
            _ => 0.0,
        }).collect();
        server.send(message.address, args).map_err(|e| e.into())
    }

    #[napi]
    pub async fn receive_message(&self) -> Result<OSCMessage, napi::Error> {
        // This method is not implemented in the provided code edit
        // You may need to implement it according to your requirements
        unimplemented!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::runtime::Runtime;

    #[test]
    fn test_osc_lifecycle() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let config = OSCConfig {
                host: "127.0.0.1".to_string(),
                port: 9000,
            };

            let osc = OSC::new(config);
            
            // Test connection
            assert!(osc.connect().await.is_ok());
            
            // Test message sending
            let mut msg = OSCMessage::new("/test").unwrap();
            msg.add_int(42);
            assert!(osc.send_message(&msg).await.is_ok());
            
            // Test disconnection
            assert!(osc.disconnect().await.is_ok());
        });
    }
}
