use std::fmt;

#[derive(Debug)]
pub struct OSCError {
    message: String,
}

impl OSCError {
    pub fn new<T: Into<String>>(msg: T) -> Self {
        OSCError {
            message: msg.into(),
        }
    }
}

impl fmt::Display for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for OSCError {}

impl AsRef<str> for OSCError {
    fn as_ref(&self) -> &str {
        &self.message
    }
}

// Implement conversion from OSCError to NAPI Error
impl From<OSCError> for napi::Error {
    fn from(err: OSCError) -> Self {
        napi::Error::new(napi::Status::GenericFailure, err.message)
    }
}

// Implement conversion from NAPI Error to OSCError
impl From<napi::Error> for OSCError {
    fn from(err: napi::Error) -> Self {
        OSCError::new(err.to_string())
    }
}
