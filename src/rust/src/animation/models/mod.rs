use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use async_trait::async_trait;
use napi::Result;
use std::collections::HashMap;
use std::fmt::Debug;

pub mod easing;
pub mod custom_path;

pub use easing::EasingFunction;
pub use custom_path::CustomPathModel;

mod linear;
mod circular;
mod pattern;

pub use linear::LinearModel;
pub use circular::CircularModel;
pub use pattern::PatternModel;

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

#[napi]
impl Position {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn lerp(&self, other: &Position, t: f64) -> Position {
        Position {
            x: self.x + (other.x - self.x) * t,
            y: self.y + (other.y - self.y) * t,
            z: self.z + (other.z - self.z) * t,
        }
    }
}

impl ToNapiValue for Position {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        obj.set("x", val.x)?;
        obj.set("y", val.y)?;
        obj.set("z", val.z)?;
        Ok(obj.0)
    }
}

impl FromNapiValue for Position {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object(napi_val);
        let x = f64::from_napi_value(env, obj.get_named_property_unchecked("x")?)?;
        let y = f64::from_napi_value(env, obj.get_named_property_unchecked("y")?)?;
        let z = f64::from_napi_value(env, obj.get_named_property_unchecked("z")?)?;
        Ok(Self { x, y, z })
    }
}

pub trait AnimationModel: Debug + Send + Sync {
    fn start(&mut self);
    fn stop(&mut self);
    fn update(&mut self, time: f64) -> Position;
    fn is_complete(&self) -> bool;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub model_type: String,
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
}

impl AnimationConfig {
    pub fn new(model_type: String, start_position: Position, end_position: Position, duration: f64) -> Self {
        Self {
            model_type,
            start_position,
            end_position,
            duration,
        }
    }

    pub fn create_model(&self) -> Box<dyn AnimationModel + Send> {
        match self.model_type.as_str() {
            "linear" => Box::new(linear::LinearModel::new(
                self.start_position.clone(),
                self.end_position.clone(),
                self.duration,
            )),
            "pattern" => Box::new(pattern::PatternModel::new(
                self.start_position.clone(),
                self.end_position.clone(),
                self.duration,
                None,
            )),
            "circular" => Box::new(circular::CircularModel::new(
                "circular".to_string(),
                self.start_position.clone(),
                self.duration,
                1.0, // Default frequency
            )),
            _ => panic!("Unknown model type"),
        }
    }
}

pub struct LinearModel {
    start_position: Position,
    end_position: Position,
    duration: f64,
    start_time: Option<f64>,
    is_complete: bool,
}

impl LinearModel {
    pub fn new(start_position: Position, end_position: Position, duration: f64) -> Self {
        Self {
            start_position,
            end_position,
            duration,
            start_time: None,
            is_complete: false,
        }
    }
}

impl AnimationModel for LinearModel {
    fn start(&mut self) {
        self.start_time = Some(0.0);
        self.is_complete = false;
    }

    fn stop(&mut self) {
        self.start_time = None;
        self.is_complete = true;
    }

    fn update(&mut self, time: f64) -> Position {
        if let Some(start_time) = self.start_time {
            let elapsed = time - start_time;
            if elapsed >= self.duration {
                self.is_complete = true;
                self.end_position.clone()
            } else {
                let t = elapsed / self.duration;
                self.start_position.lerp(&self.end_position, t)
            }
        } else {
            self.start_position.clone()
        }
    }

    fn is_complete(&self) -> bool {
        self.is_complete
    }
}

pub struct CircularModel {
    name: String,
    center: Position,
    radius: f64,
    duration: f64,
    start_time: Option<f64>,
    is_complete: bool,
}

impl CircularModel {
    pub fn new(name: String, center: Position, duration: f64, radius: f64) -> Self {
        Self {
            name,
            center,
            radius,
            duration,
            start_time: None,
            is_complete: false,
        }
    }
}

impl AnimationModel for CircularModel {
    fn start(&mut self) {
        self.start_time = Some(0.0);
        self.is_complete = false;
    }

    fn stop(&mut self) {
        self.start_time = None;
        self.is_complete = true;
    }

    fn update(&mut self, time: f64) -> Position {
        if let Some(start_time) = self.start_time {
            let elapsed = time - start_time;
            if elapsed >= self.duration {
                self.is_complete = true;
                Position::new(
                    self.center.x + self.radius,
                    self.center.y,
                    self.center.z,
                )
            } else {
                let angle = (elapsed / self.duration) * 2.0 * std::f64::consts::PI;
                Position::new(
                    self.center.x + self.radius * angle.cos(),
                    self.center.y + self.radius * angle.sin(),
                    self.center.z,
                )
            }
        } else {
            Position::new(
                self.center.x + self.radius,
                self.center.y,
                self.center.z,
            )
        }
    }

    fn is_complete(&self) -> bool {
        self.is_complete
    }
}

pub struct PatternModel {
    positions: Vec<Position>,
    durations: Vec<f64>,
    current_index: usize,
    start_time: Option<f64>,
    is_complete: bool,
}

impl PatternModel {
    pub fn new(positions: Vec<Position>, durations: Vec<f64>) -> Self {
        Self {
            positions,
            durations,
            current_index: 0,
            start_time: None,
            is_complete: false,
        }
    }
}

impl AnimationModel for PatternModel {
    fn start(&mut self) {
        self.start_time = Some(0.0);
        self.current_index = 0;
        self.is_complete = false;
    }

    fn stop(&mut self) {
        self.start_time = None;
        self.is_complete = true;
    }

    fn update(&mut self, time: f64) -> Position {
        if let Some(start_time) = self.start_time {
            let mut elapsed = time - start_time;
            let mut index = 0;
            
            // Find current segment
            for (i, &duration) in self.durations.iter().enumerate() {
                if elapsed < duration {
                    index = i;
                    break;
                }
                elapsed -= duration;
            }

            if index >= self.positions.len() - 1 {
                self.is_complete = true;
                self.positions.last().unwrap().clone()
            } else {
                let t = elapsed / self.durations[index];
                self.positions[index].lerp(&self.positions[index + 1], t)
            }
        } else {
            self.positions.first().unwrap().clone()
        }
    }

    fn is_complete(&self) -> bool {
        self.is_complete
    }
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct Animation {
    pub id: String,
    pub config: AnimationConfig,
    #[serde(skip)]
    model: Box<dyn AnimationModel + Send>,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub async fn new(id: String, config: AnimationConfig) -> napi::Result<Self> {
        let model = config.create_model();
        Ok(Self {
            id,
            config,
            model,
        })
    }

    #[napi]
    pub async fn update(&mut self, elapsed_ms: f64) -> napi::Result<()> {
        self.model.update(elapsed_ms).await.map_err(|e| napi::Error::from_reason(e.to_string()))
    }

    #[napi]
    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    #[napi]
    pub fn get_duration(&self) -> f64 {
        self.config.duration
    }

    #[napi]
    pub async fn is_complete(&self, current_time: f64) -> napi::Result<bool> {
        self.model.is_complete(current_time).await.map_err(|e| napi::Error::from_reason(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_linear_model() {
        let config = AnimationConfig::new(
            "linear".to_string(),
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 1.0),
            1000.0,
        );

        let mut model = config.create_model();
        model.start();
        assert!(!model.is_complete());

        let pos = model.update(500.0);
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!((pos.y - 0.5).abs() < 1e-10);
        assert!((pos.z - 0.5).abs() < 1e-10);

        let pos = model.update(1000.0);
        assert!((pos.x - 1.0).abs() < 1e-10);
        assert!((pos.y - 1.0).abs() < 1e-10);
        assert!((pos.z - 1.0).abs() < 1e-10);
        assert!(model.is_complete());

        model.stop();
        assert!(model.is_complete());
    }

    #[tokio::test]
    async fn test_pattern_model() {
        let config = AnimationConfig::new(
            "pattern".to_string(),
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 1.0),
            1000.0,
        );

        let mut model = config.create_model();
        model.start();
        assert!(!model.is_complete());

        let pos = model.update(500.0);
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!((pos.y - 0.5).abs() < 1e-10);
        assert!((pos.z - 0.5).abs() < 1e-10);

        let pos = model.update(1000.0);
        assert!((pos.x - 1.0).abs() < 1e-10);
        assert!((pos.y - 1.0).abs() < 1e-10);
        assert!((pos.z - 1.0).abs() < 1e-10);
        assert!(model.is_complete());

        model.stop();
        assert!(model.is_complete());
    }
}
