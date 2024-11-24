use std::collections::HashMap;
use std::time::Duration;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineMarker {
    pub time: Duration,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Timeline {
    pub current_time: Duration,
    pub total_duration: Duration,
    pub is_playing: bool,
    pub loop_enabled: bool,
    pub loop_start: Duration,
    pub loop_end: Duration,
    pub markers: HashMap<String, TimelineMarker>,
}

impl Timeline {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_marker(&mut self, id: String, marker: TimelineMarker) {
        self.markers.insert(id, marker);
    }

    pub fn remove_marker(&mut self, id: &str) -> Option<TimelineMarker> {
        self.markers.remove(id)
    }

    pub fn get_marker(&self, id: &str) -> Option<&TimelineMarker> {
        self.markers.get(id)
    }

    pub fn update_marker(&mut self, id: &str, marker: TimelineMarker) -> bool {
        if self.markers.contains_key(id) {
            self.markers.insert(id.to_string(), marker);
            true
        } else {
            false
        }
    }

    pub fn get_markers_in_range(&self, start: Duration, end: Duration) -> Vec<(&String, &TimelineMarker)> {
        self.markers
            .iter()
            .filter(|(_, marker)| marker.time >= start && marker.time <= end)
            .collect()
    }

    pub fn set_current_time(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn set_total_duration(&mut self, duration: Duration) {
        self.total_duration = duration;
    }

    pub fn set_playing(&mut self, playing: bool) {
        self.is_playing = playing;
    }

    pub fn set_loop(&mut self, enabled: bool, start: Duration, end: Duration) {
        self.loop_enabled = enabled;
        self.loop_start = start;
        self.loop_end = end;
    }

    pub fn update(&mut self, delta: Duration) {
        if !self.is_playing {
            return;
        }

        self.current_time += delta;

        if self.loop_enabled && self.current_time >= self.loop_end {
            self.current_time = self.loop_start;
        } else if self.current_time >= self.total_duration {
            if self.loop_enabled {
                self.current_time = Duration::from_secs(0);
            } else {
                self.is_playing = false;
                self.current_time = self.total_duration;
            }
        }
    }
}
