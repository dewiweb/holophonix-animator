// Module declarations
pub mod animation;
pub mod config;
pub mod core;
pub mod models;

// Re-exports
pub use animation::Animation;
pub use config::Config;
pub use core::{StateManager, StateUpdates, UpdateBatch};
pub use models::{Position, TrackParameters};

// External imports
use std::path::PathBuf;
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::Mutex;
use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

use crate::animation::track::TrackState;

#[napi]
pub struct StateManager {
    state_dir: PathBuf,
    track_state: Arc<Mutex<TrackState>>,
    animation_cache: Arc<Mutex<HashMap<String, Animation>>>,
    position_cache: Arc<Mutex<HashMap<String, Position>>>,
    simplified_updates: bool,
    safe_mode: bool,
}

#[napi]
impl StateManager {
    pub fn new(state_dir: PathBuf) -> napi::Result<Self> {
        Ok(Self {
            state_dir,
            track_state: Arc::new(Mutex::new(TrackState::default())),
            animation_cache: Arc::new(Mutex::new(HashMap::new())),
            position_cache: Arc::new(Mutex::new(HashMap::new())),
            simplified_updates: false,
            safe_mode: false,
        })
    }

    pub async fn update_positions(&self) -> napi::Result<()> {
        let mut track_state = self.track_state.lock().await;
        track_state.update_positions().await?;
        Ok(())
    }

    pub async fn validate(&self) -> napi::Result<()> {
        let track_state = self.track_state.lock().await;
        track_state.validate().await?;
        Ok(())
    }

    pub async fn restore_checkpoint(&self) -> napi::Result<()> {
        let mut track_state = self.track_state.lock().await;
        track_state.restore_checkpoint().await?;
        Ok(())
    }

    pub async fn invalidate_cache(&self, cache_name: &str) -> napi::Result<()> {
        match cache_name {
            "animation_cache" => {
                let mut cache = self.animation_cache.lock().await;
                cache.clear();
            },
            "position_cache" => {
                let mut cache = self.position_cache.lock().await;
                cache.clear();
            },
            _ => return Err(napi::Error::from_reason(format!("Invalid cache name: {}", cache_name))),
        }
        Ok(())
    }

    pub async fn save_state(&self) -> napi::Result<()> {
        let track_state = self.track_state.lock().await;
        track_state.save().await?;
        Ok(())
    }

    pub async fn load_default_state(&self) -> napi::Result<()> {
        let mut track_state = self.track_state.lock().await;
        track_state.load_default().await?;
        Ok(())
    }

    pub fn enable_simplified_updates(&mut self, enable: bool) -> napi::Result<()> {
        self.simplified_updates = enable;
        Ok(())
    }

    pub async fn clear_unused_caches(&self) -> napi::Result<()> {
        let mut animation_cache = self.animation_cache.lock().await;
        let mut position_cache = self.position_cache.lock().await;
        animation_cache.clear();
        position_cache.clear();
        Ok(())
    }

    pub async fn cleanup_unused_animations(&self) -> napi::Result<()> {
        let mut animation_cache = self.animation_cache.lock().await;
        animation_cache.retain(|_, _| true); // TODO: Implement cleanup logic
        Ok(())
    }

    pub async fn compact_memory(&self) -> napi::Result<()> {
        self.clear_unused_caches().await?;
        self.cleanup_unused_animations().await?;
        Ok(())
    }

    pub async fn get_active_animation_count(&self) -> napi::Result<usize> {
        let animation_cache = self.animation_cache.lock().await;
        Ok(animation_cache.len())
    }

    pub async fn cleanup_resources(&self) -> napi::Result<()> {
        self.clear_unused_caches().await?;
        Ok(())
    }

    pub async fn reset_locks(&self) -> napi::Result<()> {
        // No-op for now, locks are handled by Tokio
        Ok(())
    }

    pub fn enable_safe_mode(&mut self, enable: bool) -> napi::Result<()> {
        self.safe_mode = enable;
        Ok(())
    }

    #[napi]
    pub async fn apply_batch_update(&self, batch: UpdateBatch) -> napi::Result<()> {
        let mut track_state = self.track_state.lock().await;
        
        // Apply track updates
        for (id, params) in batch.track_updates {
            track_state.update_track(&id, params).await?;
        }
        
        Ok(())
    }
}

#[napi(object)]
#[derive(Debug, Clone, Default)]
pub struct StateUpdates {
    pub track_updates: Vec<(String, TrackParameters)>,
    pub animation_updates: Vec<(String, Animation)>,
    pub position_updates: Vec<(String, Position)>,
}

#[napi]
impl StateUpdates {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[napi]
    pub fn add_track_update(&mut self, id: String, params: TrackParameters) {
        self.track_updates.push((id, params));
    }

    #[napi]
    pub fn add_animation_update(&mut self, id: String, animation: Animation) {
        self.animation_updates.push((id, animation));
    }

    #[napi]
    pub fn add_position_update(&mut self, id: String, position: Position) {
        self.position_updates.push((id, position));
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBatch {
    pub track_updates: Vec<(String, TrackParameters)>,
    pub animation_updates: Vec<(String, Animation)>,
    pub position_updates: Vec<(String, Position)>,
}

impl UpdateBatch {
    pub fn new() -> Self {
        Self {
            track_updates: Vec::new(),
            animation_updates: Vec::new(),
            position_updates: Vec::new(),
        }
    }

    pub fn add_track_update(&mut self, id: String, params: TrackParameters) {
        self.track_updates.push((id, params));
    }

    pub fn add_animation_update(&mut self, id: String, animation: Animation) {
        self.animation_updates.push((id, animation));
    }

    pub fn add_position_update(&mut self, id: String, position: Position) {
        self.position_updates.push((id, position));
    }
}

impl FromNapiValue for UpdateBatch {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        let track_updates = obj.get::<_, Vec<(String, TrackParameters)>>("trackUpdates")?
            .unwrap_or_default();
        let animation_updates = obj.get::<_, Vec<(String, Animation)>>("animationUpdates")?
            .unwrap_or_default();
        let position_updates = obj.get::<_, Vec<(String, Position)>>("positionUpdates")?
            .unwrap_or_default();

        Ok(Self {
            track_updates,
            animation_updates,
            position_updates,
        })
    }
}

impl ToNapiValue for UpdateBatch {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        obj.set("trackUpdates", val.track_updates)?;
        obj.set("animationUpdates", val.animation_updates)?;
        obj.set("positionUpdates", val.position_updates)?;
        Ok(obj.into_napi_value()?)
    }
}

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

impl FromNapiValue for StateUpdates {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        Ok(Self {
            track_updates: obj.get("trackUpdates")?,
            animation_updates: obj.get("animationUpdates")?,
            position_updates: obj.get("positionUpdates")?,
        })
    }
}

impl ToNapiValue for StateUpdates {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        
        obj.set("trackUpdates", val.track_updates)?;
        obj.set("animationUpdates", val.animation_updates)?;
        obj.set("positionUpdates", val.position_updates)?;
        
        Ok(obj.0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub duration: f64,
    pub start_time: f64,
    pub end_time: f64,
}
