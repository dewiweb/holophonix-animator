use crate::error::Result;
use crate::Position;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[napi(object)]
#[derive(Clone)]
pub struct TrackState {
    pub id: String,
    pub name: String,
    pub position: Position,
    pub is_active: bool,
}

#[napi]
pub struct StateManager {
    tracks: Arc<RwLock<HashMap<String, TrackState>>>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            tracks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[napi]
    pub async fn add_track(&self, track: TrackState) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        tracks.insert(track.id.clone(), track);
        Ok(())
    }

    #[napi]
    pub async fn remove_track(&self, track_id: String) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        tracks.remove(&track_id);
        Ok(())
    }

    #[napi]
    pub async fn update_track_position(&self, track_id: String, position: Position) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        if let Some(track) = tracks.get_mut(&track_id) {
            track.position = position;
        }
        Ok(())
    }

    #[napi]
    pub async fn get_track(&self, track_id: String) -> Result<Option<TrackState>> {
        let tracks = self.tracks.read().await;
        Ok(tracks.get(&track_id).cloned())
    }

    #[napi]
    pub async fn get_all_tracks(&self) -> Result<Vec<TrackState>> {
        let tracks = self.tracks.read().await;
        Ok(tracks.values().cloned().collect())
    }

    #[napi]
    pub async fn set_track_active(&self, track_id: String, active: bool) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        if let Some(track) = tracks.get_mut(&track_id) {
            track.is_active = active;
        }
        Ok(())
    }
}
