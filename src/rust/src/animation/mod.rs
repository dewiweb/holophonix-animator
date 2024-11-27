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
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use crate::state::core::{Position, StateManager};
use crate::animation::timeline::TimelineManager;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub position: Position,
    pub duration: f64,
    pub current_time: f64,
    pub is_playing: bool,
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::new(),
            position: Position::default(),
            duration: 0.0,
            current_time: 0.0,
            is_playing: false,
        }
    }
}

impl ObjectFinalize for Animation {}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String) -> Self {
        Self {
            id,
            position: Position::default(),
            duration: 0.0,
            current_time: 0.0,
            is_playing: false,
        }
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        if self.is_playing {
            self.current_time += delta_time;
            if self.current_time >= self.duration {
                self.current_time = 0.0;
                self.is_playing = false;
            }
        }
        Ok(())
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub frame_time: f64,
    pub update_time: f64,
    pub render_time: f64,
    pub active_animations: u32,
    pub total_memory: u32,
}

impl Default for PerformanceMetrics {
    fn default() -> Self {
        Self {
            frame_time: 0.0,
            update_time: 0.0,
            render_time: 0.0,
            active_animations: 0,
            total_memory: 0,
        }
    }
}

impl ObjectFinalize for PerformanceMetrics {}

#[napi(object)]
#[derive(Debug)]
pub struct AnimationEngine {
    timeline_manager: Arc<Mutex<TimelineManager>>,
    performance_metrics: Arc<Mutex<PerformanceMetrics>>,
}

impl Default for AnimationEngine {
    fn default() -> Self {
        Self {
            timeline_manager: Arc::new(Mutex::new(TimelineManager::default())),
            performance_metrics: Arc::new(Mutex::new(PerformanceMetrics::default())),
        }
    }
}

impl ObjectFinalize for AnimationEngine {}

#[napi]
impl AnimationEngine {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        Ok(Self::default())
    }

    #[napi]
    pub async fn initialize(&self) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.initialize()?;
        Ok(())
    }

    #[napi]
    pub async fn start_animation(&self, id: String, duration: f64, position: Position) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.start_animation(id, crate::models::common::AnimationConfig {
            start_position: Position { x: 0.0, y: 0.0 },
            end_position: Position { x: 0.0, y: 0.0 },
            start_time: 0.0,
            duration,
            easing: "linear".to_string(),
        })?;
        
        let mut metrics = self.performance_metrics.lock().await;
        metrics.active_animations += 1;
        Ok(())
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.pause_animation(id)?;
        Ok(())
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.resume_animation(id)?;
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.stop_animation(id)?;
        
        let mut metrics = self.performance_metrics.lock().await;
        if metrics.active_animations > 0 {
            metrics.active_animations -= 1;
        }
        Ok(())
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.update(delta_time)?;
        
        let mut metrics = self.performance_metrics.lock().await;
        metrics.total_memory = timeline.get_animation_count()? as u32;
        metrics.active_animations = timeline.get_animation_count()? as u32;
        Ok(())
    }

    #[napi]
    pub async fn get_performance_metrics(&self) -> napi::Result<PerformanceMetrics> {
        let metrics = self.performance_metrics.lock().await;
        Ok(PerformanceMetrics {
            active_animations: metrics.active_animations,
            total_memory: metrics.total_memory,
            frame_time: metrics.frame_time,
            update_time: metrics.update_time,
            render_time: metrics.render_time,
        })
    }

    #[napi]
    pub async fn clear_animations(&self) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.clear_animations()?;
        
        let mut metrics = self.performance_metrics.lock().await;
        metrics.active_animations = 0;
        metrics.total_memory = 0;
        Ok(())
    }
}

#[napi(object)]
#[derive(Debug)]
pub struct AnimationManager {
    state_manager: Arc<Mutex<StateManager>>,
    timeline_manager: Arc<Mutex<TimelineManager>>,
}

impl Default for AnimationManager {
    fn default() -> Self {
        let state_manager = Arc::new(Mutex::new(StateManager::default()));
        let timeline_manager = Arc::new(Mutex::new(TimelineManager::default()));
        Self {
            state_manager,
            timeline_manager,
        }
    }
}

impl ObjectFinalize for AnimationManager {}

#[napi]
impl AnimationManager {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        Ok(Self::default())
    }

    #[napi]
    pub async fn initialize(&self) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.initialize()?;
        Ok(())
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.update(delta_time)?;
        Ok(())
    }

    #[napi]
    pub async fn cleanup(&self) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.clear_animations()?;
        Ok(())
    }

    #[napi]
    pub async fn reset(&self) -> napi::Result<()> {
        let mut state = self.state_manager.lock().await;
        let mut timeline = self.timeline_manager.lock().await;
        timeline.clear_animations()?;
        Ok(())
    }

    #[napi]
    pub async fn reset_to_default(&self) -> napi::Result<()> {
        self.reset().await
    }

    #[napi]
    pub async fn start_animation(&self, id: String, config: crate::models::common::AnimationConfig) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.start_animation(id, config)?;
        Ok(())
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.pause_animation(id)?;
        Ok(())
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.resume_animation(id)?;
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline_manager.lock().await;
        timeline.stop_animation(id)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[test]
    async fn test_animation_engine() {
        let engine = AnimationEngine::new().unwrap();
        engine.initialize().await.unwrap();

        // Test animation lifecycle
        let id = "test_animation".to_string();
        let position = Position::new(1.0, 2.0, 3.0);
        engine.start_animation(id.clone(), 1.0, position).await.unwrap();
        engine.pause_animation(id.clone()).await.unwrap();
        engine.resume_animation(id.clone()).await.unwrap();
        engine.stop_animation(id.clone()).await.unwrap();

        // Test performance metrics
        let metrics = engine.get_performance_metrics().await.unwrap();
        assert_eq!(metrics.active_animations, 0);
    }
}
