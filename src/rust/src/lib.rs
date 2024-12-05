#![deny(clippy::all)]

use napi_derive::napi;
use serde::{Serialize, Deserialize};

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

pub use animation::{
    models::{Animation, AnimationState, AnimationType, Keyframe, Position, TimelineState},
    engine::AnimationEngine,
};
pub use error::{AnimatorError, AnimatorResult};
pub use osc::{
    types::{OSCConfig, OSCMessage, OSCMessageArg},
    error::OSCError,
};

#[napi]
pub fn init() -> AnimatorResult<()> {
    Ok(())
}

#[napi]
pub fn cleanup() -> AnimatorResult<()> {
    Ok(())
}
