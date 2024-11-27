use napi::bindgen_prelude::*;
use std::fmt;

#[derive(Debug)]
pub enum AnimatorError {
    ValidationError(String),
    StateError(String),
    PluginError(String),
    IOError(String),
}

impl fmt::Display for AnimatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AnimatorError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AnimatorError::StateError(msg) => write!(f, "State error: {}", msg),
            AnimatorError::PluginError(msg) => write!(f, "Plugin error: {}", msg),
            AnimatorError::IOError(msg) => write!(f, "IO error: {}", msg),
        }
    }
}

impl std::error::Error for AnimatorError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }
}

impl From<AnimatorError> for napi::Error {
    fn from(error: AnimatorError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}

impl From<napi::Error> for AnimatorError {
    fn from(error: napi::Error) -> Self {
        AnimatorError::ValidationError(error.to_string())
    }
}

impl From<std::io::Error> for AnimatorError {
    fn from(error: std::io::Error) -> Self {
        AnimatorError::IOError(error.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, AnimatorError>;

impl AnimatorError {
    pub fn validation_error(msg: impl Into<String>) -> Self {
        AnimatorError::ValidationError(msg.into())
    }

    pub fn state_error(msg: impl Into<String>) -> Self {
        AnimatorError::StateError(msg.into())
    }

    pub fn plugin_error(msg: impl Into<String>) -> Self {
        AnimatorError::PluginError(msg.into())
    }

    pub fn io_error(msg: impl Into<String>) -> Self {
        AnimatorError::IOError(msg.into())
    }
}
