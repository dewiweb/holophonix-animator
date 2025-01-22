use crate::{
    animation::models::MotionModel,
    math::vector::Vector3,
};
use std::time::Duration;
use std::collections::HashMap;
use std::sync::mpsc::Sender;
use std::fmt;
use parking_lot::RwLock;
use std::collections::BTreeMap;

/// Events that can be emitted by a track
#[derive(Debug, Clone)]
pub enum TrackEvent {
    /// Emitted when the track's position changes
    PositionChanged {
        track_id: String,
        position: Vector3,
    },
    /// Emitted when the track's active state changes
    ActiveStateChanged {
        track_id: String,
        active: bool,
    },
    /// Emitted when an animation is bound to the track
    AnimationBound {
        track_id: String,
    },
    /// Emitted when an animation is unbound from the track
    AnimationUnbound {
        track_id: String,
    },
    /// Emitted when metadata is changed
    MetadataChanged {
        track_id: String,
        key: String,
        value: String,
    },
}

/// Represents a track in the system with its state and properties
#[derive(Clone)]
pub struct Track {
    id: String,
    name: Option<String>,
    position: Vector3,
    metadata: HashMap<String, String>,
    animation: Option<Box<dyn MotionModel + Send + Sync>>,
    event_sender: Option<Sender<TrackEvent>>,
}

impl fmt::Debug for Track {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Track")
            .field("id", &self.id)
            .field("name", &self.name)
            .field("position", &self.position)
            .field("metadata", &self.metadata)
            .finish_non_exhaustive()
    }
}

impl Track {
    /// Creates a new track with the given ID and initial position
    pub fn new(id: &str, initial_position: Vector3) -> Self {
        Track {
            id: id.to_string(),
            name: None,
            position: initial_position,
            metadata: HashMap::new(),
            animation: None,
            event_sender: None,
        }
    }

    /// Subscribe to track events
    pub fn subscribe(&mut self, sender: Sender<TrackEvent>) {
        self.event_sender = Some(sender);
    }

    /// Emit an event if there is a subscriber
    fn emit_event(&self, event: TrackEvent) {
        if let Some(sender) = &self.event_sender {
            let _ = sender.send(event);
        }
    }

    /// Returns the track's unique identifier
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Returns the track's display name
    pub fn name(&self) -> Option<&str> {
        self.name.as_deref()
    }

    /// Sets the track's display name
    pub fn set_name(&mut self, name: &str) {
        self.name = Some(name.to_string());
    }

    /// Returns the track's current position
    pub fn position(&self) -> Vector3 {
        self.position
    }

    /// Returns the track's position at a given time
    pub fn position_at(&self, time: Duration) -> Vector3 {
        if let Some(motion) = &self.animation {
            motion.calculate_position(time)
        } else {
            self.position
        }
    }

    /// Sets the track's current position
    pub fn set_position(&mut self, position: Vector3) {
        self.position = position;
        self.emit_event(TrackEvent::PositionChanged {
            track_id: self.id.clone(),
            position,
        });
    }

    /// Returns a reference to the track's metadata
    pub fn metadata(&self) -> &HashMap<String, String> {
        &self.metadata
    }

    /// Returns the track's metadata value for a given key
    pub fn get_metadata(&self, key: &str) -> Option<&str> {
        self.metadata.get(key).map(|s| s.as_str())
    }

    /// Sets a metadata value
    pub fn set_metadata(&mut self, key: &str, value: &str) {
        self.metadata.insert(key.to_string(), value.to_string());
        self.emit_event(TrackEvent::MetadataChanged {
            track_id: self.id.clone(),
            key: key.to_string(),
            value: value.to_string(),
        });
    }

    /// Removes a metadata value
    pub fn remove_metadata(&mut self, key: &str) {
        self.metadata.remove(key);
    }

    /// Returns a reference to the track's motion if one is bound
    pub fn motion(&self) -> Option<&(dyn MotionModel + Send + Sync)> {
        self.animation.as_deref()
    }

    /// Sets the track's motion
    pub fn set_motion(&mut self, motion: Option<Box<dyn MotionModel + Send + Sync>>) {
        let has_motion = motion.is_some();
        self.animation = motion;
        if has_motion {
            self.emit_event(TrackEvent::AnimationBound {
                track_id: self.id.clone(),
            });
        } else {
            self.emit_event(TrackEvent::AnimationUnbound {
                track_id: self.id.clone(),
            });
        }
    }

    /// Updates the track's position based on its motion
    pub fn update_motion(&mut self, time: Duration) {
        if let Some(motion) = &self.animation {
            self.position = motion.calculate_position(time);
        }
    }
}

impl Default for Track {
    fn default() -> Self {
        Track::new("default", Vector3::zero())
    }
}
