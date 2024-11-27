use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;

use crate::error::AnimatorError;
use super::models::{Position, TrackParameters};

#[derive(Debug, Default)]
pub struct TrackState {
    tracks: Arc<RwLock<HashMap<String, TrackData>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackData {
    pub parameters: TrackParameters,
    pub position: Position,
    pub last_update: f64,
}

impl TrackState {
    pub fn new() -> Self {
        Self {
            tracks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn update_track(&self, id: &str, params: TrackParameters) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        let track = tracks.entry(id.to_string()).or_insert_with(|| TrackData {
            parameters: params.clone(),
            position: Position::default(),
            last_update: 0.0,
        });
        
        track.parameters = params;
        track.last_update = js_sys::Date::now();
        
        Ok(())
    }

    pub async fn update_position(&self, id: &str, position: Position) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        if let Some(track) = tracks.get_mut(id) {
            track.position = position;
            track.last_update = js_sys::Date::now();
            Ok(())
        } else {
            Err(AnimatorError::state_error(
                format!("Track not found: {}", id)
            ).into())
        }
    }

    pub async fn get_track(&self, id: &str) -> Result<Option<TrackData>> {
        let tracks = self.tracks.read().await;
        Ok(tracks.get(id).cloned())
    }

    pub async fn remove_track(&self, id: &str) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        tracks.remove(id);
        Ok(())
    }

    pub async fn clear_all(&self) -> Result<()> {
        let mut tracks = self.tracks.write().await;
        tracks.clear();
        Ok(())
    }
}

#[napi]
impl TrackState {
    #[napi(constructor)]
    pub fn create() -> Self {
        Self::new()
    }

    #[napi]
    pub async fn update(&self, id: String, params: TrackParameters) -> Result<()> {
        self.update_track(&id, params).await
    }

    #[napi]
    pub async fn update_position(&self, id: String, position: Position) -> Result<()> {
        self.update_position(&id, position).await
    }

    #[napi]
    pub async fn get(&self, id: String) -> Result<Option<TrackData>> {
        self.get_track(&id).await
    }

    #[napi]
    pub async fn remove(&self, id: String) -> Result<()> {
        self.remove_track(&id).await
    }

    #[napi]
    pub async fn clear(&self) -> Result<()> {
        self.clear_all().await
    }
}
