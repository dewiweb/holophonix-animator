use napi_derive::napi;
use serde::{Serialize, Deserialize};
use napi::bindgen_prelude::*;

pub mod animation;
pub mod error;
pub mod osc;
pub mod plugin;
pub mod test_utils;
pub mod utils;

// Re-export commonly used types
pub use animation::models::{Animation, AnimationConfig, AnimationType};
pub use error::{AnimatorError, AnimatorResult};
pub use osc::{OSCConfig, OSCError, OSCMessage};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Position {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CartesianCoordinates {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl From<Position> for CartesianCoordinates {
    fn from(pos: Position) -> Self {
        Self {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        }
    }
}

impl From<CartesianCoordinates> for Position {
    fn from(coords: CartesianCoordinates) -> Self {
        Self {
            x: coords.x,
            y: coords.y,
            z: coords.z,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolarCoordinates {
    pub radius: f64,
    pub azimuth: f64,
    pub elevation: f64,
}

impl PolarCoordinates {
    pub fn to_cartesian(&self) -> CartesianCoordinates {
        let x = self.radius * self.azimuth.cos() * self.elevation.cos();
        let y = self.radius * self.azimuth.sin() * self.elevation.cos();
        let z = self.radius * self.elevation.sin();
        CartesianCoordinates { x, y, z }
    }

    pub fn from_cartesian(cart: &CartesianCoordinates) -> Self {
        let radius = (cart.x * cart.x + cart.y * cart.y + cart.z * cart.z).sqrt();
        let azimuth = cart.y.atan2(cart.x);
        let elevation = if radius == 0.0 {
            0.0
        } else {
            (cart.z / radius).asin()
        };
        Self {
            radius,
            azimuth,
            elevation,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub fn new(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }
}
