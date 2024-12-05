use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};

use crate::animation::models::Position;
use crate::error::{AnimatorError, AnimatorResult};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: String,
    pub position: Position,
    pub animation: Option<String>, // ID of the currently playing animation
}

impl TrackState {
    pub fn new(id: impl Into<String>, position: Position) -> Self {
        Self {
            id: id.into(),
            position,
            animation: None,
        }
    }
}

#[napi]
pub struct StateManager {
    tracks: Arc<Mutex<HashMap<String, TrackState>>>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            tracks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn add_track(&self, id: impl Into<String>, position: Position) -> AnimatorResult<()> {
        let mut tracks = self.tracks.lock().await;
        let id = id.into();
        if tracks.contains_key(&id) {
            return Err(AnimatorError::DuplicateTrack(id));
        }
        tracks.insert(id.clone(), TrackState::new(id, position));
        Ok(())
    }

    pub async fn remove_track(&self, id: &str) -> AnimatorResult<()> {
        let mut tracks = self.tracks.lock().await;
        if !tracks.contains_key(id) {
            return Err(AnimatorError::TrackNotFound(id.to_string()));
        }
        tracks.remove(id);
        Ok(())
    }

    pub async fn get_track(&self, id: &str) -> AnimatorResult<TrackState> {
        let tracks = self.tracks.lock().await;
        tracks.get(id)
            .cloned()
            .ok_or_else(|| AnimatorError::TrackNotFound(id.to_string()))
    }

    pub async fn update_track_position(&self, id: &str, position: Position) -> AnimatorResult<()> {
        let mut tracks = self.tracks.lock().await;
        if let Some(track) = tracks.get_mut(id) {
            track.position = position;
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(id.to_string()))
        }
    }

    pub async fn set_track_animation(&self, track_id: &str, animation_id: Option<String>) -> AnimatorResult<()> {
        let mut tracks = self.tracks.lock().await;
        if let Some(track) = tracks.get_mut(track_id) {
            track.animation = animation_id;
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(track_id.to_string()))
        }
    }

    pub async fn get_all_tracks(&self) -> AnimatorResult<Vec<TrackState>> {
        let tracks = self.tracks.lock().await;
        Ok(tracks.values().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_track_lifecycle() {
        let state = StateManager::new();
        let pos = Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

        // Test adding track
        assert!(state.add_track("test", pos).await.is_ok());
        assert!(state.add_track("test", pos).await.is_err());

        // Test getting track
        let track = state.get_track("test").await.unwrap();
        assert_eq!(track.id, "test");
        assert_eq!(track.position.x, 0.0);

        // Test updating position
        let new_pos = Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0);
        assert!(state.update_track_position("test", new_pos).await.is_ok());

        // Test removing track
        assert!(state.remove_track("test").await.is_ok());
        assert!(state.remove_track("test").await.is_err());
    }
}
