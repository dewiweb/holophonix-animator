use std::fmt;
use thiserror::Error;
use crate::osc::OSCError;

pub type AnimatorResult<T> = Result<T, AnimatorError>;

#[derive(Debug, Error)]
pub enum AnimatorError {
    #[error("IO error: {0}")]
    IO(#[from] std::io::Error),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("State error: {0}")]
    State(String),

    #[error("Resource error: {0}")]
    Resource(String),

    #[error("OSC error: {0}")]
    OSC(String),
}

impl From<&str> for AnimatorError {
    fn from(s: &str) -> Self {
        AnimatorError::State(s.to_string())
    }
}

impl From<String> for AnimatorError {
    fn from(s: String) -> Self {
        AnimatorError::State(s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let io_err = AnimatorError::IO(std::io::Error::new(std::io::ErrorKind::Other, "test error"));
        let param_err = AnimatorError::InvalidParameter("invalid value".to_string());
        let state_err = AnimatorError::State("invalid state".to_string());
        let resource_err = AnimatorError::Resource("resource not found".to_string());
        let osc_err = AnimatorError::OSC("connection failed".to_string());

        assert!(io_err.to_string().contains("IO error"));
        assert!(param_err.to_string().contains("Invalid parameter"));
        assert!(state_err.to_string().contains("State error"));
        assert!(resource_err.to_string().contains("Resource error"));
        assert!(osc_err.to_string().contains("OSC error"));
    }

    #[test]
    fn test_error_conversion() {
        let str_err: AnimatorError = "test error".into();
        let string_err: AnimatorError = String::from("test error").into();

        assert_eq!(str_err.to_string(), "State error: test error");
        assert_eq!(string_err.to_string(), "State error: test error");
    }
}
