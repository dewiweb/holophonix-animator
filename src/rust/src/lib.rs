#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

pub mod animation;
pub mod error;
pub mod osc;
pub mod state;
pub mod plugin;
pub mod test_utils;
pub mod utils;

use napi::bindgen_prelude::*;

#[napi(object)]
#[derive(Clone, Default)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Position {
    pub fn lerp(&self, other: &Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }
}

#[napi]
pub fn initialize() -> bool {
    true
}

#[napi]
pub fn cleanup() -> bool {
    true
}

// Re-export main types for easier access
pub use animation::{
    Animation,
    AnimationEngine,
    AnimationState,
    Keyframe,
    Position,
    TimelineState,
};

pub use osc::{
    OSCConfig,
    OSCManager,
    OSCMessage,
    OSCMessageArg,
};

pub use error::Result;
pub use osc::manager::{OscConfig, OscManager};
pub use state::manager::{StateManager, TrackState};
