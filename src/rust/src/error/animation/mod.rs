use std::fmt;

#[derive(Debug)]
pub enum AnimationError {
    InvalidConfiguration(String),
    InvalidState(String),
    ExecutionFailed(String),
}

impl fmt::Display for AnimationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AnimationError::InvalidConfiguration(msg) => write!(f, "Invalid configuration: {}", msg),
            AnimationError::InvalidState(msg) => write!(f, "Invalid state: {}", msg),
            AnimationError::ExecutionFailed(msg) => write!(f, "Execution failed: {}", msg),
        }
    }
}

impl std::error::Error for AnimationError {}
