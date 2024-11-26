use napi::bindgen_prelude::*;
use std::fmt;

mod animation;
mod osc;
mod state;

pub use animation::AnimationError;
pub use osc::OSCError;
pub use state::StateError;

#[derive(Debug)]
pub enum AnimatorError {
    Animation(AnimationError),
    OSC(OSCError),
    State(StateError),
    ValidationError(String),
    ConfigError(String),
    RuntimeError(String),
    NetworkError(String),
    ResourceError(String),
    PluginError(String),
    SyncError(String),
    UnknownError(String),
}

impl fmt::Display for AnimatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AnimatorError::Animation(err) => write!(f, "Animation error: {}", err),
            AnimatorError::OSC(err) => write!(f, "OSC error: {}", err),
            AnimatorError::State(err) => write!(f, "State error: {}", err),
            AnimatorError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AnimatorError::ConfigError(msg) => write!(f, "Configuration error: {}", msg),
            AnimatorError::RuntimeError(msg) => write!(f, "Runtime error: {}", msg),
            AnimatorError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            AnimatorError::ResourceError(msg) => write!(f, "Resource error: {}", msg),
            AnimatorError::PluginError(msg) => write!(f, "Plugin error: {}", msg),
            AnimatorError::SyncError(msg) => write!(f, "Sync error: {}", msg),
            AnimatorError::UnknownError(msg) => write!(f, "Unknown error: {}", msg),
        }
    }
}

impl std::error::Error for AnimatorError {}

impl AsRef<str> for AnimatorError {
    fn as_ref(&self) -> &str {
        match self {
            AnimatorError::ValidationError(s) => s.as_str(),
            AnimatorError::ConfigError(s) => s.as_str(),
            AnimatorError::RuntimeError(s) => s.as_str(),
            AnimatorError::NetworkError(s) => s.as_str(),
            AnimatorError::ResourceError(s) => s.as_str(),
            AnimatorError::PluginError(s) => s.as_str(),
            AnimatorError::SyncError(s) => s.as_str(),
            AnimatorError::UnknownError(s) => s.as_str(),
            _ => "",
        }
    }
}

impl From<AnimatorError> for napi::Error {
    fn from(err: AnimatorError) -> Self {
        napi::Error::from_status(Status::GenericFailure).context(err.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, AnimatorError>;
