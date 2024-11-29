use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    pub host: String,
    pub port: u16,
    pub timeout_ms: u32,
    pub server_address: String,
    pub server_port: u16,
    pub client_address: String,
    pub client_port: u16,
}

impl Default for OSCConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 9000,
            timeout_ms: 1000,
            server_address: "127.0.0.1".to_string(),
            server_port: 9001,
            client_address: "127.0.0.1".to_string(),
            client_port: 9002,
        }
    }
}

impl ObjectFinalize for OSCConfig {}

#[napi]
impl OSCConfig {
    #[napi(constructor)]
    pub fn new(host: String, port: u16, timeout_ms: u32, server_address: String, server_port: u16, client_address: String, client_port: u16) -> Self {
        Self {
            host,
            port,
            timeout_ms,
            server_address,
            server_port,
            client_address,
            client_port,
        }
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

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackParameters {
    pub id: String,
    pub cartesian: Option<CartesianCoordinates>,
    pub polar: Option<PolarCoordinates>,
    pub color: Option<Color>,
    pub gain: Option<f64>,
    pub mute: Option<bool>,
    pub active: Option<bool>,
}

impl ObjectFinalize for TrackParameters {}

#[napi]
impl TrackParameters {
    #[napi(constructor)]
    pub fn new(id: String) -> Self {
        Self {
            id,
            cartesian: None,
            polar: None,
            color: None,
            gain: None,
            mute: None,
            active: None,
        }
    }
}

#[derive(Debug)]
pub enum OSCErrorType {
    Protocol,
    Validation,
}

#[derive(Debug)]
pub struct OSCError {
    pub error_type: OSCErrorType,
    pub message: String,
}

impl OSCError {
    pub fn new<T: Into<String>>(error_type: OSCErrorType, message: T) -> Self {
        Self {
            error_type,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for OSCError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}: {}", self.error_type, self.message)
    }
}

impl From<std::io::Error> for OSCError {
    fn from(error: std::io::Error) -> Self {
        Self::new(OSCErrorType::Protocol, error.to_string())
    }
}

impl From<rosc::OscError> for OSCError {
    fn from(error: rosc::OscError) -> Self {
        Self::new(OSCErrorType::Protocol, error.to_string())
    }
}

impl From<napi::Error> for OSCError {
    fn from(error: napi::Error) -> Self {
        Self::new(OSCErrorType::Protocol, error.to_string())
    }
}

impl From<OSCError> for napi::Error {
    fn from(error: OSCError) -> Self {
        napi::Error::from_reason(error.to_string())
    }
}
