use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{Duration, Instant};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use crate::error::AnimatorResult;
use crate::animation::models::Animation;
use crate::models::position::Position;
use crate::state::StateManagerWrapper;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone)]
pub struct AnimationTimeline {
    pub id: String,
    pub name: String,
    pub timeline: Arc<Mutex<HashMap<String, Animation>>>,
    pub is_active: bool,
    pub is_looping: bool,
    pub speed: f64,
    pub current_time: f64,
}

impl ObjectFinalize for AnimationTimeline {}

#[napi]
impl AnimationTimeline {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            timeline: Arc::new(Mutex::new(HashMap::new())),
            is_active: false,
            is_looping: false,
            speed: 1.0,
            current_time: 0.0,
        }
    }

    #[napi]
    pub async fn start(&mut self) -> napi::Result<()> {
        self.is_active = true;
        self.current_time = 0.0;
        Ok(())
    }

    #[napi]
    pub async fn pause(&mut self) -> napi::Result<()> {
        self.is_active = false;
        Ok(())
    }

    #[napi]
    pub async fn resume(&mut self) -> napi::Result<()> {
        self.is_active = true;
        Ok(())
    }

    #[napi]
    pub async fn stop(&mut self) -> napi::Result<()> {
        self.is_active = false;
        self.current_time = 0.0;
        Ok(())
    }

    #[napi]
    pub async fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        let mut timeline = self.timeline.lock().await;
        timeline.insert(animation.id.clone(), animation);
        Ok(())
    }

    #[napi]
    pub async fn remove_animation(&mut self, id: String) -> napi::Result<()> {
        let mut timeline = self.timeline.lock().await;
        timeline.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        let timeline = self.timeline.lock().await;
        Ok(timeline.get(&id).cloned())
    }

    #[napi]
    pub async fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        if !self.is_active {
            return Ok(());
        }

        self.current_time += delta_time * self.speed;
        let mut timeline = self.timeline.lock().await;
        let mut completed_animations = Vec::new();

        for (id, animation) in timeline.iter_mut() {
            if animation.is_running {
                // Calculate normalized progress (0.0 to 1.0)
                let progress = self.current_time / animation.duration;

                if progress >= 1.0 {
                    if animation.is_looping {
                        // Reset time for looping animations
                        self.current_time = 0.0;
                        animation.is_running = true;
                    } else {
                        // Mark non-looping animations as complete
                        completed_animations.push(id.clone());
                        animation.is_running = false;
                    }
                }
            }
        }

        // Remove completed animations if timeline is not looping
        if !self.is_looping {
            for id in completed_animations {
                timeline.remove(&id);
            }

            // Stop timeline if all animations are complete
            if timeline.is_empty() {
                self.is_active = false;
                self.current_time = 0.0;
            }
        }

        Ok(())
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }

    #[napi]
    pub fn set_looping(&mut self, looping: bool) {
        self.is_looping = looping;
    }
}
