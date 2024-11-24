use napi::bindgen_prelude::*;
use napi_derive::napi;
use crate::osc::{OSCClient, OSCServer};
use crate::osc::types::{OSCConfig, TrackParameters};
use tokio::runtime::Runtime;

#[napi]
pub struct Bridge {
    client: Option<OSCClient>,
    server: Option<OSCServer>,
    runtime: Runtime,
}

#[napi]
impl Bridge {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self {
            client: None,
            server: None,
            runtime: Runtime::new().map_err(|e| Error::from_reason(e.to_string()))?,
        })
    }

    #[napi]
    pub fn init_client(&mut self, config: OSCConfig) -> Result<()> {
        let client = self.runtime.block_on(async {
            OSCClient::new(config).map_err(|e| Error::from_reason(e.message))
        })?;
        self.client = Some(client);
        Ok(())
    }

    #[napi]
    pub fn init_server(&mut self, config: OSCConfig) -> Result<()> {
        let server = self.runtime.block_on(async {
            OSCServer::new(config).map_err(|e| Error::from_reason(e.message))
        })?;
        self.server = Some(server);
        Ok(())
    }

    #[napi]
    pub fn start_server(&self) -> Result<()> {
        if let Some(server) = &self.server {
            self.runtime.block_on(async {
                server.start_listening().await.map_err(|e| Error::from_reason(e.message))
            })
        } else {
            Err(Error::from_reason("Server not initialized"))
        }
    }

    #[napi]
    pub fn send_track_parameters(&self, track_id: String, params: TrackParameters) -> Result<()> {
        if let Some(client) = &self.client {
            self.runtime.block_on(async {
                client.send_track_parameters(&track_id, &params)
                    .await
                    .map_err(|e| Error::from_reason(e.message))
            })
        } else {
            Err(Error::from_reason("Client not initialized"))
        }
    }
}
