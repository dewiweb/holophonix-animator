#![deny(clippy::all)]

use napi_derive::napi;

pub mod bridge;
pub mod osc;

pub use bridge::Bridge;
pub use osc::*;

#[napi]
pub struct AnimatorCore {
    // Core state will go here
}

#[napi]
impl AnimatorCore {
    #[napi(constructor)]
    pub fn new() -> Self {
        AnimatorCore {
            // Initialize core state
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::osc::types::{OSCConfig, TrackParameters, CartesianCoordinates, Color};

    #[test]
    fn test_osc_config() {
        let config = OSCConfig {
            client_address: "127.0.0.1".to_string(),
            client_port: 57120,  // Common SuperCollider OSC port
            server_address: "127.0.0.1".to_string(),
            server_port: 57121,  // Next available port
        };
        assert_eq!(config.client_port, 57120);
        assert_eq!(config.server_port, 57121);
    }

    #[test]
    fn test_track_parameters() {
        let params = TrackParameters {
            cartesian: Some(CartesianCoordinates {
                x: 0.5,
                y: -0.5,
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
        assert!(params.cartesian.is_some());
        assert!(params.polar.is_none());
        
        if let Some(cart) = params.cartesian {
            assert_eq!(cart.x, 0.5);
            assert_eq!(cart.y, -0.5);
            assert_eq!(cart.z, 0.0);
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
}
