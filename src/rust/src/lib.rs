#[macro_use]
extern crate napi_derive;

use napi::bindgen_prelude::*;
use std::sync::Arc;
use tokio::sync::Mutex;

// Re-exports
pub mod animation;
pub mod bridge;
pub mod common;
pub mod error;
pub mod models;
pub mod osc;
pub mod performance;
pub mod state;
pub mod utils;

// Re-export core types
pub use animation::models::Animation;
pub use models::position::{Position, Position3D};
pub use models::common::AnimationConfig;
pub use osc::types::{CartesianCoordinates, PolarCoordinates, TrackParameters};
pub use error::{AnimatorError, AnimatorResult};
pub use state::{StateManager, StateUpdate};

// Re-export managers
pub use animation::timeline::AnimationTimeline;
pub use animation::timeline::manager::TimelineManager;
pub use performance::PerformanceMetrics;

// Public exports
pub use osc::types::{OSCError, OSCErrorType};

// Error handling
mod error;

#[napi]
pub struct Animator {
    #[napi(skip)]
    pub state_manager: Arc<Mutex<state::core::StateManager>>,
    #[napi(skip)]
    pub timeline_manager: Arc<Mutex<TimelineManager>>,
    #[napi(skip)]
    pub performance_metrics: Arc<Mutex<performance::PerformanceMetrics>>,
}

impl ObjectFinalize for Animator {}

#[napi]
impl Animator {
    #[napi(constructor)]
    pub fn new(state_dir: Option<String>) -> napi::Result<Self> {
        Ok(Self {
            state_manager: Arc::new(Mutex::new(state::core::StateManager::new(state_dir)?)),
            timeline_manager: Arc::new(Mutex::new(TimelineManager::new())),
            performance_metrics: Arc::new(Mutex::new(performance::PerformanceMetrics::new())),
        })
    }

    #[napi]
    pub async fn create_timeline(&self, id: String, name: String) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.create_timeline(id, name).await
    }

    #[napi]
    pub async fn start_timeline(&self, id: String) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.start_timeline(id).await
    }

    #[napi]
    pub async fn pause_timeline(&self, id: String) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.pause_timeline(id).await
    }

    #[napi]
    pub async fn resume_timeline(&self, id: String) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.resume_timeline(id).await
    }

    #[napi]
    pub async fn stop_timeline(&self, id: String) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.stop_timeline(id).await
    }

    #[napi]
    pub async fn add_animation(&self, timeline_id: String, animation: Animation) -> napi::Result<()> {
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.add_animation(timeline_id, animation).await
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        // Update timeline animations
        let mut timeline_manager = self.timeline_manager.lock().await;
        timeline_manager.update(delta_time).await?;

        // Update state manager
        let mut state_manager = self.state_manager.lock().await;
        state_manager.update(delta_time)?;

        // Update performance metrics
        let mut metrics = self.performance_metrics.lock().await;
        metrics.record_frame_time(delta_time);

        Ok(())
    }

    #[napi]
    pub async fn get_state(&self) -> napi::Result<Vec<state::models::TrackState>> {
        let state_manager = self.state_manager.lock().await;
        state_manager.get_state()
    }

    #[napi]
    pub async fn update_position(&self, id: String, x: f64, y: f64, z: f64) -> napi::Result<()> {
        let mut state_manager = self.state_manager.lock().await;
        state_manager.update_position(id, x, y, z)
    }
}
