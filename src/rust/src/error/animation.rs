use std::fmt;

#[derive(Debug)]
pub struct AnimationError {
    message: String,
}

impl AnimationError {
    pub fn new<T: Into<String>>(msg: T) -> Self {
        AnimationError {
            message: msg.into(),
        }
    }
}

impl fmt::Display for AnimationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AnimationError {}

impl AsRef<str> for AnimationError {
    fn as_ref(&self) -> &str {
        &self.message
    }
}

// Implement conversion from AnimationError to NAPI Error
impl From<AnimationError> for napi::Error {
    fn from(err: AnimationError) -> Self {
        napi::Error::new(napi::Status::GenericFailure, err.message)
    }
}

// Implement conversion from NAPI Error to AnimationError
impl From<napi::Error> for AnimationError {
    fn from(err: napi::Error) -> Self {
        AnimationError::new(err.to_string())
    }
}
