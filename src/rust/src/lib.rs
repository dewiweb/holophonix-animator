#![deny(clippy::all)]

use napi_derive::napi;
use napi::bindgen_prelude::*;

pub mod bridge;
pub mod osc;
pub mod state;

pub use bridge::Bridge;
pub use osc::*;
pub use state::StateManager;

#[napi]
#[derive(Default)]
pub struct AnimatorCore {
    bridge: Option<Box<Bridge>>,
}

#[napi]
impl AnimatorCore {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self::default())
    }

    #[napi]
    pub fn init(&mut self) -> Result<()> {
        let mut bridge = Bridge::new()?;
        bridge.init()?;
        self.bridge = Some(Box::new(bridge));
        Ok(())
    }

    #[napi]
    pub fn init_osc(&mut self, server_config: OSCConfig, client_config: OSCConfig) -> Result<()> {
        let bridge = self.bridge.as_mut().ok_or_else(|| Error::from_reason("Bridge not initialized"))?;
        bridge.init_client(client_config)?;
        bridge.init_server(server_config)?;
        bridge.start_server()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::osc::types::{OSCConfig, TrackParameters, CartesianCoordinates, Color};
    use crate::state::StateManager;
    use std::env;

    #[test]
    fn test_osc_config() {
        let config = OSCConfig {
            server_address: "127.0.0.1".to_string(),
            server_port: 57121,  // Common alternative OSC port
            client_address: "127.0.0.1".to_string(),
            client_port: 57120,  // Standard SuperCollider OSC port
        };

        assert_eq!(config.server_address, "127.0.0.1");
        assert_eq!(config.server_port, 57121);
        assert_eq!(config.client_address, "127.0.0.1");
        assert_eq!(config.client_port, 57120);
    }

    #[test]
    fn test_track_parameters() {
        let params = TrackParameters {
            cartesian: Some(CartesianCoordinates {
                x: 1.0,
                y: 2.0,
                z: 0.0,
            }),
            polar: None,
            gain: Some(-6.0),
            mute: Some(false),
            color: Some(Color {
                r: 1.0,
                g: 0.0,
                b: 0.0,
                a: 1.0,
            }),
        };

        if let Some(pos) = params.cartesian {
            assert_eq!(pos.x, 1.0);
            assert_eq!(pos.y, 2.0);
            assert_eq!(pos.z, 0.0);
        }

        assert_eq!(params.gain, Some(-6.0));
        assert_eq!(params.mute, Some(false));

        if let Some(color) = params.color {
            assert_eq!(color.r, 1.0);
            assert_eq!(color.g, 0.0);
            assert_eq!(color.b, 0.0);
            assert_eq!(color.a, 1.0);
        }
    }

    #[test]
    fn test_state_manager() -> Result<(), Box<dyn std::error::Error>> {
        let temp_dir = env::temp_dir().join("test_state");
        let state_manager = StateManager::new(temp_dir)?;
        Ok(())
    }

    #[test]
    fn test_animator_core() -> Result<()> {
        let mut core = AnimatorCore::new()?;
        core.init()?;

        let server_config = OSCConfig {
            server_address: "127.0.0.1".to_string(),
            server_port: 57120,
            client_address: "127.0.0.1".to_string(),
            client_port: 57121,
        };

        let client_config = OSCConfig {
            server_address: "127.0.0.1".to_string(),
            server_port: 57121,
            client_address: "127.0.0.1".to_string(),
            client_port: 57120,
        };

        core.init_osc(server_config, client_config)?;
        Ok(())
    }
}
