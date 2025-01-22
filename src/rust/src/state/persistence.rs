use crate::state::{Track, TrackRegistry};
use crate::animation::motion::{LinearMotion, CircularMotion, CircularPlane};
use crate::animation::models::MotionModel;
use crate::math::vector::Vector3;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::Duration;
use std::any::Any;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackData {
    pub id: String,
    pub name: Option<String>,
    pub position: Vector3,
    pub metadata: HashMap<String, String>,
    pub animation: Option<AnimationData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AnimationData {
    Linear {
        start: Vector3,
        end: Vector3,
        duration: Duration,
    },
    Circular {
        center: Vector3,
        radius: f64,
        frequency: f64,
        plane: String,
    },
}

impl TrackData {
    pub fn from_track(track: &Track) -> Self {
        let animation = if let Some(motion) = track.motion() {
            if let Some(linear) = motion.as_any().downcast_ref::<LinearMotion>() {
                Some(AnimationData::Linear {
                    start: linear.start(),
                    end: linear.end(),
                    duration: linear.duration(),
                })
            } else if let Some(circular) = motion.as_any().downcast_ref::<CircularMotion>() {
                Some(AnimationData::Circular {
                    center: circular.center(),
                    radius: circular.radius(),
                    frequency: circular.frequency(),
                    plane: format!("{:?}", circular.plane()),
                })
            } else {
                None
            }
        } else {
            None
        };

        Self {
            id: track.id().to_string(),
            name: track.name().map(String::from),
            position: track.position(),
            metadata: track.metadata().clone(),
            animation,
        }
    }

    pub fn to_track(&self) -> Track {
        let mut track = Track::new(&self.id, self.position);
        
        if let Some(name) = &self.name {
            track.set_name(name);
        }

        for (key, value) in &self.metadata {
            track.set_metadata(key, value);
        }

        if let Some(animation) = &self.animation {
            match animation {
                AnimationData::Linear { start, end, duration } => {
                    let motion = Box::new(LinearMotion::new(*start, *end, *duration));
                    track.set_motion(Some(motion));
                }
                AnimationData::Circular { center, radius, frequency, plane } => {
                    let motion = Box::new(CircularMotion::new(
                        *center,
                        *radius,
                        *frequency,
                        plane.parse().unwrap_or_default(),
                    ));
                    track.set_motion(Some(motion));
                }
            }
        }

        track
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StateData {
    tracks: Vec<TrackData>,
}

impl StateData {
    pub fn from_registry(registry: &TrackRegistry) -> Self {
        Self {
            tracks: registry.tracks().map(TrackData::from_track).collect(),
        }
    }
}

pub fn save_state<P: AsRef<Path>>(path: P, registry: &TrackRegistry) -> std::io::Result<()> {
    let state = StateData::from_registry(registry);
    let json = serde_json::to_string_pretty(&state)?;
    fs::write(path, json)
}

pub fn load_state<P: AsRef<Path>>(path: P) -> std::io::Result<TrackRegistry> {
    let json = fs::read_to_string(path)?;
    let state: StateData = serde_json::from_str(&json)?;
    let mut registry = TrackRegistry::new();

    for track_data in state.tracks {
        let track = track_data.to_track();
        registry.add_track(track.id().to_string());
        
        if let Some(track_mut) = registry.get_track_mut(track.id()) {
            // Restore position
            track_mut.set_position(track.position());
            
            // Restore metadata
            for (key, value) in track.metadata() {
                track_mut.set_metadata(key, value);
            }
            
            // Restore animation if present
            track_mut.set_motion(track.motion().map(|m| {
                if let Some(linear) = m.as_any().downcast_ref::<LinearMotion>() {
                    Box::new(LinearMotion::new(
                        linear.start(),
                        linear.end(),
                        linear.duration(),
                    )) as Box<dyn MotionModel + Send + Sync>
                } else if let Some(circular) = m.as_any().downcast_ref::<CircularMotion>() {
                    Box::new(CircularMotion::new(
                        circular.center(),
                        circular.radius(),
                        circular.frequency(),
                        circular.plane(),
                    )) as Box<dyn MotionModel + Send + Sync>
                } else {
                    panic!("Unknown motion type")
                }
            }));
        }
    }

    Ok(registry)
}
