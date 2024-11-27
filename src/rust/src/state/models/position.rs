use napi_derive::napi;
use serde::{Serialize, Deserialize};
use napi::bindgen_prelude::*;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub orientation: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            orientation: 0.0,
        }
    }
}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64, orientation: f64) -> Self {
        Self { x, y, z, orientation }
    }

    #[napi]
    pub fn distance_to(&self, other: &Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    #[napi]
    pub fn lerp(&self, other: &Position, t: f64) -> Self {
        Self {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
            orientation: self.orientation + (other.orientation - self.orientation) * t,
        }
    }
}

impl FromNapiValue for Position {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        let x = obj.get::<_, f64>("x")?.unwrap_or_default();
        let y = obj.get::<_, f64>("y")?.unwrap_or_default();
        let z = obj.get::<_, f64>("z")?.unwrap_or_default();
        let orientation = obj.get::<_, f64>("orientation")?.unwrap_or_default();

        Ok(Self { x, y, z, orientation })
    }
}

impl ToNapiValue for Position {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        obj.set("x", val.x)?;
        obj.set("y", val.y)?;
        obj.set("z", val.z)?;
        obj.set("orientation", val.orientation)?;
        Ok(obj.into_napi_value()?)
    }
}
