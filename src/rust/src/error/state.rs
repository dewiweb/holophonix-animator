use std::fmt;

#[derive(Debug)]
pub struct StateError {
    message: String,
}

impl StateError {
    pub fn new<T: Into<String>>(msg: T) -> Self {
        StateError {
            message: msg.into(),
        }
    }
}

impl fmt::Display for StateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for StateError {}

impl AsRef<str> for StateError {
    fn as_ref(&self) -> &str {
        &self.message
    }
}

// Implement conversion from StateError to NAPI Error
impl From<StateError> for napi::Error {
    fn from(err: StateError) -> Self {
        napi::Error::new(napi::Status::GenericFailure, err.message)
    }
}

// Implement conversion from NAPI Error to StateError
impl From<napi::Error> for StateError {
    fn from(err: napi::Error) -> Self {
        StateError::new(err.to_string())
    }
}
