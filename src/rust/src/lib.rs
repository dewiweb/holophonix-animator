#![deny(clippy::all)]

use napi_derive::napi;
use napi::bindgen_prelude::*;
use std::sync::Arc;
use tokio::sync::Mutex;

#[cfg(test)]
mod tests {
    pub mod animation;
    pub mod osc;
    pub mod state;
    pub mod integration;
    pub mod integration_test;
}

pub mod animation;
pub mod bridge;
pub mod common;
pub mod error;
pub mod models;
pub mod osc;
pub mod state;

pub use animation::{AnimationEngine, AnimationConfig, AnimationType};
pub use error::AnimatorError;
pub use osc::{OSCConfig, OSCError};
pub use state::StateManager;
pub use animation::track::TrackState;

#[napi]
pub struct HolophonixAnimator {
    engine: Arc<Mutex<AnimationEngine>>,
}

#[napi]
impl HolophonixAnimator {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        let engine = Arc::new(Mutex::new(AnimationEngine::new()?));
        Ok(Self { engine })
    }

    #[napi]
    pub async fn initialize(&self) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.initialize().await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn start_animation(&self, id: String, config: AnimationConfig) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.start_animation(id, config).await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.pause_animation(id).await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.resume_animation(id).await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.stop_animation(id).await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let engine = self.engine.lock().await;
        engine.update(delta_time).await.map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_animator() -> napi::Result<()> {
        let animator = HolophonixAnimator::new()?;
        animator.initialize().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_osc_config() -> napi::Result<()> {
        // Test implementation
        Ok(())
    }

    #[tokio::test]
    async fn test_track_parameters() -> napi::Result<()> {
        // Test implementation
        Ok(())
    }

    #[tokio::test]
    async fn test_animator_core() -> napi::Result<()> {
        // Test implementation
        Ok(())
    }

    #[tokio::test]
    async fn test_state_manager() -> napi::Result<()> {
        let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::current_dir()?.join("state"))?));
        assert!(state_manager.lock().await.is_ok());
        Ok(())
    }

    #[tokio::test]
    async fn test_animation_engine() -> napi::Result<()> {
        let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::current_dir()?.join("state"))?));
        let engine = AnimationEngine::new(state_manager);
        assert!(engine.is_ok());
        Ok(())
    }
}

// Re-export integration tests
#[cfg(test)]
pub use tests::*;
