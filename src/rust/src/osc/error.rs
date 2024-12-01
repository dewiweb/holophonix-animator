use thiserror::Error;
use std::fmt;

#[derive(Debug, Error)]
pub enum OSCError {
    #[error("Protocol error: {0}")]
    Protocol(String),

    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Timeout error: {0}")]
    Timeout(String),

    #[error("IO error: {0}")]
    IOError(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl fmt::Display for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", std::error::Error::to_string(self))
    }
}

impl From<String> for OSCError {
    fn from(s: String) -> Self {
        OSCError::Internal(s)
    }
}

impl From<&str> for OSCError {
    fn from(s: &str) -> Self {
        OSCError::Internal(s.to_string())
    }
}

impl From<rosc::OscError> for OSCError {
    fn from(err: rosc::OscError) -> Self {
        OSCError::Protocol(err.to_string())
    }
}
