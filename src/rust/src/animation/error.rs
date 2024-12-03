use napi::bindgen_prelude::Error;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AnimatorError {
    #[error("No animation is currently loaded")]
    NoAnimationLoaded,

    #[error("Invalid interpolation type: {0}")]
    InvalidInterpolation(String),

    #[error("Invalid animation configuration: {0}")]
    InvalidConfig(String),

    #[error("OSC error: {0}")]
    OscError(#[from] crate::osc::types::OSCError),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Animation error: {0}")]
    AnimationError(String),
}

impl From<AnimatorError> for Error {
    fn from(error: AnimatorError) -> Self {
        Error::from_reason(error.to_string())
    }
}
