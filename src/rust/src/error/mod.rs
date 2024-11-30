use napi::Error;
use napi::bindgen_prelude::*;
use std::fmt;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AnimatorError {
    #[error("Animation is already running")]
    AlreadyRunning,
    #[error("Animation is not running")]
    NotRunning,
    #[error("Animation is not paused")]
    NotPaused,
    #[error("Failed to acquire lock")]
    LockError,
    #[error("Animation already exists")]
    AnimationExists,
    #[error("Animation not found")]
    AnimationNotFound,
    #[error("Timeline not found")]
    TimelineNotFound,
    #[error("Timeline already exists")]
    TimelineExists,
    #[error("Invalid state: {0}")]
    InvalidState(String),
    #[error("Validation error: {0}")]
    ValidationError(&'static str),
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl std::error::Error for AnimatorError {}

impl fmt::Display for AnimatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AnimatorError::AlreadyRunning => write!(f, "Animation is already running"),
            AnimatorError::NotRunning => write!(f, "Animation is not running"),
            AnimatorError::NotPaused => write!(f, "Animation is not paused"),
            AnimatorError::LockError => write!(f, "Failed to acquire lock"),
            AnimatorError::AnimationExists => write!(f, "Animation already exists"),
            AnimatorError::AnimationNotFound => write!(f, "Animation not found"),
            AnimatorError::TimelineNotFound => write!(f, "Timeline not found"),
            AnimatorError::TimelineExists => write!(f, "Timeline already exists"),
            AnimatorError::InvalidState(msg) => write!(f, "Invalid state: {}", msg),
            AnimatorError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            AnimatorError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl AsRef<str> for AnimatorError {
    fn as_ref(&self) -> &str {
        match self {
            AnimatorError::AlreadyRunning => "Animation is already running",
            AnimatorError::NotRunning => "Animation is not running",
            AnimatorError::NotPaused => "Animation is not paused",
            AnimatorError::LockError => "Failed to acquire lock",
            AnimatorError::AnimationExists => "Animation already exists",
            AnimatorError::AnimationNotFound => "Animation not found",
            AnimatorError::TimelineNotFound => "Timeline not found",
            AnimatorError::TimelineExists => "Timeline already exists",
            AnimatorError::InvalidState(_) => "Invalid state",
            AnimatorError::ValidationError(_) => "Validation error",
            AnimatorError::InternalError(_) => "Internal error",
        }
    }
}

impl From<AnimatorError> for napi::Error {
    fn from(error: AnimatorError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}

impl From<napi::Error> for AnimatorError {
    fn from(err: napi::Error) -> Self {
        AnimatorError::ValidationError(err.to_string())
    }
}

impl From<std::io::Error> for AnimatorError {
    fn from(error: std::io::Error) -> Self {
        AnimatorError::ValidationError(error.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, AnimatorError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animator_error_display() {
        let error = AnimatorError::AlreadyRunning;
        assert_eq!(error.to_string(), "Animation is already running");

        let napi_error: napi::Error = error.into();
        assert_eq!(napi_error.to_string(), "Animation is already running");
    }
}
