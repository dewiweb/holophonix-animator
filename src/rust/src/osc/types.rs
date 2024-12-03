use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use std::fmt;
use thiserror::Error;
use crate::error::AnimatorError;

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    pub host: String,
    pub port: u16,
    pub timeout_ms: u32,
}

impl Default for OSCConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 8000,
            timeout_ms: 1000,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCMessage {
    pub address: String,
    pub args: Vec<OSCMessageArg>,
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OSCMessageArg {
    Int(i32),
    Float(f32),
    String(String),
    Blob(Vec<u8>),
}

impl OSCMessage {
    pub fn new(address: impl Into<String>, args: Vec<OSCMessageArg>) -> Result<Self, AnimatorError> {
        let address = address.into();
        if !address.starts_with('/') {
            return Err(AnimatorError::InvalidParameter(
                "OSC address must start with '/'".to_string(),
            ));
        }
        Ok(OSCMessage { address, args })
    }

    pub fn with_int(address: impl Into<String>, value: i32) -> Result<Self, AnimatorError> {
        Self::new(address, vec![OSCMessageArg::Int(value)])
    }

    pub fn with_float(address: impl Into<String>, value: f32) -> Result<Self, AnimatorError> {
        Self::new(address, vec![OSCMessageArg::Float(value)])
    }

    pub fn with_string(address: impl Into<String>, value: impl Into<String>) -> Result<Self, AnimatorError> {
        Self::new(address, vec![OSCMessageArg::String(value.into())])
    }

    pub fn with_bool(address: impl Into<String>, value: bool) -> Result<Self, AnimatorError> {
        Self::new(address, vec![OSCMessageArg::String(if value { "true".to_string() } else { "false".to_string() })])
    }
}

#[derive(Debug, thiserror::Error)]
pub enum OSCError {
    #[error("Connection error: {0}")]
    ConnectionError(String),
    #[error("Send error: {0}")]
    SendError(String),
    #[error("Receive error: {0}")]
    ReceiveError(String),
    #[error("Timeout error")]
    TimeoutError,
    #[error("Invalid message: {0}")]
    InvalidMessage(String),
}

impl fmt::Display for OSCError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            OSCError::ConnectionError(msg) => write!(f, "Connection error: {}", msg),
            OSCError::SendError(msg) => write!(f, "Send error: {}", msg),
            OSCError::ReceiveError(msg) => write!(f, "Receive error: {}", msg),
            OSCError::TimeoutError => write!(f, "Timeout error"),
            OSCError::InvalidMessage(msg) => write!(f, "Invalid message: {}", msg),
        }
    }
}

impl From<OSCError> for Error {
    fn from(error: OSCError) -> Self {
        Error::from_reason(error.to_string())
    }
}

#[napi]
pub struct TrackParameters {
    pub cartesian: Option<CartesianCoordinates>,
    pub polar: Option<PolarCoordinates>,
    pub color: Option<Color>,
}

impl TrackParameters {
    pub fn new() -> Self {
        Self {
            cartesian: None,
            polar: None,
            color: None,
        }
    }

    pub fn with_cartesian(mut self, coords: CartesianCoordinates) -> Self {
        self.cartesian = Some(coords);
        self
    }

    pub fn with_polar(mut self, coords: PolarCoordinates) -> Self {
        self.polar = Some(coords);
        self
    }

    pub fn with_color(mut self, color: Color) -> Self {
        self.color = Some(color);
        self
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartesianCoordinates {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl ObjectFinalize for CartesianCoordinates {}

#[napi]
impl CartesianCoordinates {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolarCoordinates {
    pub azim: f64,
    pub elev: f64,
    pub dist: f64,
}

impl ObjectFinalize for PolarCoordinates {}

#[napi]
impl PolarCoordinates {
    #[napi(constructor)]
    pub fn new(azim: f64, elev: f64, dist: f64) -> Self {
        Self { azim, elev, dist }
    }

    pub fn to_cartesian(&self) -> CartesianCoordinates {
        let x = self.dist * self.azim.cos() * self.elev.cos();
        let y = self.dist * self.azim.sin() * self.elev.cos();
        let z = self.dist * self.elev.sin();
        CartesianCoordinates { x, y, z }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Color {
    pub r: f64,
    pub g: f64,
    pub b: f64,
    pub a: f64,
}

impl Default for Color {
    fn default() -> Self {
        Self {
            r: 1.0,
            g: 1.0,
            b: 1.0,
            a: 1.0,
        }
    }
}

impl ObjectFinalize for Color {}

#[napi]
impl Color {
    #[napi(constructor)]
    pub fn new(r: f64, g: f64, b: f64, a: f64) -> Self {
        Self { r, g, b, a }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_osc_message_creation() {
        let msg = OSCMessage::new(
            "/test/address",
            vec![
                OSCMessageArg::Int(42),
                OSCMessageArg::Float(3.14),
                OSCMessageArg::String("test".to_string()),
                OSCMessageArg::Blob(vec![1, 2, 3]),
            ],
        )
        .unwrap();

        assert_eq!(msg.address, "/test/address");
        assert_eq!(msg.args.len(), 4);
    }

    #[test]
    fn test_invalid_address() {
        let result = OSCMessage::new("invalid_address", vec![]);
        assert!(result.is_err());
        match result {
            Err(AnimatorError::InvalidParameter(msg)) => {
                assert!(msg.contains("must start with '/'"))
            }
            _ => panic!("Expected InvalidParameter error"),
        }
    }

    #[test]
    fn test_convenience_constructors() {
        let int_msg = OSCMessage::with_int("/test", 42).unwrap();
        let float_msg = OSCMessage::with_float("/test", 3.14).unwrap();
        let string_msg = OSCMessage::with_string("/test", "hello").unwrap();
        let bool_msg = OSCMessage::with_bool("/test", true).unwrap();

        assert_eq!(int_msg.args.len(), 1);
        assert_eq!(float_msg.args.len(), 1);
        assert_eq!(string_msg.args.len(), 1);
        assert_eq!(bool_msg.args.len(), 1);
    }
}
