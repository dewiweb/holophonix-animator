use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::osc::{client::OSCClient, server::OSCServer};
use crate::osc::types::{OSCConfig, TrackParameters};
use crate::state::core::StateManager;
use tokio::runtime::Runtime;

#[napi]
#[derive(Default)]
pub struct Bridge {
    client: Option<Box<OSCClient>>,
    server: Option<Box<OSCServer>>,
    runtime: Option<Runtime>,
    state_manager: Option<Arc<Mutex<StateManager>>>,
}

#[napi]
impl Bridge {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self::default())
    }

    #[napi]
    pub fn init(&mut self) -> Result<()> {
        let runtime = Runtime::new().map_err(|e| Error::from_reason(e.to_string()))?;
        let state_manager = Arc::new(Mutex::new(
            StateManager::new(std::env::current_dir()?.join("state"))
                .map_err(|e| Error::from_reason(e.to_string()))?
        ));
        
        self.runtime = Some(runtime);
        self.state_manager = Some(state_manager);
        Ok(())
    }

    #[napi]
    pub fn init_client(&mut self, config: OSCConfig) -> Result<()> {
        if self.client.is_some() {
            return Ok(());
        }

        self.client = Some(Box::new(
            OSCClient::new(config.host, config.port)
                .map_err(|e| Error::from_reason(e.message))?
        ));
        Ok(())
    }

    #[napi]
    pub fn init_server(&mut self, config: OSCConfig) -> Result<()> {
        if self.server.is_some() {
            return Ok(());
        }

        let state_manager = Arc::new(Mutex::new(
            StateManager::new(Some(std::env::current_dir()?.join("state").to_string_lossy().to_string()))?
        ));

        self.server = Some(Box::new(
            OSCServer::new(config.host, config.port, state_manager.clone())
                .map_err(|e| Error::from_reason(e.message))?
        ));
        Ok(())
    }

    #[napi]
    pub async fn start_server(&self) -> Result<()> {
        if let Some(server) = &self.server {
            server.listen().await.map_err(|e| Error::from_reason(e.message))?;
        }
        Ok(())
    }

    #[napi]
    pub async fn send_track_parameters(&self, track_id: &str, params: &TrackParameters) -> Result<()> {
        if let Some(client) = &self.client {
            client.send_parameters(track_id, params).await
                .map_err(|e| Error::from_reason(e.message))?;
        }
        Ok(())
    }
}
