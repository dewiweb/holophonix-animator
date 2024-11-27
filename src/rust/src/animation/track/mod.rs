use std::collections::HashMap;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use crate::error::AnimatorError;
use super::path::{AnimationPath, PathPoint, PathConstraints, LoopBehavior, PathType};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Position3D {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub tracks: HashMap<String, Track>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub id: String,
    pub name: String,
    pub path: AnimationPath,
    pub parameters: TrackParameters,
}

impl TrackState {
    pub fn new() -> Self {
        Self {
            tracks: HashMap::new(),
        }
    }

    pub fn add_track(&mut self, id: String, name: String) -> napi::Result<()> {
        let track = Track {
            id: id.clone(),
            name,
            path: AnimationPath::new(PathType::Linear, LoopBehavior::None),
            parameters: TrackParameters::default(),
        };
        self.tracks.insert(id, track);
        Ok(())
    }

    pub fn get_track(&self, id: &str) -> Option<&Track> {
        self.tracks.get(id)
    }

    pub fn get_track_mut(&mut self, id: &str) -> Option<&mut Track> {
        self.tracks.get_mut(id)
    }

    pub fn update_track_parameters(&mut self, id: &str, params: TrackParameters) -> napi::Result<()> {
        if let Some(track) = self.tracks.get_mut(id) {
            track.parameters = params;
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(id.to_string()).into())
        }
    }

    pub fn delete_track(&mut self, id: &str) -> napi::Result<()> {
        if self.tracks.remove(id).is_some() {
            Ok(())
        } else {
            Err(AnimatorError::TrackNotFound(id.to_string()).into())
        }
    }

    pub fn is_empty(&self) -> bool {
        self.tracks.is_empty()
    }
}

impl Default for TrackState {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackParameters {
    pub speed: f64,
    pub loop_enabled: bool,
    pub constraints: PathConstraints,
}

impl Default for TrackParameters {
    fn default() -> Self {
        Self {
            speed: 1.0,
            loop_enabled: false,
            constraints: PathConstraints::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use nalgebra::Point3;

    #[test]
    fn test_track_creation() {
        let mut state = TrackState::new();
        assert!(state.is_empty());

        state.add_track("track1".to_string(), "Test Track".to_string()).unwrap();
        assert!(!state.is_empty());
        
        let track = state.get_track("track1").unwrap();
        assert_eq!(track.name, "Test Track");
        assert_eq!(track.id, "track1");
    }

    #[test]
    fn test_track_parameters() {
        let mut state = TrackState::new();
        state.add_track("track1".to_string(), "Test Track".to_string()).unwrap();

        let params = TrackParameters {
            speed: 2.0,
            loop_enabled: true,
            constraints: PathConstraints::default(),
        };

        state.update_track_parameters("track1", params.clone()).unwrap();
        let track = state.get_track("track1").unwrap();
        assert_eq!(track.parameters.speed, 2.0);
        assert!(track.parameters.loop_enabled);
    }

    #[test]
    fn test_track_path() {
        let mut state = TrackState::new();
        state.add_track("track1".to_string(), "Test Track".to_string()).unwrap();

        let track = state.get_track_mut("track1").unwrap();
        track.path.add_point(PathPoint {
            position: Point3::new(0.0, 0.0, 0.0),
            time: 0.0,
        });
        track.path.add_point(PathPoint {
            position: Point3::new(1.0, 1.0, 1.0),
            time: 1.0,
        });

        let point = track.path.get_point_at_time(0.5).unwrap();
        assert_eq!(point.x, 0.5);
        assert_eq!(point.y, 0.5);
        assert_eq!(point.z, 0.5);
    }
}
