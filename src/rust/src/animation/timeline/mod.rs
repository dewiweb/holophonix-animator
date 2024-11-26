use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{Duration, Instant};
use crate::error::AnimatorResult;
use crate::state::core::StateManager;

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

    pub fn is_playing(&self) -> bool {
        self.is_playing
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

#[derive(Debug)]
pub struct TimelineManager {
    state_manager: Arc<Mutex<StateManager>>,
    timelines: HashMap<String, Arc<Mutex<AnimationTimeline>>>,
    current_time: Duration,
    last_update: Option<Instant>,
}

impl TimelineManager {
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> Self {
        Self {
            state_manager,
            timelines: HashMap::new(),
            current_time: Duration::from_secs(0),
            last_update: None,
        }
    }

    pub async fn add_timeline(&mut self, id: String, duration_ms: u64) -> AnimatorResult<()> {
        self.timelines.insert(id, Arc::new(Mutex::new(AnimationTimeline::new(duration_ms))));
        Ok(())
    }

    pub async fn remove_timeline(&mut self, id: &str) -> AnimatorResult<()> {
        self.timelines.remove(id);
        Ok(())
    }

    pub async fn get_timeline(&self, id: &str) -> AnimatorResult<Option<Arc<Mutex<AnimationTimeline>>>> {
        Ok(self.timelines.get(id).cloned())
    }

    pub async fn play(&mut self, id: &str) -> AnimatorResult<()> {
        if let Some(timeline) = self.timelines.get(id) {
            timeline.lock().await.play();
        }
        Ok(())
    }

    pub async fn pause(&mut self, id: &str) -> AnimatorResult<()> {
        if let Some(timeline) = self.timelines.get(id) {
            timeline.lock().await.pause();
        }
        Ok(())
    }

    pub async fn stop(&mut self, id: &str) -> AnimatorResult<()> {
        if let Some(timeline) = self.timelines.get(id) {
            timeline.lock().await.stop();
        }
        Ok(())
    }

    pub async fn update(&mut self, id: &str) -> AnimatorResult<f64> {
        if let Some(timeline) = self.timelines.get(id) {
            return Ok(timeline.lock().await.update());
        }
        Ok(0.0)
    }
}

#[cfg(test)]
mod tests;
