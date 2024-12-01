// Standard library imports
use std::{
    sync::{Arc},
    time::{Duration, Instant},
    collections::HashMap,
};
use serde::{Serialize, Deserialize};
use napi_derive::napi;
use tokio::sync::Mutex;

use crate::{Position, error::{AnimatorResult, AnimatorError}};

// Module declarations
pub mod models;
pub mod timeline;
pub mod plugin;

// Re-exports from models
pub use models::{Animation, AnimationConfig, AnimationType};
pub use timeline::Timeline;
pub use plugin::AnimationPlugin;

#[derive(Debug, Clone)]
pub struct AnimationEngine {
    animations: Arc<Mutex<HashMap<String, models::Animation>>>,
    groups: Arc<Mutex<HashMap<String, Vec<String>>>>,
}

impl AnimationEngine {
    pub fn new() -> Self {
        Self {
            animations: Arc::new(Mutex::new(HashMap::new())),
            groups: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn add_animation<S: AsRef<str>>(&self, id: S, animation: models::Animation) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await;
        animations.insert(id.as_ref().to_string(), animation);
        Ok(())
    }

    pub async fn add_to_group<S1: Into<String>, S2: Into<String>>(&self, group_id: S1, animation_id: S2, animation: models::Animation) -> AnimatorResult<()> {
        let group_id = group_id.into();
        let animation_id = animation_id.into();
        
        self.add_animation(&animation_id, animation).await?;
        
        let mut groups = self.groups.lock().await;
        groups.entry(group_id)
            .or_insert_with(Vec::new)
            .push(animation_id);
            
        Ok(())
    }

    pub async fn start<S: AsRef<str>>(&self, id: S) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await;
        if let Some(animation) = animations.get_mut(id.as_ref()) {
            animation.start()?;
            Ok(())
        } else {
            Err(AnimatorError::IOError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Animation {} not found", id.as_ref())
            )))
        }
    }

    pub async fn start_group<S: AsRef<str>>(&self, group_id: S) -> AnimatorResult<()> {
        let groups = self.groups.lock().await;
        if let Some(animations) = groups.get(group_id.as_ref()) {
            for id in animations {
                self.start(id).await?;
            }
            Ok(())
        } else {
            Err(AnimatorError::IOError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Group {} not found", group_id.as_ref())
            )))
        }
    }

    pub async fn get_position<S: AsRef<str>>(&self, id: S) -> AnimatorResult<Position> {
        let animations = self.animations.lock().await;
        if let Some(animation) = animations.get(id.as_ref()) {
            Ok(animation.current_position.clone())
        } else {
            Err(AnimatorError::IOError(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Animation {} not found", id.as_ref())
            )))
        }
    }
}

#[napi]
pub struct AnimationManager {
    #[napi(skip)]
    engine: Arc<Mutex<AnimationEngine>>,
    #[napi(skip)]
    animations: Arc<Mutex<HashMap<String, models::Animation>>>,
}

#[napi]
impl AnimationManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            engine: Arc::new(Mutex::new(AnimationEngine::new())),
            animations: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    #[napi]
    pub async fn add_animation(&self, id: String, animation: models::Animation) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await;
        animations.insert(id, animation);
        Ok(())
    }

    #[napi]
    pub async fn remove_animation(&self, id: &str) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await;
        animations.remove(id);
        Ok(())
    }

    #[napi]
    pub async fn get_animation(&self, id: &str) -> AnimatorResult<Option<models::Animation>> {
        let animations = self.animations.lock().await;
        Ok(animations.get(id).cloned())
    }

    #[napi]
    pub async fn update_all(&self, dt: f64) -> AnimatorResult<()> {
        let mut animations = self.animations.lock().await;
        for animation in animations.values_mut() {
            if animation.is_running {
                animation.update(dt)?;
            }
        }
        Ok(())
    }

    #[napi]
    pub async fn add_animation_to_engine(&self, id: String, animation: models::Animation) -> AnimatorResult<()> {
        let engine = self.engine.lock().await;
        engine.add_animation(id, animation).await
    }

    #[napi]
    pub async fn add_to_group(&self, group_id: String, animation_id: String, animation: models::Animation) -> AnimatorResult<()> {
        let engine = self.engine.lock().await;
        engine.add_to_group(group_id, animation_id, animation).await
    }

    #[napi]
    pub async fn start(&self, id: String) -> AnimatorResult<()> {
        let engine = self.engine.lock().await;
        engine.start(id).await
    }

    #[napi]
    pub async fn start_group(&self, group_id: String) -> AnimatorResult<()> {
        let engine = self.engine.lock().await;
        engine.start_group(group_id).await
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> AnimatorResult<Position> {
        let engine = self.engine.lock().await;
        engine.get_position(id).await
    }
}
