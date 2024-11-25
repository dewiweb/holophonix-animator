use std::collections::HashMap;
use crate::osc::types::TrackParameters;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Track {
    pub id: String,
    pub name: String,
    pub position: (f32, f32),  // x, y coordinates
    pub active: bool,
}

#[derive(Default, Serialize, Deserialize)]
pub struct TrackState {
    tracks: HashMap<String, Track>,
}

impl TrackState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_track(&mut self, id: String, name: String, position: (f32, f32)) -> bool {
        if self.tracks.contains_key(&id) {
            return false;
        }

        self.tracks.insert(id.clone(), Track {
            id,
            name,
            position,
            active: true,
        });
        true
    }

    pub fn remove_track(&mut self, id: &str) -> bool {
        self.tracks.remove(id).is_some()
    }

    pub fn get_track(&self, id: &str) -> Option<&Track> {
        self.tracks.get(id)
    }

    pub fn get_track_mut(&mut self, id: &str) -> Option<&mut Track> {
        self.tracks.get_mut(id)
    }

    pub fn update_position(&mut self, id: &str, position: (f32, f32)) -> bool {
        if let Some(track) = self.tracks.get_mut(id) {
            track.position = position;
            true
        } else {
            false
        }
    }

    pub fn set_active(&mut self, id: &str, active: bool) -> bool {
        if let Some(track) = self.tracks.get_mut(id) {
            track.active = active;
            true
        } else {
            false
        }
    }

    pub fn get_all_tracks(&self) -> Vec<&Track> {
        self.tracks.values().collect()
    }

    pub fn get_active_tracks(&self) -> Vec<&Track> {
        self.tracks.values().filter(|t| t.active).collect()
    }

    pub fn update_track(&mut self, track_id: String, parameters: Track) {
        self.tracks.insert(track_id, parameters);
    }

    pub fn get_track_parameters(&self, track_id: &str) -> Option<&Track> {
        self.tracks.get(track_id)
    }

    pub fn get_all_tracks_parameters(&self) -> Vec<(String, Track)> {
        self.tracks.iter()
            .map(|(id, params)| (id.clone(), params.clone()))
            .collect()
    }
}
