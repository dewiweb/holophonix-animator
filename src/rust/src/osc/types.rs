use serde::{Serialize, Deserialize};
use napi_derive::napi;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    pub client_address: String,
    pub client_port: u16,
    pub server_address: String,
    pub server_port: u16,
}

#[napi(object)]
#[derive(Default, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct CartesianCoordinates {
    #[napi(ts_type = "number")]
    pub x: f64,
    #[napi(ts_type = "number")]
    pub y: f64,
    #[napi(ts_type = "number")]
    pub z: f64,
}

#[napi(object)]
#[derive(Default, Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct PolarCoordinates {
    #[napi(ts_type = "number")]
    pub azim: f64,
    #[napi(ts_type = "number")]
    pub elev: f64,
    #[napi(ts_type = "number")]
    pub dist: f64,
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Color {
    #[napi(ts_type = "number")]
    pub r: f64,
    #[napi(ts_type = "number")]
    pub g: f64,
    #[napi(ts_type = "number")]
    pub b: f64,
    #[napi(ts_type = "number")]
    pub a: f64,
}

#[napi(object)]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TrackParameters {
    pub cartesian: Option<CartesianCoordinates>,
    pub polar: Option<PolarCoordinates>,
    #[napi(ts_type = "number | null")]
    pub gain: Option<f64>,
    pub mute: Option<bool>,
    pub color: Option<Color>,
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    #[napi(ts_type = "boolean")]
    pub playing: bool,
    #[napi(ts_type = "boolean")]
    pub paused: bool,
    #[napi(ts_type = "boolean")]
    pub active: bool,
    #[napi(ts_type = "boolean")]
    pub loop_enabled: bool,
    #[napi(ts_type = "number")]
    pub speed: f64,
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            playing: false,
            paused: false,
            active: false,
            loop_enabled: false,
            speed: 1.0,
        }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    #[napi(ts_type = "string")]
    pub track_id: String,
    #[napi(ts_type = "TrackParameters")]
    pub parameters: TrackParameters,
    #[napi(ts_type = "Animation")]
    pub animation: Animation,
}

impl TrackState {
    pub fn new(track_id: String) -> Self {
        Self {
            track_id,
            parameters: TrackParameters::default(),
            animation: Animation::default(),
        }
    }
}

#[derive(Debug, Clone)]
pub enum OSCErrorType {
    Network,
    Protocol,
    Validation,
    Connection,
    Encoding,
    Decoding,
}

#[derive(Debug, Clone)]
pub struct OSCError {
    pub error_type: OSCErrorType,
    pub message: String,
}

impl OSCError {
    pub fn new(error_type: OSCErrorType, message: String) -> Self {
        Self {
            error_type,
            message,
        }
    }
}

impl Default for TrackState {
    fn default() -> Self {
        Self {
            track_id: String::new(),
            parameters: TrackParameters::default(),
            animation: Animation::default(),
        }
    }
}

// Helper traits for f32/f64 conversion
impl CartesianCoordinates {
    pub fn to_f32(&self) -> (f32, f32, f32) {
        (self.x as f32, self.y as f32, self.z as f32)
    }
}

impl PolarCoordinates {
    pub fn to_f32(&self) -> (f32, f32, f32) {
        (self.azim as f32, self.elev as f32, self.dist as f32)
    }
}

impl Color {
    pub fn to_f32(&self) -> (f32, f32, f32, f32) {
        (self.r as f32, self.g as f32, self.b as f32, self.a as f32)
    }
}
