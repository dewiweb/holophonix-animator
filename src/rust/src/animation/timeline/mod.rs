use std::collections::HashMap;
use napi::{Error, Result};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use std::sync::Arc;

use crate::animation::{Animation, AnimatorError, AnimatorResult, Position};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineState {
    pub name: String,
    pub active_count: i32,
    pub paused_count: i32,
}

#[napi]
#[derive(Debug)]
pub struct Timeline {
    name: String,
    animations: Arc<Mutex<HashMap<String, Animation>>>,
    paused_animations: Arc<Mutex<HashMap<String, Animation>>>,
}

#[napi]
impl Timeline {
    #[napi(constructor)]
    pub fn new(name: String) -> Self {
        Self {
            name,
            animations: Arc::new(Mutex::new(HashMap::new())),
            paused_animations: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    #[napi]
    pub async fn add_animation(&self, animation: Animation) -> Result<()> {
        let id = animation.get_id();
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        if animations.contains_key(&id) || paused.contains_key(&id) {
            return Err(Error::from_reason(format!("Animation {} already exists", id)));
        }
        animations.insert(id, animation);
        Ok(())
    }

    #[napi]
    pub async fn remove_animation(&self, id: String) -> Result<()> {
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        if animations.remove(&id).is_none() && paused.remove(&id).is_none() {
            return Err(Error::from_reason(format!("Animation {} not found", id)));
        }
        Ok(())
    }

    #[napi]
    pub async fn start_animation(&self, id: String) -> Result<()> {
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        // Check if animation is paused
        if let Some(mut animation) = paused.remove(&id) {
            animation.start().await?;
            animations.insert(id, animation);
            return Ok(());
        }

        // Otherwise start from animations map
        if let Some(animation) = animations.get_mut(&id) {
            animation.start().await?;
            Ok(())
        } else {
            Err(Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> Result<()> {
        let mut animations = self.animations.lock().await;
        if let Some(animation) = animations.get_mut(&id) {
            animation.stop().await?;
            Ok(())
        } else {
            Err(Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> Result<()> {
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        if let Some(mut animation) = animations.remove(&id) {
            animation.pause().await?;
            paused.insert(id, animation);
            Ok(())
        } else {
            Err(Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> Result<()> {
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        if let Some(mut animation) = paused.remove(&id) {
            animation.resume().await?;
            animations.insert(id, animation);
            Ok(())
        } else {
            Err(Error::from_reason(format!("Animation {} not found", id)))
        }
    }

    #[napi]
    pub async fn update(&self, time: f64) -> Result<HashMap<String, Position>> {
        let mut animations = self.animations.lock().await;
        let mut positions = HashMap::new();
        let mut completed = Vec::new();

        for (id, animation) in animations.iter_mut() {
            match animation.update(time).await {
                Ok(position) => {
                    positions.insert(id.clone(), position);
                    if animation.is_complete() {
                        completed.push(id.clone());
                    }
                }
                Err(e) => {
                    completed.push(id.clone());
                    eprintln!("Error updating animation {}: {}", id, e);
                }
            }
        }

        // Remove completed animations
        for id in completed {
            animations.remove(&id);
        }

        Ok(positions)
    }

    #[napi]
    pub async fn get_state(&self) -> Result<TimelineState> {
        let animations = self.animations.lock().await;
        let paused = self.paused_animations.lock().await;

        Ok(TimelineState {
            name: self.name.clone(),
            active_count: animations.len() as i32,
            paused_count: paused.len() as i32,
        })
    }

    #[napi]
    pub async fn clear(&self) -> Result<()> {
        let mut animations = self.animations.lock().await;
        let mut paused = self.paused_animations.lock().await;

        for animation in animations.values_mut() {
            animation.stop().await?;
        }
        animations.clear();
        paused.clear();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::runtime::Runtime;

    #[test]
    fn test_timeline() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let timeline = Timeline::new("test".to_string());
            
            // Test adding animation
            let animation = Animation::new("test".to_string());
            timeline.add_animation(animation).await.unwrap();
            
            let state = timeline.get_state().await.unwrap();
            assert_eq!(state.active_count, 1);
            assert_eq!(state.paused_count, 0);

            // Test pausing animation
            timeline.pause_animation("test".to_string()).await.unwrap();
            let state = timeline.get_state().await.unwrap();
            assert_eq!(state.active_count, 0);
            assert_eq!(state.paused_count, 1);

            // Test resuming animation
            timeline.resume_animation("test".to_string()).await.unwrap();
            let state = timeline.get_state().await.unwrap();
            assert_eq!(state.active_count, 1);
            assert_eq!(state.paused_count, 0);

            // Test stopping animation
            timeline.stop_animation("test".to_string()).await.unwrap();
            let state = timeline.get_state().await.unwrap();
            assert_eq!(state.active_count, 1);
            assert_eq!(state.paused_count, 0);

            // Test clearing timeline
            timeline.clear().await.unwrap();
            let state = timeline.get_state().await.unwrap();
            assert_eq!(state.active_count, 0);
            assert_eq!(state.paused_count, 0);
        });
    }
}
