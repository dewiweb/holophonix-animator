use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    #[napi(js_name = "x")]
    pub x: f64,
    #[napi(js_name = "y")]
    pub y: f64,
    #[napi(js_name = "z")]
    pub z: f64,
}

impl Default for Position {
    fn default() -> Self {
        Position {
            x: 0.0,
            y: 0.0,
            z: 0.0,
        }
    }
}

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn distance_to(&self, other: Position) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    pub fn lerp(&self, other: &Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }

    #[napi]
    pub fn to_js_object(&self) -> napi::Result<napi::JsObject> {
        let obj = napi::Object::create()?;
        obj.set_named_property("x", self.x)?;
        obj.set_named_property("y", self.y)?;
        obj.set_named_property("z", self.z)?;
        Ok(obj)
    }
}

impl From<Position> for napi::JsObject {
    fn from(pos: Position) -> Self {
        let mut obj = napi::Object::create().unwrap();
        obj.set("x", pos.x).unwrap();
        obj.set("y", pos.y).unwrap();
        obj.set("z", pos.z).unwrap();
        obj
    }
}

impl FromNapiValue for Position {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = JsObject::from_napi_value(env, napi_val)?;
        let x = obj.get_named_property::<f64>("x")?;
        let y = obj.get_named_property::<f64>("y")?;
        let z = obj.get_named_property::<f64>("z")?;
        Ok(Self::new(x, y, z))
    }
}

impl ToNapiValue for Position {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let obj = JsObject::new(env)?;
        obj.set_named_property("x", val.x)?;
        obj.set_named_property("y", val.y)?;
        obj.set_named_property("z", val.z)?;
        Ok(obj.0)
    }
}

impl ObjectFinalize for Position {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position() {
        let pos1 = Position::new(1.0, 2.0, 3.0);
        let pos2 = Position::new(4.0, 5.0, 6.0);

        assert_eq!(pos1.x, 1.0);
        assert_eq!(pos1.y, 2.0);
        assert_eq!(pos1.z, 3.0);

        let distance = pos1.distance_to(pos2);
        assert!((distance - 5.196152422706632).abs() < 1e-10);
    }

    #[test]
    fn test_default() {
        let pos = Position::default();
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);
    }

    #[test]
    fn test_lerp() {
        let start = Position::new(0.0, 0.0, 0.0);
        let end = Position::new(10.0, 10.0, 10.0);
        let mid = start.lerp(&end, 0.5);
        assert_eq!(mid.x, 5.0);
        assert_eq!(mid.y, 5.0);
        assert_eq!(mid.z, 5.0);
    }

    #[test]
    fn test_position_lerp() {
        let start = Position::new(0.0, 0.0, 0.0);
        let end = Position::new(10.0, 10.0, 10.0);

        // Test start point
        let pos = start.lerp(&end, 0.0);
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);

        // Test midpoint
        let pos = start.lerp(&end, 0.5);
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 5.0);
        assert_eq!(pos.z, 5.0);

        // Test endpoint
        let pos = start.lerp(&end, 1.0);
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 10.0);
        assert_eq!(pos.z, 10.0);
    }
}
