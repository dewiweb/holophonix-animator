use std::collections::HashMap;
use crate::osc::types::{TrackParameters, OSCConfig, TrackState};

pub struct AppState {
    pub osc_config: OSCConfig,
    pub track_states: HashMap<String, TrackState>,
}

impl AppState {
    pub fn new(config: OSCConfig) -> Self {
        Self {
            osc_config: config,
            track_states: HashMap::new(),
        }
    }

    pub fn update_track_state(&mut self, track_id: String, params: TrackParameters) {
        let track_state = TrackState {
            track_id: track_id.clone(),
            parameters: params,
        };
        self.track_states.insert(track_id, track_state);
    }

    pub fn get_track_state(&self, track_id: &str) -> Option<&TrackState> {
        self.track_states.get(track_id)
    }
}
