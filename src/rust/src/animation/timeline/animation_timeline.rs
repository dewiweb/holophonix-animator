use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use napi_derive::napi;
use napi::bindgen_prelude::*;

use crate::state::core::StateManager;
use crate::common::monitoring::PerformanceMetrics;

#[napi]
#[derive(Clone)]
pub struct TimelineManager {
    state_manager: Arc<Mutex<StateManager>>,
    update_interval: Duration,
    reduced_functionality: bool,
    gc_interval: Duration,
}

#[napi]
impl TimelineManager {
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> Self {
        Self {
            state_manager,
            update_interval: Duration::from_millis(16), // ~60fps
            reduced_functionality: false,
            gc_interval: Duration::from_secs(60),
        }
    }

    pub async fn initialize(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.load_default_state().await?;
        Ok(())
    }

    pub async fn update(&self, delta_time: Duration) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.update_positions().await?;
        Ok(())
    }

    pub async fn cleanup(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.cleanup_resources().await?;
        Ok(())
    }

    pub async fn pause_all(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.invalidate_cache("animation_cache").await?;
        Ok(())
    }

    pub async fn stop_all(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.clear_unused_caches().await?;
        Ok(())
    }

    pub async fn set_reduced_functionality(&mut self, enabled: bool) -> napi::Result<()> {
        self.reduced_functionality = enabled;
        Ok(())
    }

    pub fn set_update_interval(&mut self, interval: f64) -> napi::Result<()> {
        self.update_interval = Duration::from_secs_f64(interval);
        Ok(())
    }

    pub async fn set_update_interval_all(&mut self, interval: f64) -> napi::Result<()> {
        self.set_update_interval(interval)?;
        Ok(())
    }

    pub fn set_gc_interval(&mut self, interval: f64) -> napi::Result<()> {
        self.gc_interval = Duration::from_secs_f64(interval);
        Ok(())
    }

    pub async fn clear_buffers(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.clear_unused_caches().await?;
        Ok(())
    }

    pub async fn get_performance_metrics(&self) -> napi::Result<PerformanceMetrics> {
        let state = self.state_manager.lock().await;
        let active_animations = state.get_active_animation_count().await?;
        
        Ok(PerformanceMetrics {
            active_animations: active_animations as i32,
            update_interval_ms: self.update_interval.as_millis() as i32,
            reduced_functionality: self.reduced_functionality,
        })
    }

    pub async fn reset_metrics(&self) -> napi::Result<()> {
        let state = self.state_manager.lock().await;
        state.reset_locks().await?;
        Ok(())
    }
}

#[napi(object)]
#[derive(Debug)]
pub struct PerformanceMetrics {
    pub active_animations: i32,
    pub update_interval_ms: i32,
    pub reduced_functionality: bool,
}
