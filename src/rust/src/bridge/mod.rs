use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::osc::{OSCClient, OSCServer};
use crate::osc::types::{OSCConfig, TrackParameters};
use crate::state::StateManager;
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
        let runtime = self.runtime.as_ref().ok_or_else(|| Error::from_reason("Runtime not initialized"))?;
        let client = runtime.block_on(async {
            OSCClient::new(config).map_err(|e| Error::from_reason(e.message))
        })?;
        self.client = Some(Box::new(client));
        Ok(())
    }

    #[napi]
    pub fn init_server(&mut self, config: OSCConfig) -> Result<()> {
        let runtime = self.runtime.as_ref().ok_or_else(|| Error::from_reason("Runtime not initialized"))?;
        let state_manager = self.state_manager.as_ref().ok_or_else(|| Error::from_reason("State manager not initialized"))?.clone();
        let server = runtime.block_on(async {
            OSCServer::with_state_manager(config, state_manager)
                .map_err(|e| Error::from_reason(e.message))
        })?;
        self.server = Some(Box::new(server));
        Ok(())
    }

    #[napi]
    pub fn start_server(&self) -> Result<()> {
        let runtime = self.runtime.as_ref().ok_or_else(|| Error::from_reason("Runtime not initialized"))?;
        let server = self.server.as_ref().ok_or_else(|| Error::from_reason("Server not initialized"))?;
        runtime.block_on(async {
            server.start_listening().await
                .map_err(|e| Error::from_reason(e.message))
        })
    }

    #[napi]
    pub fn send_track_parameters(&self, track_id: String, params: TrackParameters) -> Result<()> {
        let runtime = self.runtime.as_ref().ok_or_else(|| Error::from_reason("Runtime not initialized"))?;
        let client = self.client.as_ref().ok_or_else(|| Error::from_reason("Client not initialized"))?;
        runtime.block_on(async {
            client.send_track_parameters(&track_id, &params).await
                .map_err(|e| Error::from_reason(e.message))
        })
    }
}
