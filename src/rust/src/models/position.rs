use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[napi]
impl ObjectFinalize for Position {}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn from_polar(azimuth: f64, elevation: f64, distance: f64) -> Self {
        let azimuth_rad = azimuth.to_radians();
        let elevation_rad = elevation.to_radians();
        
        let x = distance * azimuth_rad.cos() * elevation_rad.cos();
        let y = distance * azimuth_rad.sin() * elevation_rad.cos();
        let z = distance * elevation_rad.sin();
        
        Position { x, y, z }
    }

    #[napi]
    pub fn distance(&self, other: Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    #[napi]
    pub fn lerp(&self, other: Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }

    #[napi]
    pub fn azimuth(&self) -> Option<f64> {
        if self.x == 0.0 && self.y == 0.0 {
            None
        } else {
            Some(self.y.atan2(self.x).to_degrees())
        }
    }

    #[napi]
    pub fn elevation(&self) -> Option<f64> {
        let r = (self.x * self.x + self.y * self.y).sqrt();
        if r == 0.0 {
            if self.z > 0.0 {
                Some(90.0)
            } else if self.z < 0.0 {
                Some(-90.0)
            } else {
                None
            }
        } else {
            Some(self.z.atan2(r).to_degrees())
        }
    }

    #[napi]
    pub fn distance_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y + self.z * self.z).sqrt()
    }
}

impl Default for Position {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
        }
    }
}
