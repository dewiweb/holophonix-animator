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

// Implement conversion from AnimatorError to NAPI Error
impl From<AnimatorError> for napi::Error {
    fn from(err: AnimatorError) -> Self {
        napi::Error::new(napi::Status::GenericFailure, err.to_string())
    }
}

// Implement conversion from NAPI Error to AnimatorError
impl From<napi::Error> for AnimatorError {
    fn from(err: napi::Error) -> Self {
        AnimatorError::UnknownError(err.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, AnimatorError>;

// Helper functions for common error cases
impl AnimatorError {
    pub fn validation_error<T: Into<String>>(msg: T) -> Self {
        AnimatorError::ValidationError(msg.into())
    }

    pub fn config_error<T: Into<String>>(msg: T) -> Self {
        AnimatorError::ConfigError(msg.into())
    }

    pub fn runtime_error<T: Into<String>>(msg: T) -> Self {
        AnimatorError::RuntimeError(msg.into())
    }

    pub fn plugin_error<T: Into<String>>(msg: T) -> Self {
        AnimatorError::PluginError(msg.into())
    }

    pub fn state_error<T: Into<String>>(msg: T) -> Self {
        AnimatorError::State(StateError::new(msg))
    }
}

// Implement AsRef<str> for AnimatorError
impl AsRef<str> for AnimatorError {
    fn as_ref(&self) -> &str {
        match self {
            AnimatorError::Animation(err) => err.as_ref(),
            AnimatorError::OSC(err) => err.as_ref(),
            AnimatorError::State(err) => err.as_ref(),
            AnimatorError::ValidationError(msg) => msg.as_str(),
            AnimatorError::ConfigError(msg) => msg.as_str(),
            AnimatorError::RuntimeError(msg) => msg.as_str(),
            AnimatorError::NetworkError(msg) => msg.as_str(),
            AnimatorError::ResourceError(msg) => msg.as_str(),
            AnimatorError::PluginError(msg) => msg.as_str(),
            AnimatorError::SyncError(msg) => msg.as_str(),
            AnimatorError::UnknownError(msg) => msg.as_str(),
        }
    }
}
