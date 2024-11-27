use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{Duration, Instant};
use crate::error::AnimatorResult;
use crate::models::common::{Animation, AnimationConfig, Position};
use crate::state::StateManagerWrapper;
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[derive(Debug)]
pub struct AnimationTimeline {
    start_time: Option<Instant>,
    duration_ms: u64,
    is_playing: bool,
    current_time_ms: u64,
}

impl AnimationTimeline {
    pub fn new(duration_ms: u64) -> Self {
        Self {
            start_time: None,
            duration_ms,
            is_playing: false,
            current_time_ms: 0,
        }
    }

    pub fn play(&mut self) {
        if !self.is_playing {
            self.start_time = Some(Instant::now());
            self.is_playing = true;
        }
    }

    pub fn pause(&mut self) {
        if self.is_playing {
            if let Some(start) = self.start_time {
                self.current_time_ms += Instant::now().duration_since(start).as_millis() as u64;
            }
            self.is_playing = false;
            self.start_time = None;
        }
    }

    pub fn stop(&mut self) {
        self.is_playing = false;
        self.start_time = None;
        self.current_time_ms = 0;
    }

    pub fn update(&mut self) -> f64 {
        if self.is_playing {
            if let Some(start) = self.start_time {
                let elapsed = self.current_time_ms + Instant::now().duration_since(start).as_millis() as u64;
                if elapsed >= self.duration_ms {
                    self.stop();
                    return 1.0;
                }
                return elapsed as f64 / self.duration_ms as f64;
            }
        }
        self.current_time_ms as f64 / self.duration_ms as f64
    }
}

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::Instant;
use crate::models::common::{Position, Animation, AnimationConfig};
use crate::state::core::StateManager;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timeline {
    pub id: String,
    pub name: String,
    pub active: bool,
    pub metadata: HashMap<String, String>,
    pub duration: f64,
    pub current_time: f64,
    pub loop_enabled: bool,
    pub track_ids: Vec<String>,
    pub is_playing: bool,
}

impl Default for Timeline {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            active: false,
            metadata: HashMap::new(),
            duration: 0.0,
            current_time: 0.0,
            loop_enabled: false,
            track_ids: Vec::new(),
            is_playing: false,
        }
    }
}

impl ObjectFinalize for Timeline {}

#[napi]
impl Timeline {
    #[napi(constructor)]
    pub fn new(id: String) -> Self {
        Self {
            id,
            name: String::new(),
            active: false,
            metadata: HashMap::new(),
            duration: 0.0,
            current_time: 0.0,
            loop_enabled: false,
            track_ids: Vec::new(),
            is_playing: false,
        }
    }

    #[napi]
    pub fn start(&mut self) {
        self.is_playing = true;
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_playing = false;
    }

    #[napi]
    pub fn reset(&mut self) {
        self.current_time = 0.0;
        self.is_playing = false;
    }

    #[napi]
    pub async fn update(&mut self, delta_time: f64) -> Result<f64> {
        if self.is_playing {
            self.current_time += delta_time;
            if self.current_time >= self.duration {
                if self.loop_enabled {
                    self.current_time = 0.0;
                } else {
                    self.stop();
                }
            }
        }
        Ok(self.current_time)
    }
}

#[napi]
#[derive(Debug)]
pub struct TimelineManager {
    #[napi(skip)]
    pub state_manager: Arc<Mutex<StateManager>>,
    #[napi(skip)]
    pub timelines: HashMap<String, Timeline>,
}

impl Default for TimelineManager {
    fn default() -> Self {
        Self {
            state_manager: Arc::new(Mutex::new(StateManager::default())),
            timelines: HashMap::new(),
        }
    }
}

#[napi]
impl TimelineManager {
    #[napi(constructor)]
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> Self {
        Self {
            state_manager,
            timelines: HashMap::new(),
        }
    }

    #[napi]
    pub async unsafe fn add_timeline(&mut self, timeline: Timeline) -> napi::Result<()> {
        self.timelines.insert(timeline.id.clone(), timeline);
        Ok(())
    }

    #[napi]
    pub async fn get_timeline(&self, id: String) -> napi::Result<Option<Timeline>> {
        Ok(self.timelines.get(&id).cloned())
    }

    #[napi]
    pub async unsafe fn remove_timeline(&mut self, id: String) -> napi::Result<()> {
        self.timelines.remove(&id);
        Ok(())
    }

    #[napi]
    pub async unsafe fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        for timeline in self.timelines.values_mut() {
            timeline.update(delta_time).await?;
        }
        Ok(())
    }

    #[napi]
    pub fn get_all_timelines(&self) -> napi::Result<Vec<Timeline>> {
        Ok(self.timelines.values().cloned().collect())
    }

    #[napi]
    pub async fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        let mut state_manager = self.state_manager.lock().await;
        state_manager.add_animation(animation)?;
        Ok(())
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        let state_manager = self.state_manager.lock().await;
        state_manager.get_animation(id)
    }

    #[napi]
    pub async fn remove_animation(&mut self, id: String) -> napi::Result<()> {
        let mut state_manager = self.state_manager.lock().await;
        state_manager.remove_animation(id)?;
        Ok(())
    }

    #[napi]
    pub async fn get_animation_count(&self) -> napi::Result<i32> {
        let state_manager = self.state_manager.lock().await;
        state_manager.get_animation_count()
    }

    #[napi]
    pub async fn get_all_animations(&self) -> napi::Result<Vec<Animation>> {
        let state_manager = self.state_manager.lock().await;
        Ok(state_manager.get_all_animations()?.into_iter().map(|(_, animation)| animation).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::runtime::Runtime;
    use crate::models::common::{Position, Animation, AnimationConfig};

    #[test]
    fn test_timeline() {
        let mut timeline = Timeline::new("test".to_string());
        assert_eq!(timeline.id, "test");
        assert_eq!(timeline.current_time, 0.0);
        assert!(!timeline.is_playing);

        timeline.start();
        assert!(timeline.is_playing);

        timeline.stop();
        assert!(!timeline.is_playing);
    }

    #[test]
    fn test_timeline_manager() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let mut manager = TimelineManager::default();
            let timeline = Timeline::new("test".to_string());
            unsafe { manager.add_timeline(timeline).await.unwrap(); }

            let timeline = manager.get_timeline("test".to_string()).await.unwrap();
            assert!(timeline.is_some());
            assert_eq!(timeline.unwrap().id, "test");
        });
    }
}
