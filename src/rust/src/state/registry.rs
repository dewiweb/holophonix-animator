use std::collections::HashMap;
use std::time::Duration;
use crate::animation::models::MotionModel;
use crate::math::vector::Vector3;
use crate::state::Track;

/// Registry managing all tracks in the system
#[derive(Debug)]
pub struct TrackRegistry {
    tracks: HashMap<String, Track>,
}

impl TrackRegistry {
    /// Creates a new empty track registry
    pub fn new() -> Self {
        TrackRegistry {
            tracks: HashMap::new(),
        }
    }
    
    /// Returns whether a track with the given ID exists
    pub fn has_track(&self, id: &str) -> bool {
        self.tracks.contains_key(id)
    }
    
    /// Returns the number of tracks in the registry
    pub fn track_count(&self) -> usize {
        self.tracks.len()
    }
    
    /// Adds a track to the registry
    /// Returns true if the track was added, false if a track with the same ID already exists
    pub fn add_track(&mut self, track_id: String) -> bool {
        if self.tracks.contains_key(&track_id) {
            return false;
        }
        
        let track = Track::new(&track_id, Vector3::zero());
        self.tracks.insert(track_id.clone(), track);
        true
    }
    
    /// Removes a track from the registry by its ID
    /// Returns true if the track was removed, false if it didn't exist
    pub fn remove_track(&mut self, track_id: &str) -> bool {
        self.tracks.remove(track_id).is_some()
    }
    
    /// Gets an immutable reference to a track by its ID
    pub fn get_track(&self, id: &str) -> Option<&Track> {
        self.tracks.get(id)
    }
    
    /// Gets a mutable reference to a track by its ID
    pub fn get_track_mut(&mut self, id: &str) -> Option<&mut Track> {
        self.tracks.get_mut(id)
    }
    
    /// Returns an iterator over all track IDs
    pub fn track_ids(&self) -> impl Iterator<Item = &String> {
        self.tracks.keys()
    }
    
    /// Returns an iterator over all tracks
    pub fn tracks(&self) -> impl Iterator<Item = &Track> {
        self.tracks.values()
    }
    
    /// Returns a mutable iterator over all tracks
    pub fn tracks_mut(&mut self) -> impl Iterator<Item = &mut Track> {
        self.tracks.values_mut()
    }
    
    /// Offsets the position of all tracks by the given vector
    pub fn offset_all_positions(&mut self, offset: Vector3) {
        for track in self.tracks.values_mut() {
            track.set_position(track.position() + offset);
        }
    }
    
    /// Updates the position of a track by its ID
    pub fn update_track_position(&mut self, track_id: &str, position: Vector3) -> bool {
        if let Some(track) = self.tracks.get_mut(track_id) {
            track.set_position(position);
            true
        } else {
            false
        }
    }
    
    /// Binds an animation to a track by its ID
    pub fn bind_animation(&mut self, track_id: &str, motion: Box<dyn MotionModel + Send + Sync>) -> bool {
        if let Some(track) = self.tracks.get_mut(track_id) {
            track.set_motion(Some(motion));
            true
        } else {
            false
        }
    }
    
    /// Updates the animation of a track by its ID
    pub fn update_animation(&mut self, track_id: &str, time: Duration) -> bool {
        if let Some(track) = self.tracks.get_mut(track_id) {
            track.update_motion(time);
            true
        } else {
            false
        }
    }
    
    /// Sets metadata for a track by its ID
    pub fn set_track_metadata(&mut self, track_id: &str, key: &str, value: &str) -> bool {
        if let Some(track) = self.tracks.get_mut(track_id) {
            track.set_metadata(key, value);
            true
        } else {
            false
        }
    }
    
    /// Returns a vector of all track IDs
    pub fn get_track_ids(&self) -> Vec<String> {
        self.tracks.keys().cloned().collect()
    }
    
    /// Returns a vector of all track positions
    pub fn get_track_positions(&self) -> Vec<(String, Vector3)> {
        self.tracks
            .iter()
            .map(|(id, track)| (id.clone(), track.position()))
            .collect()
    }
    
    /// Returns an iterator over all tracks
    pub fn iter(&self) -> impl Iterator<Item = (&String, &Track)> {
        self.tracks.iter()
    }
    
    /// Returns a mutable iterator over all tracks
    pub fn iter_mut(&mut self) -> impl Iterator<Item = (&String, &mut Track)> {
        self.tracks.iter_mut()
    }
    
    /// Updates the position of all tracks by the given vector
    pub fn update_all_positions(&mut self, offset: Vector3) {
        for track in self.tracks.values_mut() {
            track.set_position(track.position() + offset);
        }
    }
}

impl Default for TrackRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_registry_default() {
        let registry = TrackRegistry::default();
        assert_eq!(registry.track_count(), 0);
    }
}
