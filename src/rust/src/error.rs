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

impl From<AnimatorError> for napi::Error {
    fn from(error: AnimatorError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}

pub type AnimatorResult<T> = Result<T, AnimatorError>;
