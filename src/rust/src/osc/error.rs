use thiserror::Error;
use napi::bindgen_prelude::*;

#[derive(Error, Debug)]
pub enum OSCError {
    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Protocol error: {0}")]
    Protocol(String),

    #[error("State error: {0}")]
    State(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("System error: {0}")]
    System(String),
}

impl From<OSCError> for Error {
    fn from(error: OSCError) -> Self {
        Error::from_reason(error.to_string())
    }
}

impl From<std::io::Error> for OSCError {
    fn from(error: std::io::Error) -> Self {
        OSCError::System(error.to_string())
    }
}

impl From<rosc::OscError> for OSCError {
    fn from(error: rosc::OscError) -> Self {
        OSCError::Protocol(error.to_string())
    }
}
