// Standard library imports
use std::{
    collections::HashMap,
    sync::Arc,
    time::Duration,
};
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::error::{AnimatorError, AnimatorResult};

pub mod engine;
pub mod models;
pub mod timeline;
pub mod plugin;

// Re-export public types and traits
pub use models::{
    Animation,
    AnimationState,
    TimelineState,
    Position,
    Keyframe,
    AnimationType,
    AnimationModel,
    AnimationConfig,
};
pub use engine::AnimationEngine;
pub use plugin::AnimationPlugin;

#[napi]
#[derive(Debug)]
pub struct AnimationManager {
    engine: Arc<Mutex<AnimationEngine>>,
}

#[napi]
impl AnimationManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            engine: Arc::new(Mutex::new(AnimationEngine::new())),
        }
    }

    pub async fn create_animation(
        &self,
        keyframes: Vec<Keyframe>,
        duration: Duration,
    ) -> AnimatorResult<String> {
        let mut engine = self.engine.lock().await;
        let id = Uuid::new_v4().to_string();
        let animation = Animation::new(id.clone(), keyframes, duration);
        engine.add_animation(id.clone(), animation)?;
        Ok(id)
    }

    pub async fn remove_animation(&self, animation_id: &str) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.remove_animation(animation_id)
    }

    pub async fn get_animation(&self, animation_id: &str) -> AnimatorResult<Animation> {
        let engine = self.engine.lock().await;
        engine.get_animation(animation_id).cloned()
    }

    pub async fn update(&self, dt: Duration) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.update(dt)
    }

    pub async fn create_group(&self) -> AnimatorResult<String> {
        let mut engine = self.engine.lock().await;
        let id = Uuid::new_v4().to_string();
        engine.add_group(id.clone())?;
        Ok(id)
    }

    pub async fn remove_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.remove_group(group_id)
    }

    pub async fn add_to_group(
        &self,
        group_id: &str,
        animation_id: &str,
    ) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.add_to_group(group_id, animation_id)
    }

    pub async fn remove_from_group(
        &self,
        group_id: &str,
        animation_id: &str,
    ) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.remove_from_group(group_id, animation_id)
    }

    pub async fn start_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.start_group(group_id)
    }

    pub async fn stop_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.stop_group(group_id)
    }

    pub async fn pause_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut engine = self.engine.lock().await;
        engine.pause_group(group_id)
    }
}

#[napi]
#[derive(Debug, Clone)]
pub struct AnimationGroup {
    id: String,
    animations: HashMap<String, Animation>,
}

impl AnimationGroup {
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            animations: HashMap::new(),
        }
    }

    pub fn add_animation(
        &mut self,
        animation_id: impl Into<String>,
        animation: Animation,
    ) -> AnimatorResult<()> {
        let id = animation_id.into();
        if self.animations.contains_key(&id) {
            return Err(AnimatorError::DuplicateAnimation(id));
        }
        self.animations.insert(id, animation);
        Ok(())
    }

    pub fn remove_animation(&mut self, animation_id: &str) -> AnimatorResult<()> {
        if !self.animations.contains_key(animation_id) {
            return Err(AnimatorError::AnimationNotFound(animation_id.to_string()));
        }
        self.animations.remove(animation_id);
        Ok(())
    }

    pub fn get_animation(&self, animation_id: &str) -> AnimatorResult<&Animation> {
        self.animations
            .get(animation_id)
            .ok_or_else(|| AnimatorError::AnimationNotFound(animation_id.to_string()))
    }

    pub fn get_animation_mut(&mut self, animation_id: &str) -> AnimatorResult<&mut Animation> {
        self.animations
            .get_mut(animation_id)
            .ok_or_else(|| AnimatorError::AnimationNotFound(animation_id.to_string()))
    }
}
