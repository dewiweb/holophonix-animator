mod client;
mod server;
mod types;
mod error;

pub use client::OSCClient;
pub use server::{OSCServer, OSCServerTrait, OSCMessageHandler};
pub use types::{OSCMessage, OSCMessageArg};
pub use error::OSCError;

use crate::error::AnimatorResult;
use std::sync::{Arc, Mutex};

pub struct OSCManager {
    server: Arc<Mutex<Box<dyn OSCServerTrait>>>,
}

impl OSCManager {
    pub fn new(server: Box<dyn OSCServerTrait>) -> Self {
        Self {
            server: Arc::new(Mutex::new(server)),
        }
    }

    pub fn start(&self) -> AnimatorResult<()> {
        self.server.lock().unwrap().start()
    }

    pub fn stop(&self) -> AnimatorResult<()> {
        self.server.lock().unwrap().stop()
    }
}
