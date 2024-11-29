// Module declarations
pub mod models;
pub mod timeline;
pub mod group;
pub mod track;
pub mod path;
pub mod plugin;
pub mod cycle;
pub mod interpolation;

// Re-exports
pub use models::Animation;
pub use models::easing::EasingFunction;
pub use models::linear::LinearModel;
pub use models::circular::CircularModel;
pub use models::pattern::PatternModel;
pub use models::custom_path::CustomPathModel;
pub use timeline::AnimationTimeline;
pub use track::TrackState;
pub use path::Path;
pub use group::AnimationGroup;
pub use plugin::Plugin;

// Type imports
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

// Internal imports
use crate::models::position::Position;
use crate::error::{AnimatorError, AnimatorResult};

#[napi(object)]
#[derive(Debug, Clone)]
pub struct AnimationConfig {
    pub id: String,
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub easing: Option<String>,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct Animation {
    pub id: String,
    pub config: AnimationConfig,
    pub is_active: bool,
    pub is_looping: bool,
    pub speed: f64,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String) -> Self {
        Animation {
            id,
            config: AnimationConfig {
                id: String::new(),
                start_position: Position::default(),
                end_position: Position::default(),
                duration: 0.0,
                easing: None,
            },
            is_active: false,
            is_looping: false,
            speed: 1.0,
        }
    }

    #[napi]
    pub fn set_config(&mut self, config: AnimationConfig) {
        self.config = config;
    }

    #[napi]
    pub fn start(&mut self) {
        self.is_active = true;
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_active = false;
    }

    #[napi]
    pub fn set_looping(&mut self, looping: bool) {
        self.is_looping = looping;
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }
}

#[napi(object)]
pub struct AnimationManager {
    animations: HashMap<String, Animation>,
}

#[napi]
impl AnimationManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        AnimationManager {
            animations: HashMap::new(),
        }
    }

    #[napi]
    pub fn add_animation(&mut self, animation: Animation) -> bool {
        if self.animations.contains_key(&animation.id) {
            false
        } else {
            self.animations.insert(animation.id.clone(), animation);
            true
        }
    }

    #[napi]
    pub fn remove_animation(&mut self, id: String) -> bool {
        self.animations.remove(&id).is_some()
    }

    #[napi]
    pub fn get_animation(&self, id: String) -> Option<Animation> {
        self.animations.get(&id).cloned()
    }

    #[napi]
    pub fn get_animations(&self) -> Vec<Animation> {
        self.animations.values().cloned().collect()
    }

    #[napi]
    pub fn start_animation(&mut self, id: String) -> napi::Result<()> {
        if let Some(animation) = self.animations.get_mut(&id) {
            animation.start();
            Ok(())
        } else {
            Err(napi::Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub fn stop_animation(&mut self, id: String) -> napi::Result<()> {
        if let Some(animation) = self.animations.get_mut(&id) {
            animation.stop();
            Ok(())
        } else {
            Err(napi::Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub fn set_animation_looping(&mut self, id: String, looping: bool) -> napi::Result<()> {
        if let Some(animation) = self.animations.get_mut(&id) {
            animation.set_looping(looping);
            Ok(())
        } else {
            Err(napi::Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub fn set_animation_speed(&mut self, id: String, speed: f64) -> napi::Result<()> {
        if let Some(animation) = self.animations.get_mut(&id) {
            animation.set_speed(speed);
            Ok(())
        } else {
            Err(napi::Error::from_reason(format!("Animation {} not found", id)))
        }
    }
}

#[napi]
pub struct AnimationEngine {
    timeline_manager: Arc<Mutex<TimelineManager>>,
}

#[napi]
impl AnimationEngine {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            timeline_manager: Arc::new(Mutex::new(TimelineManager::new())),
        }
    }

    #[napi]
    pub async fn create_timeline(&self, id: String, name: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.create_timeline(id, name)
    }

    #[napi]
    pub async fn get_timeline(&self, id: String) -> napi::Result<Option<Timeline>> {
        let manager = self.timeline_manager.lock().await;
        manager.get_timeline(id)
    }

    #[napi]
    pub async fn remove_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.remove_timeline(id)
    }

    #[napi]
    pub async fn start_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.start_timeline(id)
    }

    #[napi]
    pub async fn pause_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.pause_timeline(id)
    }

    #[napi]
    pub async fn resume_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.resume_timeline(id)
    }

    #[napi]
    pub async fn stop_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.stop_timeline(id)
    }

    #[napi]
    pub async fn create_animation(
        &self,
        timeline_id: String,
        animation_id: String,
        start_pos: Position,
        end_pos: Position,
        duration: f64,
    ) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        let timeline = manager.get_timeline(timeline_id.clone())?.ok_or_else(|| Error::from_reason("Timeline not found"))?;
        let animation = Animation::new(animation_id.clone(), start_pos, end_pos, duration);
        timeline.add_animation(animation_id, animation)?;
        Ok(())
    }

    #[napi]
    pub fn update(&self, delta_time: f64) -> napi::Result<()> {
        if let Ok(mut manager) = self.timeline_manager.try_lock() {
            manager.update(delta_time)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_animation_engine() {
        let engine = AnimationEngine::new();

        // Test creating a timeline
        engine.create_timeline("test".to_string(), "Test Timeline".to_string()).await.unwrap();

        // Test creating an animation
        engine.create_animation(
            "test".to_string(),
            "test_anim".to_string(),
            Position::new(0.0, 0.0, 0.0),
            Position::new(1.0, 1.0, 1.0),
            1.0,
        ).await.unwrap();

        // Test timeline operations
        engine.start_timeline("test".to_string()).await.unwrap();
        engine.pause_timeline("test".to_string()).await.unwrap();
        engine.resume_timeline("test".to_string()).await.unwrap();
        engine.stop_timeline("test".to_string()).await.unwrap();

        // Test update
        engine.update(0.016).unwrap();
    }
}
