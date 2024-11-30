use napi::bindgen_prelude::*;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::animation::Animation;
use crate::error::{AnimatorError, AnimatorResult};
use crate::position::Position;

// Module declarations
pub mod core;
pub mod models;
pub mod update;
pub mod wrapper;

// Re-exports
pub use core::StateManager;
pub use models::TrackState;

#[napi(object)]
#[derive(Debug, Default)]
pub struct State {
    positions: HashMap<String, Position>,
}

#[napi]
impl State {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[napi]
    pub fn update_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        self.positions.insert(id, position);
        Ok(())
    }

    #[napi]
    pub fn get_position(&self, id: String) -> napi::Result<Option<Position>> {
        Ok(self.positions.get(&id).cloned())
    }

    #[napi]
    pub fn remove_position(&mut self, id: String) -> napi::Result<()> {
        self.positions.remove(&id);
        Ok(())
    }
}

#[napi]
#[derive(Debug, Default)]
pub struct StateManager {
    timeline_manager: Arc<Mutex<TimelineManager>>,
    tracks: Arc<Mutex<HashMap<String, Track>>>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[napi]
    pub async fn create_timeline(&self, id: String, name: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        if manager.has_timeline(&id) {
            return Err(AnimatorError::InvalidState("Timeline already exists".to_string()).into());
        }
        manager.create_timeline(id, name)?;
        Ok(())
    }

    #[napi]
    pub async fn remove_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.remove_timeline(&id)?;
        Ok(())
    }

    #[napi]
    pub async fn start_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.start_timeline(&id)?;
        Ok(())
    }

    #[napi]
    pub async fn stop_timeline(&self, id: String) -> napi::Result<()> {
        let mut manager = self.timeline_manager.lock().await;
        manager.stop_timeline(&id)?;
        Ok(())
    }

    #[napi]
    pub async fn add_track(&self, id: String, name: String) -> napi::Result<()> {
        let mut tracks = self.tracks.lock().await;
        if tracks.contains_key(&id) {
            return Err(AnimatorError::InvalidState("Track already exists".to_string()).into());
        }
        tracks.insert(id.clone(), Track::new(id, name));
        Ok(())
    }

    #[napi]
    pub async fn remove_track(&self, id: String) -> napi::Result<()> {
        let mut tracks = self.tracks.lock().await;
        if !tracks.contains_key(&id) {
            return Err(AnimatorError::TimelineNotFound.into());
        }
        tracks.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn get_track(&self, id: String) -> napi::Result<Option<Track>> {
        let tracks = self.tracks.lock().await;
        Ok(tracks.get(&id).cloned())
    }
}

impl ObjectFinalize for State {}
impl ObjectFinalize for StateManager {}
