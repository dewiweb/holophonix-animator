use std::fmt;

#[derive(Debug)]
pub enum OSCError {
    ConnectionFailed(String),
    MessageError(String),
    ProtocolError(String),
}

impl fmt::Display for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OSCError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            OSCError::MessageError(msg) => write!(f, "Message error: {}", msg),
            OSCError::ProtocolError(msg) => write!(f, "Protocol error: {}", msg),
        }
    }
}

impl std::error::Error for OSCError {}
