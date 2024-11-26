use std::collections::HashMap;
use std::time::Duration;
use serde::{Serialize, Deserialize};

mod duration_ms {
    use serde::{self, Deserialize, Deserializer, Serializer};
    use std::time::Duration;

    pub fn serialize<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64(duration.as_millis() as u64)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let millis = u64::deserialize(deserializer)?;
        Ok(Duration::from_millis(millis))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineMarker {
    #[serde(with = "duration_ms")]
    pub time: Duration,
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: String,
    pub name: String,
    #[serde(with = "duration_ms")]
    pub start_time: Duration,
    #[serde(with = "duration_ms")]
    pub duration: Duration,
    pub track_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Timeline {
    #[serde(with = "duration_ms")]
    pub current_time: Duration,
    #[serde(with = "duration_ms")]
    pub total_duration: Duration,
    pub is_playing: bool,
    pub loop_enabled: bool,
    #[serde(with = "duration_ms")]
    pub loop_start: Duration,
    #[serde(with = "duration_ms")]
    pub loop_end: Duration,
    pub markers: HashMap<String, TimelineMarker>,
    pub events: HashMap<String, TimelineEvent>,
}

impl Timeline {
    pub fn new() -> Self {
        Self::default()
    }

    // Marker-related methods
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

    // Event-related methods
    pub fn add_event(&mut self, event: TimelineEvent) -> bool {
        if self.events.contains_key(&event.id) {
            return false;
        }
        self.events.insert(event.id.clone(), event);
        true
    }

    pub fn remove_event(&mut self, id: &str) -> bool {
        self.events.remove(id).is_some()
    }

    pub fn get_event(&self, id: &str) -> Option<&TimelineEvent> {
        self.events.get(id)
    }

    pub fn get_all_events(&self) -> Vec<&TimelineEvent> {
        self.events.values().collect()
    }

    pub fn get_events_at_time(&self, time: Duration) -> Vec<&TimelineEvent> {
        self.events.values()
            .filter(|e| time >= e.start_time && time <= e.start_time + e.duration)
            .collect()
    }

    // Timeline control methods
    pub fn set_current_time(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn get_current_time(&self) -> Duration {
        self.current_time
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

// Helper functions to convert between Duration and f64
impl Timeline {
    pub fn duration_to_secs(duration: Duration) -> f64 {
        duration.as_secs_f64()
    }

    pub fn secs_to_duration(secs: f64) -> Duration {
        Duration::from_secs_f64(secs)
    }

    pub fn duration_to_ms(duration: Duration) -> u64 {
        duration.as_millis() as u64
    }

    pub fn ms_to_duration(ms: u64) -> Duration {
        Duration::from_millis(ms)
    }

    pub fn set_current_time_ms(&mut self, time_ms: u64) {
        self.current_time = Duration::from_millis(time_ms);
    }

    pub fn get_current_time_ms(&self) -> u64 {
        self.current_time.as_millis() as u64
    }

    pub fn set_total_duration_ms(&mut self, duration_ms: u64) {
        self.total_duration = Duration::from_millis(duration_ms);
    }

    pub fn get_total_duration_ms(&self) -> u64 {
        self.total_duration.as_millis() as u64
    }

    pub fn set_current_time_secs(&mut self, time: f64) {
        self.current_time = Self::secs_to_duration(time);
    }

    pub fn get_current_time_secs(&self) -> f64 {
        Self::duration_to_secs(self.current_time)
    }

    pub fn set_total_duration_secs(&mut self, duration: f64) {
        self.total_duration = Self::secs_to_duration(duration);
    }

    pub fn get_total_duration_secs(&self) -> f64 {
        Self::duration_to_secs(self.total_duration)
    }
}
