use napi::bindgen_prelude::*;
use std::fmt;

pub type AnimatorResult<T> = Result<T, AnimatorError>;

#[napi(object)]
#[derive(Debug)]
pub struct AnimatorError {
    pub code: i32,
    pub message: String,
}

impl fmt::Display for AnimatorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Error {}: {}", self.code, self.message)
    }
}

impl std::error::Error for AnimatorError {}

impl From<napi::Error> for AnimatorError {
    fn from(error: napi::Error) -> Self {
        Self {
            code: error.status.unwrap_or(-1),
            message: error.reason,
        }
    }
}

impl From<std::io::Error> for AnimatorError {
    fn from(error: std::io::Error) -> Self {
        Self {
            code: error.raw_os_error().unwrap_or(-1),
            message: error.to_string(),
        }
    }
}

impl From<&str> for AnimatorError {
    fn from(message: &str) -> Self {
        Self {
            code: -1,
            message: message.to_string(),
        }
    }
}

impl From<String> for AnimatorError {
    fn from(message: String) -> Self {
        Self {
            code: -1,
            message,
        }
    }
}

impl From<AnimatorError> for napi::Error {
    fn from(error: AnimatorError) -> Self {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("Error {}: {}", error.code, error.message),
        )
    }
}

#[napi]
impl AnimatorError {
    #[napi(constructor)]
    pub fn new(code: i32, message: String) -> Self {
        Self { code, message }
    }
}
