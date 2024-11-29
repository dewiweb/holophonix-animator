use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::f64::consts::PI;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    #[napi(writable = true, readonly = false)]
    pub x: f64,
    #[napi(writable = true, readonly = false)]
    pub y: f64,
    #[napi(writable = true, readonly = false)]
    pub z: f64,
}

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
    pub fn distance(&self, other: &Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    #[napi]
    pub fn lerp(&self, other: &Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }

    #[napi]
    pub fn azim(&self) -> Option<f64> {
        if self.x == 0.0 && self.y == 0.0 {
            None
        } else {
            Some(self.y.atan2(self.x) * 180.0 / PI)
        }
    }

    #[napi]
    pub fn elev(&self) -> Option<f64> {
        let r = (self.x * self.x + self.y * self.y + self.z * self.z).sqrt();
        if r == 0.0 {
            None
        } else {
            Some((self.z / r).asin() * 180.0 / PI)
        }
    }

    #[napi]
    pub fn dist(&self) -> Option<f64> {
        let r = (self.x * self.x + self.y * self.y + self.z * self.z).sqrt();
        if r == 0.0 {
            None
        } else {
            Some(r)
        }
    }

    #[napi]
    pub fn from_aed(azim: f64, elev: f64, dist: f64) -> Self {
        let azim_rad = azim * PI / 180.0;
        let elev_rad = elev * PI / 180.0;
        let cos_elev = elev_rad.cos();
        
        Self {
            x: dist * cos_elev * azim_rad.cos(),
            y: dist * cos_elev * azim_rad.sin(),
            z: dist * elev_rad.sin(),
        }
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
