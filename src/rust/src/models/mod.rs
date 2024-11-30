pub mod position;
pub use position::{Position, Position as PositionModule};

pub mod state;
pub use state::TrackParameters;

pub use crate::osc::types::{CartesianCoordinates, PolarCoordinates};

// Re-export animation types
pub use crate::animation::{Animation, AnimationConfig};

use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn distance(&self, other: Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    #[napi]
    pub fn clone(&self) -> Position {
        Position {
            x: self.x,
            y: self.y,
            z: self.z,
        }
    }
}

impl ObjectFinalize for Position {}
