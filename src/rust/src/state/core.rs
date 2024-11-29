mod sync;
mod persistence;

pub use sync::{StateSync, StateChange, ChangeNotification};
pub use persistence::{StatePersistence, StateSnapshot};

use std::collections::HashMap;
use std::f64::consts::PI;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use crate::animation::models::{
    Animation, 
    LinearParams,
    CircularParams,
    interpolate_position,
    calculate_circular_position
};
use crate::models::position::Position;
use crate::models::color::Color;
use crate::state::models::TrackState;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

// Coordinate conversion functions
fn aed_to_xyz(azim: f64, elev: f64, dist: f64) -> (f64, f64, f64) {
    let azim_rad = azim * PI / 180.0;
    let elev_rad = elev * PI / 180.0;
    let x = dist * azim_rad.cos() * elev_rad.cos();
    let y = dist * azim_rad.sin() * elev_rad.cos();
    let z = dist * elev_rad.sin();
    (x, y, z)
}

#[napi(object)]
#[derive(Debug, Deserialize, Serialize)]
pub struct StateManager {
    pub positions: HashMap<String, Position>,
    pub animations: HashMap<String, Animation>,
    pub track_states: HashMap<String, TrackState>,
    #[napi(skip)]
    pub save_dir: PathBuf,
    #[napi(skip)]
    pub subscribers: Arc<Mutex<Vec<String>>>,
}

impl ObjectFinalize for StateManager {}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new(initial_state: Option<String>) -> napi::Result<Self> {
        let save_dir = initial_state.map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."));
        Ok(Self {
            positions: HashMap::new(),
            animations: HashMap::new(),
            track_states: HashMap::new(),
            save_dir,
            subscribers: Arc::new(Mutex::new(Vec::new())),
        })
    }

    #[napi]
    pub fn add_animation(&mut self, id: String, animation: Animation) -> napi::Result<()> {
        self.animations.insert(id, animation);
        Ok(())
    }

    #[napi]
    pub fn get_animation(&self, id: String) -> Option<Animation> {
        self.animations.get(&id).cloned()
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        // Update all active animations
        let mut completed_animations = Vec::new();
        
        for (id, animation) in self.animations.iter_mut() {
            if animation.is_running {
                // Update position based on animation progress
                if let Some(track_state) = self.track_states.get_mut(&id) {
                    // Calculate progress (0.0 to 1.0)
                    let progress = (animation.speed * delta_time) / animation.duration;
                    
                    // Update position based on model type and parameters
                    match animation.model_type.as_str() {
                        "linear" => {
                            if let Ok(params) = serde_json::from_value::<LinearParams>(animation.model_params.clone()) {
                                let new_pos = interpolate_position(&track_state.position, &params.end_pos, progress);
                                track_state.position = new_pos;
                            }
                        }
                        "circular" => {
                            if let Ok(params) = serde_json::from_value::<CircularParams>(animation.model_params.clone()) {
                                let new_pos = calculate_circular_position(&params, progress);
                                track_state.position = new_pos;
                            }
                        }
                        _ => {}
                    }
                    
                    // Check if animation is complete
                    if progress >= 1.0 {
                        if animation.is_looping {
                            // Reset progress for looping animations
                            animation.is_running = true;
                        } else {
                            // Mark non-looping animations as complete
                            completed_animations.push(id.clone());
                        }
                    }
                }
            }
        }
        
        // Remove completed animations
        for id in completed_animations {
            self.animations.remove(&id);
        }
        
        Ok(())
    }

    #[napi]
    pub fn remove_animation(&mut self, id: String) -> napi::Result<()> {
        self.animations.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn update_position(&mut self, id: String, x: f64, y: f64, z: f64) -> napi::Result<()> {
        let position = Position { x, y, z };
        self.positions.insert(id, position);
        Ok(())
    }

    #[napi]
    pub fn get_position(&self, id: String) -> Option<Position> {
        self.positions.get(&id).cloned()
    }

    #[napi]
    pub fn get_state(&self) -> napi::Result<Vec<TrackState>> {
        let mut states = Vec::new();
        for (id, position) in &self.positions {
            let animation = self.animations.get(id).cloned();
            states.push(TrackState {
                id: id.clone(),
                position: position.clone(),
                animation: animation,
                color: None,
                gain: None,
                mute: None,
                active: true,
            });
        }
        Ok(states)
    }

    // Individual Coordinates
    #[napi]
    pub fn update_x(&mut self, id: String, value: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.x = value;
        } else {
            self.positions.insert(id, Position { x: value, y: 0.0, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn update_y(&mut self, id: String, value: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.y = value;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: value, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn update_z(&mut self, id: String, value: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.z = value;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: 0.0, z: value });
        }
        Ok(())
    }

    #[napi]
    pub fn update_azimuth(&mut self, id: String, value: f64) -> napi::Result<()> {
        // Normalize azimuth to 0-360°
        let azim = value % 360.0;
        let azim = if azim < 0.0 { azim + 360.0 } else { azim };
        
        // Convert AED to XYZ
        if let Some(pos) = self.positions.get(&id) {
            let elev = pos.elev().unwrap_or(0.0);
            let dist = pos.dist().unwrap_or(1.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let (x, y, z) = aed_to_xyz(azim, 0.0, 1.0);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    #[napi]
    pub fn update_elevation(&mut self, id: String, value: f64) -> napi::Result<()> {
        // Clamp elevation to -90 to 90°
        let elev = value.max(-90.0).min(90.0);
        
        // Convert AED to XYZ
        if let Some(pos) = self.positions.get(&id) {
            let azim = pos.azim().unwrap_or(0.0);
            let dist = pos.dist().unwrap_or(1.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let (x, y, z) = aed_to_xyz(0.0, elev, 1.0);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    #[napi]
    pub fn update_distance(&mut self, id: String, value: f64) -> napi::Result<()> {
        // Ensure non-negative distance
        let dist = value.max(0.0);
        
        // Convert AED to XYZ
        if let Some(pos) = self.positions.get(&id) {
            let azim = pos.azim().unwrap_or(0.0);
            let elev = pos.elev().unwrap_or(0.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let (x, y, z) = aed_to_xyz(0.0, 0.0, dist);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    // Coordinate Pairs
    #[napi]
    pub fn update_xy(&mut self, id: String, x: f64, y: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.x = x;
            pos.y = y;
        } else {
            self.positions.insert(id, Position { x, y, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn update_ae(&mut self, id: String, azim: f64, elev: f64) -> napi::Result<()> {
        // Normalize azimuth and clamp elevation
        let azim = azim % 360.0;
        let azim = if azim < 0.0 { azim + 360.0 } else { azim };
        let elev = elev.max(-90.0).min(90.0);
        
        // Convert AED to XYZ using current distance or default
        if let Some(pos) = self.positions.get(&id) {
            let dist = pos.dist().unwrap_or(1.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let (x, y, z) = aed_to_xyz(azim, elev, 1.0);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    // Relative Movement
    #[napi]
    pub fn increment_x(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.x += delta;
        } else {
            self.positions.insert(id, Position { x: delta, y: 0.0, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_x(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.x -= delta;
        } else {
            self.positions.insert(id, Position { x: -delta, y: 0.0, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn increment_y(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.y += delta;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: delta, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_y(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.y -= delta;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: -delta, z: 0.0 });
        }
        Ok(())
    }

    #[napi]
    pub fn increment_z(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.z += delta;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: 0.0, z: delta });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_z(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.z -= delta;
        } else {
            self.positions.insert(id, Position { x: 0.0, y: 0.0, z: -delta });
        }
        Ok(())
    }

    #[napi]
    pub fn increment_azimuth(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get(&id) {
            let azim = pos.azim().unwrap_or(0.0) + delta;
            let azim = azim % 360.0;
            let azim = if azim < 0.0 { azim + 360.0 } else { azim };
            let elev = pos.elev().unwrap_or(0.0);
            let dist = pos.dist().unwrap_or(1.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let azim = delta % 360.0;
            let azim = if azim < 0.0 { azim + 360.0 } else { azim };
            let (x, y, z) = aed_to_xyz(azim, 0.0, 1.0);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_azimuth(&mut self, id: String, delta: f64) -> napi::Result<()> {
        self.increment_azimuth(id, -delta)
    }

    #[napi]
    pub fn increment_elevation(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get(&id) {
            let elev = (pos.elev().unwrap_or(0.0) + delta).max(-90.0).min(90.0);
            let azim = pos.azim().unwrap_or(0.0);
            let dist = pos.dist().unwrap_or(1.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let elev = delta.max(-90.0).min(90.0);
            let (x, y, z) = aed_to_xyz(0.0, elev, 1.0);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_elevation(&mut self, id: String, delta: f64) -> napi::Result<()> {
        self.increment_elevation(id, -delta)
    }

    #[napi]
    pub fn increment_distance(&mut self, id: String, delta: f64) -> napi::Result<()> {
        if let Some(pos) = self.positions.get(&id) {
            let dist = (pos.dist().unwrap_or(1.0) + delta).max(0.0);
            let azim = pos.azim().unwrap_or(0.0);
            let elev = pos.elev().unwrap_or(0.0);
            let (x, y, z) = aed_to_xyz(azim, elev, dist);
            self.positions.insert(id, Position { x, y, z });
        } else {
            let dist = delta.max(0.0);
            let (x, y, z) = aed_to_xyz(0.0, 0.0, dist);
            self.positions.insert(id, Position { x, y, z });
        }
        Ok(())
    }

    #[napi]
    pub fn decrement_distance(&mut self, id: String, delta: f64) -> napi::Result<()> {
        self.increment_distance(id, -delta)
    }

    // Audio Properties
    #[napi]
    pub fn update_gain(&mut self, id: String, value: f64) -> napi::Result<()> {
        // Clamp gain to -60 to +12 dB
        let gain = value.max(-60.0).min(12.0);
        if let Some(state) = self.track_states.get_mut(&id) {
            state.gain = Some(gain);
        } else {
            let mut state = TrackState::default();
            state.id = id.clone();
            state.gain = Some(gain);
            self.track_states.insert(id, state);
        }
        Ok(())
    }

    #[napi]
    pub fn update_mute(&mut self, id: String, value: bool) -> napi::Result<()> {
        if let Some(state) = self.track_states.get_mut(&id) {
            state.mute = Some(value);
        } else {
            let mut state = TrackState::default();
            state.id = id.clone();
            state.mute = Some(value);
            self.track_states.insert(id, state);
        }
        Ok(())
    }

    // Visual Properties
    #[napi]
    pub fn update_color(&mut self, id: String, r: f64, g: f64, b: f64, a: f64) -> napi::Result<()> {
        // Clamp color values to 0.0-1.0
        let color = Color {
            r: r.max(0.0).min(1.0),
            g: g.max(0.0).min(1.0),
            b: b.max(0.0).min(1.0),
            a: a.max(0.0).min(1.0),
        };
        if let Some(state) = self.track_states.get_mut(&id) {
            state.color = Some(color);
        } else {
            let mut state = TrackState::default();
            state.id = id.clone();
            state.color = Some(color);
            self.track_states.insert(id, state);
        }
        Ok(())
    }
}

impl Default for StateManager {
    fn default() -> Self {
        Self {
            positions: HashMap::new(),
            animations: HashMap::new(),
            track_states: HashMap::new(),
            save_dir: PathBuf::from("."),
            subscribers: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_state_manager() -> napi::Result<()> {
        let mut manager = StateManager::default();

        // Test adding and retrieving animations
        let animation = Animation {
            id: "test".to_string(),
            duration: 1.0,
            model_type: "linear".to_string(),
            model_params: serde_json::Value::Null,
        };

        manager.add_animation("test".to_string(), animation.clone())?;
        let retrieved = manager.get_animation("test".to_string());
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().id, "test");

        // Test updating and retrieving positions
        manager.update_position("test".to_string(), 1.0, 2.0, 3.0)?;
        let position = manager.get_position("test".to_string());
        assert!(position.is_some());
        let position = position.unwrap();
        assert_eq!(position.x, 1.0);
        assert_eq!(position.y, 2.0);
        assert_eq!(position.z, 3.0);

        // Test getting state
        let states = manager.get_state()?;
        assert_eq!(states.len(), 1);
        let state = &states[0];
        assert_eq!(state.id, "test");
        assert_eq!(state.position.x, 1.0);
        assert_eq!(state.position.y, 2.0);
        assert_eq!(state.position.z, 3.0);
        assert!(state.animation.is_some());
        assert_eq!(state.animation.as_ref().unwrap().id, "test");

        Ok(())
    }
}
