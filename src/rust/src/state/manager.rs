use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};

use crate::animation::AnimationType;
use crate::osc::types::TrackParameters;
use crate::state::{TrackState, AnimationState, GroupState, TimelineState};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateManager {
    save_dir: PathBuf,
    tracks: Vec<TrackState>,
    animations: Vec<AnimationState>,
    groups: Vec<GroupState>,
    timeline: TimelineState,
    subscribers: Arc<Mutex<Vec<String>>>,
}

impl StateManager {
    pub fn new(save_dir: PathBuf) -> Self {
        Self {
            save_dir,
            tracks: Vec::new(),
            animations: Vec::new(),
            groups: Vec::new(),
            timeline: TimelineState::default(),
            subscribers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn track_state(&mut self) -> &mut Vec<TrackState> {
        &mut self.tracks
    }

    pub fn animation_state(&mut self) -> &mut Vec<AnimationState> {
        &mut self.animations
    }

    pub fn group_state(&mut self) -> &mut Vec<GroupState> {
        &mut self.groups
    }

    pub fn timeline_state(&mut self) -> &mut TimelineState {
        &mut self.timeline
    }

    pub fn notify_track_change(&mut self, track_id: String) {
        // Implementation for track change notification
    }

    pub fn notify_animation_change(&mut self, anim_id: String) {
        // Implementation for animation change notification
    }

    pub fn update_track_position(&mut self, track_id: String, position: (f64, f64)) -> Result<(), String> {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.position = (position.0, position.1, 0.0);
            Ok(())
        } else {
            Err("Track not found".to_string())
        }
    }
}
