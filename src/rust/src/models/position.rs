use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Position3D {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl ObjectFinalize for Position3D {}

#[napi]
impl Position3D {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn get_x(&self) -> f64 {
        self.x
    }

    #[napi]
    pub fn get_y(&self) -> f64 {
        self.y
    }

    #[napi]
    pub fn get_z(&self) -> f64 {
        self.z
    }
}
