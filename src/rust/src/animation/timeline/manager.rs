use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use crate::animation::models::Animation;
use crate::error::AnimatorResult;

use super::AnimationTimeline as Timeline;

#[napi]
#[derive(Debug, Clone)]
pub struct TimelineManager {
    #[napi(skip)]
    timelines: Arc<Mutex<HashMap<String, Timeline>>>,
}

impl ObjectFinalize for TimelineManager {}

#[napi]
impl TimelineManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            timelines: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    #[napi]
    pub async fn create_timeline(&self, id: String, name: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        let timeline = Timeline::new(id.clone(), name);
        timelines.insert(id, timeline);
        Ok(())
    }

    #[napi]
    pub async fn get_timeline(&self, id: String) -> napi::Result<Option<Timeline>> {
        let timelines = self.timelines.lock().await;
        Ok(timelines.get(&id).cloned())
    }

    #[napi]
    pub async fn remove_timeline(&self, id: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        timelines.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn start_timeline(&self, id: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        if let Some(timeline) = timelines.get_mut(&id) {
            timeline.start().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn pause_timeline(&self, id: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        if let Some(timeline) = timelines.get_mut(&id) {
            timeline.pause().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn resume_timeline(&self, id: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        if let Some(timeline) = timelines.get_mut(&id) {
            timeline.resume().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn stop_timeline(&self, id: String) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        if let Some(timeline) = timelines.get_mut(&id) {
            timeline.stop().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn add_animation(&self, timeline_id: String, animation: Animation) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        if let Some(timeline) = timelines.get_mut(&timeline_id) {
            timeline.add_animation(animation).await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn update(&self, delta_time: f64) -> napi::Result<()> {
        let mut timelines = self.timelines.lock().await;
        for timeline in timelines.values_mut() {
            timeline.update(delta_time).await?;
        }
        Ok(())
    }
}
