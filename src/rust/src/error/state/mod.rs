use std::fmt;

#[derive(Debug)]
pub enum StateError {
    InvalidTransition(String),
    InvalidValue(String),
    StorageError(String),
}

impl fmt::Display for StateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StateError::InvalidTransition(msg) => write!(f, "Invalid state transition: {}", msg),
            StateError::InvalidValue(msg) => write!(f, "Invalid value: {}", msg),
            StateError::StorageError(msg) => write!(f, "Storage error: {}", msg),
        }
    }
}

impl std::error::Error for StateError {}
