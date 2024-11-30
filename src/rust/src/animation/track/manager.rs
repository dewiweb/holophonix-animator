use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use crate::error::AnimatorError;
use super::{Track, TrackParameters};

#[napi]
pub struct TrackManager {
    tracks: Arc<RwLock<HashMap<String, Track>>>,
}

#[napi]
impl TrackManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            tracks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[napi]
    pub fn add_track(&self, parameters: TrackParameters) -> napi::Result<()> {
        let track = Track::new(parameters.clone());
        let mut tracks = self.tracks.write().map_err(|_| {
            AnimatorError::LockError("Failed to acquire write lock for tracks".to_string())
        })?;
        
        tracks.insert(parameters.id, track);
        Ok(())
    }

    #[napi]
    pub fn get_track(&self, id: String) -> napi::Result<Option<Track>> {
        let tracks = self.tracks.read().map_err(|_| {
            AnimatorError::LockError("Failed to acquire read lock for tracks".to_string())
        })?;
        
        Ok(tracks.get(&id).cloned())
    }

    #[napi]
    pub fn update_track(&self, id: String, track: Track) -> napi::Result<()> {
        let mut tracks = self.tracks.write().map_err(|_| {
            AnimatorError::LockError("Failed to acquire write lock for tracks".to_string())
        })?;

        if tracks.contains_key(&id) {
            tracks.insert(id, track);
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(id).into())
        }
    }

    #[napi]
    pub fn delete_track(&self, id: String) -> napi::Result<()> {
        let mut tracks = self.tracks.write().map_err(|_| {
            AnimatorError::LockError("Failed to acquire write lock for tracks".to_string())
        })?;

        if tracks.remove(&id).is_some() {
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(id).into())
        }
    }

    #[napi]
    pub fn get_track_ids(&self) -> napi::Result<Vec<String>> {
        let tracks = self.tracks.read().map_err(|_| {
            AnimatorError::LockError("Failed to acquire read lock for tracks".to_string())
        })?;
        
        Ok(tracks.keys().cloned().collect())
    }
}

impl ObjectFinalize for TrackManager {}
