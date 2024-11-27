use std::collections::HashSet;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SelectionState {
    selected_tracks: HashSet<String>,
    selected_groups: HashSet<String>,
    selected_animations: HashSet<String>,
}

impl SelectionState {
    pub fn new() -> Self {
        Self::default()
    }

    // Track selection
    pub fn select_track(&mut self, track_id: String) {
        self.selected_tracks.insert(track_id);
    }

    pub fn deselect_track(&mut self, track_id: &str) {
        self.selected_tracks.remove(track_id);
    }

    pub fn clear_track_selection(&mut self) {
        self.selected_tracks.clear();
    }

    pub fn is_track_selected(&self, track_id: &str) -> bool {
        self.selected_tracks.contains(track_id)
    }

    pub fn get_selected_tracks(&self) -> &HashSet<String> {
        &self.selected_tracks
    }

    // Group selection
    pub fn select_group(&mut self, group_id: String) {
        self.selected_groups.insert(group_id);
    }

    pub fn deselect_group(&mut self, group_id: &str) {
        self.selected_groups.remove(group_id);
    }

    pub fn clear_group_selection(&mut self) {
        self.selected_groups.clear();
    }

    pub fn is_group_selected(&self, group_id: &str) -> bool {
        self.selected_groups.contains(group_id)
    }

    pub fn get_selected_groups(&self) -> &HashSet<String> {
        &self.selected_groups
    }

    // Animation selection
    pub fn select_animation(&mut self, animation_id: String) {
        self.selected_animations.insert(animation_id);
    }

    pub fn deselect_animation(&mut self, animation_id: &str) {
        self.selected_animations.remove(animation_id);
    }

    pub fn clear_animation_selection(&mut self) {
        self.selected_animations.clear();
    }

    pub fn is_animation_selected(&self, animation_id: &str) -> bool {
        self.selected_animations.contains(animation_id)
    }

    pub fn get_selected_animations(&self) -> &HashSet<String> {
        &self.selected_animations
    }

    // Clear all selections
    pub fn clear_selection(&mut self) {
        self.selected_tracks.clear();
        self.selected_groups.clear();
        self.selected_animations.clear();
    }
}
