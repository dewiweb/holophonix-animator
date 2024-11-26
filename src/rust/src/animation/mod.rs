// Module declarations
pub mod cycle;
pub mod engine;
pub mod group;
pub mod interpolation;
pub mod models;
pub mod path;
pub mod plugin;
pub mod timeline;
pub mod track;

// Re-exports from submodules
pub use cycle::Cycle;
pub use engine::{AnimationEngine, AnimationManager};
pub use group::AnimationGroup;
pub use interpolation::InterpolationType;
pub use models::*;
pub use path::Path;
pub use plugin::Plugin;
pub use timeline::{Timeline, TimelineManager};
pub use track::{Track, TrackState};

// External imports
use std::sync::Arc;
use tokio::sync::Mutex;
use napi_derive::napi;
use napi::bindgen_prelude::*;

use crate::error::{AnimatorError, AnimatorResult};
use crate::common::monitoring::PerformanceMetrics;
use crate::state::core::StateManager;

/// The main Animation Engine that coordinates all animation-related functionality
#[napi]
pub struct AnimationEngine {
    state_manager: Arc<Mutex<StateManager>>,
    timeline_manager: Arc<Mutex<TimelineManager>>,
}

#[napi]
impl AnimationEngine {
    #[napi(constructor)]
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> napi::Result<Self> {
        Ok(Self {
            state_manager,
            timeline_manager: Arc::new(Mutex::new(TimelineManager::new())),
        })
    }

    /// Initialize the animation engine
    pub async fn initialize(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.initialize().await?;
        Ok(())
    }

    /// Process a single animation frame with performance monitoring
    pub async fn process_frame(&mut self, delta_time: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update_positions()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;

        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.update(delta_time)
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Clean up resources
    pub async fn cleanup(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.cleanup_resources()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;

        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.cleanup()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Handle animation errors with recovery strategies
    pub async fn handle_error(&mut self, error: AnimatorError) -> napi::Result<()> {
        match error {
            AnimatorError::StateError(_) => {
                self.recover_state().await
                    .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
            }
            AnimatorError::ResourceError(_) => {
                self.cleanup_resources().await
                    .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
            }
            AnimatorError::ValidationError(_) => {
                self.reset_to_safe_state().await
                    .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
            }
            AnimatorError::ExecutionError(_) => {
                self.fallback_mode().await
                    .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
            }
            _ => {
                return Err(napi::Error::from_status(napi::Status::GenericFailure)
                    .context("Unhandled animation error"));
            }
        }
        Ok(())
    }

    /// Recover from state inconsistency
    async fn recover_state(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.restore_checkpoint()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Cleanup resources when exhausted
    async fn cleanup_resources(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.cleanup_resources()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Reset to safe state on validation failure
    async fn reset_to_safe_state(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.enable_safe_mode(true)
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Enter fallback mode with reduced functionality
    async fn fallback_mode(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.enable_simplified_updates(true)
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Request garbage collection
    async fn request_gc(&self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;

        state.clear_unused_caches()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        
        state.cleanup_unused_animations()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        
        state.compact_memory()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Get current performance metrics
    pub async fn get_performance_metrics(&self) -> napi::Result<PerformanceMetrics> {
        let timeline_manager = self.timeline_manager.lock().await;
        let mut metrics = timeline_manager.get_performance_metrics()
            .await
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        
        let state = self.state_manager.lock().await;
        metrics.active_animations = state.get_active_animation_count()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        
        Ok(metrics)
    }

    /// Reset performance metrics
    pub async fn reset_metrics(&mut self) -> napi::Result<()> {
        let timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.reset_metrics()
            .await
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Set garbage collection interval
    pub async fn set_gc_interval(&mut self, interval: std::time::Duration) -> napi::Result<()> {
        let timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.set_gc_interval(interval)
            .await
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    /// Get timeline
    pub async fn get_timeline(&self) -> napi::Result<TimelineManager> {
        let timeline_manager = self.timeline_manager.lock().await;
        Ok(timeline_manager.clone())
    }

    /// Update state
    pub async fn update_state(&mut self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update_positions()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        state.update_positions().await?;
        
        let timeline = self.timeline_manager.lock().await;
        timeline.update(Duration::from_secs_f64(delta_time)).await?;

        Ok(())
    }

    #[napi]
    pub async fn start_animation(&self, id: String, config: AnimationConfig) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.start_animation(id, config).await?;
        Ok(())
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.pause_animation(&id).await?;
        Ok(())
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.resume_animation(&id).await?;
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.stop_animation(&id).await?;
        Ok(())
    }

    /// Update animation metrics
    pub async fn update_animation_metrics(&mut self) -> napi::Result<()> {
        let mut metrics = self.timeline_manager.lock().await;
        metrics.update_metrics()
            .map_err(|e| napi::Error::from_status(napi::Status::GenericFailure).context(e.to_string()))?;
        Ok(())
    }
}

use std::sync::Arc;
use tokio::sync::Mutex;
use napi_derive::napi;
use napi::bindgen_prelude::*;

use crate::state::core::StateManager;
use crate::error::AnimatorError;

mod animation_timeline;
pub use animation_timeline::{TimelineManager, PerformanceMetrics};

#[napi]
pub struct AnimationManager {
    state_manager: Arc<Mutex<StateManager>>,
    timeline_manager: Arc<Mutex<TimelineManager>>,
}

#[napi]
impl AnimationManager {
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> napi::Result<Self> {
        let timeline_manager = Arc::new(Mutex::new(TimelineManager::new(state_manager.clone())));
        
        Ok(Self {
            state_manager,
            timeline_manager,
        })
    }

    pub async fn initialize(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.initialize().await?;
        Ok(())
    }

    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.update(std::time::Duration::from_secs_f64(delta_time)).await?;
        Ok(())
    }

    pub async fn cleanup(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.cleanup().await?;
        Ok(())
    }

    pub async fn pause_all(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.pause_all().await?;
        Ok(())
    }

    pub async fn stop_all(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.stop_all().await?;
        Ok(())
    }

    pub async fn set_reduced_functionality(&self, enabled: bool) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.set_reduced_functionality(enabled).await?;
        Ok(())
    }

    pub async fn set_update_interval_all(&self, interval: f64) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.set_update_interval_all(interval).await?;
        Ok(())
    }

    pub async fn clear_buffers(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.clear_buffers().await?;
        Ok(())
    }

    pub async fn get_performance_metrics(&self) -> napi::Result<PerformanceMetrics> {
        let timeline = self.timeline_manager.lock().await;
        timeline.get_performance_metrics().await
    }

    pub async fn reset_metrics(&self) -> napi::Result<()> {
        let timeline = self.timeline_manager.lock().await;
        timeline.reset_metrics().await?;
        Ok(())
    }

    pub async fn set_gc_interval(&self, interval: f64) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.set_gc_interval(interval)?;
        Ok(())
    }

    pub async fn get_timeline_manager(&self) -> napi::Result<Arc<Mutex<TimelineManager>>> {
        Ok(self.timeline_manager.clone())
    }
}

// Re-exports
pub use types::{AnimationType, AnimationConfig};
pub use animation_group::{AnimationGroup};
pub use animation_timeline::{TimelineManager};
pub use models::Animation;

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tokio::sync::Mutex;

    #[test]
    fn test_animation_engine_creation() {
        let state_manager = Arc::new(Mutex::new(StateManager::new(std::env::current_dir().unwrap().join("state")).unwrap()));
        let engine = AnimationEngine::new(state_manager);
        assert!(engine.is_ok());
    }
}
