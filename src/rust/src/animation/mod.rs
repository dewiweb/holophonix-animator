// Module declarations
pub mod models;
pub mod timeline;
pub mod plugin;

// Standard library imports
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::sync::Mutex;

// External crate imports
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

// Internal imports
use models::{AnimationModel, LinearModel, Position};

// Re-exports from models
pub use crate::models::{AnimationConfig};

// Re-exports from other modules
pub use timeline::{AnimationTimeline, TimelineManager};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
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

    pub fn lerp(start: &Position, end: &Position, t: f64) -> Position {
        Position {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t,
        }
    }
}

impl FromNapiValue for Position {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = JsObject::from_napi_value(env, napi_val)?;
        let x = obj.get_named_property::<f64>("x")?;
        let y = obj.get_named_property::<f64>("y")?;
        let z = obj.get_named_property::<f64>("z")?;
        Ok(Self { x, y, z })
    }
}

impl ToNapiValue for Position {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = JsObject::new(env)?;
        obj.set_named_property("x", val.x)?;
        obj.set_named_property("y", val.y)?;
        obj.set_named_property("z", val.z)?;
        Ok(obj.into_raw())
    }
}

/// A trait defining the behavior of an animation model.
/// 
/// Animation models are responsible for calculating positions over time based on their specific
/// movement patterns. All methods return `Result<T>` for consistent error handling.
pub trait AnimationModel: Debug + Send + Sync {
    /// Starts the animation, initializing any necessary timing state.
    /// Returns an error if the animation is already running.
    fn start(&mut self) -> Result<()>;

    /// Stops the animation, clearing any timing state.
    /// Returns an error if the animation is not running.
    fn stop(&mut self) -> Result<()>;

    /// Updates the animation state based on the given time and returns the new position.
    /// 
    /// # Arguments
    /// * `time` - The elapsed time in seconds since the animation started
    ///
    /// # Returns
    /// * `Result<f64>` - The calculated progress at the given time
    fn update(&mut self, time: f64) -> Result<f64>;

    /// Returns whether the animation has completed.
    fn is_complete(&self) -> Result<bool>;
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub model_type: String,
}

impl AnimationConfig {
    pub fn new(start_position: Position, end_position: Position, duration: f64, model_type: String) -> Self {
        Self {
            start_position,
            end_position,
            duration,
            model_type,
        }
    }
}

impl FromNapiValue for AnimationConfig {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        let start_position = obj.get_named_property::<Position>("start_position")?;
        let end_position = obj.get_named_property::<Position>("end_position")?;
        let duration = obj.get_named_property::<f64>("duration")?;
        let model_type = obj.get_named_property::<String>("model_type")?;

        Ok(Self {
            start_position,
            end_position,
            duration,
            model_type,
        })
    }
}

impl ToNapiValue for AnimationConfig {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let obj = Object::new(env)?;
        
        obj.set_named_property("start_position", val.start_position)?;
        obj.set_named_property("end_position", val.end_position)?;
        obj.set_named_property("duration", val.duration)?;
        obj.set_named_property("model_type", val.model_type)?;

        Ok(obj.raw())
    }
}

#[napi]
#[derive(Debug)]
pub struct Animation {
    id: String,
    start_position: Position,
    end_position: Position,
    duration: f64,
    model: Arc<Mutex<Box<dyn AnimationModel>>>,
    is_running: bool,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(
        id: String,
        start_position: Position,
        end_position: Position,
        duration: f64,
        model_type: String,
    ) -> Result<Self> {
        if duration <= 0.0 {
            return Err(Error::from_reason("Duration must be positive"));
        }

        let model: Box<dyn AnimationModel> = match model_type.as_str() {
            "linear" => Box::new(LinearModel::new(start_position.clone(), end_position.clone(), duration)?),
            _ => return Err(Error::from_reason(format!("Unknown animation model type: {}", model_type))),
        };

        Ok(Self {
            id,
            start_position,
            end_position,
            duration,
            model: Arc::new(Mutex::new(model)),
            is_running: false,
        })
    }

    #[napi]
    pub async fn start(&mut self) -> Result<()> {
        if self.is_running {
            return Err(Error::from_reason("Animation already running"));
        }
        self.model.lock().await.start()?;
        self.is_running = true;
        Ok(())
    }

    #[napi]
    pub async fn stop(&mut self) -> Result<()> {
        if !self.is_running {
            return Err(Error::from_reason("Animation not running"));
        }
        self.model.lock().await.stop()?;
        self.is_running = false;
        Ok(())
    }

    #[napi]
    pub async fn update(&mut self, current_time: f64) -> Result<Position> {
        if !self.is_running {
            return Err(Error::from_reason("Animation not running"));
        }

        let mut model = self.model.lock().await;
        let position = model.update(current_time)?;
        
        if model.is_complete()? {
            self.is_running = false;
            Ok(self.end_position.clone())
        } else {
            Ok(position)
        }
    }

    #[napi]
    pub async fn is_complete(&self) -> Result<bool> {
        self.model.lock().await.is_complete()
    }

    #[napi]
    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    #[napi]
    pub fn get_duration(&self) -> f64 {
        self.duration
    }
}

impl Clone for Animation {
    fn clone(&self) -> Self {
        // Create a new instance with the same data but a new Arc<Mutex<...>>
        Self {
            id: self.id.clone(),
            start_position: self.start_position.clone(),
            end_position: self.end_position.clone(),
            duration: self.duration,
            model: self.model.clone(),
            is_running: self.is_running,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_animation() {
        let config = AnimationConfig::new(
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            10.0,
            "linear".to_string(),
        );

        let mut animation = Animation::new("test".to_string(), config.start_position, config.end_position, config.duration, config.model_type).unwrap();

        // Test initial state
        assert!(!animation.is_complete().unwrap());

        // Test start
        animation.start().unwrap();

        // Test update
        let pos = animation.update(5.0).unwrap();
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 5.0);
        assert_eq!(pos.z, 5.0);

        // Test completion
        let pos = animation.update(10.0).unwrap();
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 10.0);
        assert_eq!(pos.z, 10.0);
        assert!(animation.is_complete().unwrap());

        // Test stop
        animation.stop().unwrap();
        assert!(animation.is_complete().unwrap());
    }
}
