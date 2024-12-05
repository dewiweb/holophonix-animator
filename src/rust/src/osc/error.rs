use napi::bindgen_prelude::*;
use std::error::Error;
use std::fmt;

#[napi]
#[derive(Debug)]
pub enum OSCErrorType {
    ConnectionFailed,
    InvalidAddress,
    SerializationError,
    DecodingError,
    InvalidPort,
    InvalidMessage,
    InvalidArgument,
    ServerError,
    EncodingFailed,
    SendFailed,
    ConnectionError,
    SendError,
    ReceiveError,
    NotConnected,
}

impl fmt::Display for OSCErrorType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OSCErrorType::ConnectionFailed => write!(f, "Failed to establish connection"),
            OSCErrorType::InvalidAddress => write!(f, "Invalid OSC address"),
            OSCErrorType::SerializationError => write!(f, "Failed to serialize OSC message"),
            OSCErrorType::DecodingError => write!(f, "Failed to decode OSC message"),
            OSCErrorType::InvalidPort => write!(f, "Invalid port number"),
            OSCErrorType::InvalidMessage => write!(f, "Invalid OSC message format"),
            OSCErrorType::InvalidArgument => write!(f, "Invalid argument type"),
            OSCErrorType::ServerError => write!(f, "Server error"),
            OSCErrorType::EncodingFailed => write!(f, "Failed to encode OSC message"),
            OSCErrorType::SendFailed => write!(f, "Failed to send OSC message"),
            OSCErrorType::ConnectionError => write!(f, "Failed to connect to OSC server"),
            OSCErrorType::SendError => write!(f, "Failed to send OSC message"),
            OSCErrorType::ReceiveError => write!(f, "Failed to receive OSC message"),
            OSCErrorType::NotConnected => write!(f, "OSC server not connected"),
        }
    }
}

#[napi]
pub struct OSCError {
    error_type: OSCErrorType,
    message: String,
}

impl OSCError {
    pub fn new(error_type: OSCErrorType, message: String) -> Self {
        Self {
            error_type,
            message,
        }
    }

    pub fn error_type(&self) -> OSCErrorType {
        self.error_type
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl std::error::Error for OSCError {}

impl fmt::Display for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.error_type, self.message)
    }
}

impl fmt::Debug for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "OSCError {{ type: {:?}, message: {} }}", self.error_type, self.message)
    }
}

impl From<OSCError> for napi::Error {
    fn from(error: OSCError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}

impl From<std::io::Error> for OSCError {
    fn from(error: std::io::Error) -> Self {
        OSCError::new(OSCErrorType::ServerError, error.to_string())
    }
}

impl From<&str> for OSCError {
    fn from(error: &str) -> Self {
        OSCError::new(OSCErrorType::SerializationError, error.to_string())
    }
}

impl From<String> for OSCError {
    fn from(error: String) -> Self {
        OSCError::new(OSCErrorType::SerializationError, error)
    }
}

impl From<rosc::OscError> for OSCError {
    fn from(error: rosc::OscError) -> Self {
        match error {
            rosc::OscError::BadAddress(_) => OSCError::new(OSCErrorType::InvalidAddress, error.to_string()),
            rosc::OscError::BadString(_) => OSCError::new(OSCErrorType::InvalidMessage, error.to_string()),
            rosc::OscError::BadBundle(_) => OSCError::new(OSCErrorType::InvalidMessage, error.to_string()),
            rosc::OscError::BadMessage(_) => OSCError::new(OSCErrorType::InvalidMessage, error.to_string()),
            _ => OSCError::new(OSCErrorType::ServerError, error.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let error = OSCError::new(
            OSCErrorType::InvalidAddress,
            "Invalid OSC address format".to_string(),
        );
        assert!(error.to_string().contains("Invalid OSC address"));
        assert!(error.to_string().contains("Invalid OSC address format"));
    }

    #[test]
    fn test_error_conversion() {
        let io_error = std::io::Error::new(std::io::ErrorKind::Other, "IO error");
        let osc_error: OSCError = io_error.into();
        assert!(osc_error.to_string().contains("Server error"));
    }

    #[test]
    fn test_error_display() {
        let error = OSCError::new(OSCErrorType::SendError, "Failed to send message".to_string());
        assert_eq!(error.to_string(), "Failed to send OSC message: Failed to send message");
    }
}
