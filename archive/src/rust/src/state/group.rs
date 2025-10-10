use std::collections::{HashMap, HashSet};
use std::time::Duration;
use crate::state::{Track, TrackRegistry};
use crate::math::vector::Vector3;

/// Represents different ways to specify group members
#[derive(Debug, Clone)]
pub enum GroupPattern {
    All,
    Prefix(String),
    Suffix(String),
    Contains(String),
    Regex(String),
}

/// Defines how tracks in a group relate to each other
#[derive(Debug, Clone)]
pub enum GroupRelation {
    None,
    Follow(String),
    Offset(Vector3),
    Rotate(f64, Vector3),
}

/// Represents a group of tracks with a specific relationship
pub struct Group {
    id: String,
    name: Option<String>,
    pattern: GroupPattern,
    tracks: HashSet<String>,
    relations: HashMap<String, GroupRelation>,
}

impl Group {
    /// Creates a new group with the given ID and pattern
    pub fn new(id: &str, pattern: GroupPattern) -> Self {
        Self {
            id: id.to_string(),
            name: None,
            pattern,
            tracks: HashSet::new(),
            relations: HashMap::new(),
        }
    }

    /// Returns the group's ID
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Returns the name of the group
    pub fn name(&self) -> Option<&str> {
        self.name.as_deref()
    }

    /// Sets the name of the group
    pub fn set_name(&mut self, name: &str) {
        self.name = Some(name.to_string());
    }

    /// Returns the pattern of the group
    pub fn pattern(&self) -> &GroupPattern {
        &self.pattern
    }

    /// Returns the members of the group
    pub fn members(&self) -> &HashSet<String> {
        &self.tracks
    }

    /// Adds a track to the group
    pub fn add_track(&mut self, track_id: String) -> bool {
        self.tracks.insert(track_id)
    }

    /// Removes a track from the group
    pub fn remove_track(&mut self, track_id: &str) -> bool {
        self.tracks.remove(track_id)
    }

    /// Sets the relation of a track in the group
    pub fn set_relation(&mut self, track_id: &str, relation: GroupRelation) {
        self.relations.insert(track_id.to_string(), relation);
    }

    /// Returns the relation of a track in the group
    pub fn get_relation(&self, track_id: &str) -> Option<&GroupRelation> {
        self.relations.get(track_id)
    }

    /// Updates the members of the group based on the pattern
    pub fn update_members(&mut self, registry: &TrackRegistry) {
        let mut new_members = HashSet::new();
        
        for track_id in registry.get_track_ids() {
            match &self.pattern {
                GroupPattern::All => {
                    new_members.insert(track_id.clone());
                }
                GroupPattern::Prefix(prefix) => {
                    if track_id.starts_with(prefix) {
                        new_members.insert(track_id.clone());
                    }
                }
                GroupPattern::Suffix(suffix) => {
                    if track_id.ends_with(suffix) {
                        new_members.insert(track_id.clone());
                    }
                }
                GroupPattern::Contains(pattern) => {
                    if track_id.contains(pattern) {
                        new_members.insert(track_id.clone());
                    }
                }
                GroupPattern::Regex(pattern) => {
                    if let Ok(re) = regex::Regex::new(pattern) {
                        if re.is_match(&track_id) {
                            new_members.insert(track_id.clone());
                        }
                    }
                }
            }
        }

        self.tracks = new_members;
    }

    /// Updates the positions of the group members
    pub fn update_positions(&self, registry: &mut TrackRegistry, time: Duration) {
        for track_id in &self.tracks {
            if let Some(relation) = self.relations.get(track_id) {
                match relation {
                    GroupRelation::None => {},
                    GroupRelation::Follow(target_id) => {
                        if let Some(target) = registry.get_track(target_id) {
                            let target_pos = target.position();
                            registry.update_track_position(track_id, target_pos);
                        }
                    },
                    GroupRelation::Offset(offset) => {
                        if let Some(track) = registry.get_track(track_id) {
                            let pos = if let Some(motion) = track.motion() {
                                motion.calculate_position(time)
                            } else {
                                track.position()
                            };
                            registry.update_track_position(track_id, pos + *offset);
                        }
                    },
                    GroupRelation::Rotate(_angle, _axis) => {
                        // TODO: Implement rotation
                    },
                }
            }
        }
    }

    /// Returns the positions of the group members
    pub fn get_positions(&self, registry: &TrackRegistry, time: Duration) -> Vec<(String, Vector3)> {
        let mut positions = Vec::new();
        for track_id in &self.tracks {
            if let Some(track) = registry.get_track(track_id) {
                let pos = if let Some(motion) = track.motion() {
                    motion.calculate_position(time)
                } else {
                    track.position()
                };
                positions.push((track_id.clone(), pos));
            }
        }
        positions
    }
}

impl Default for Group {
    fn default() -> Self {
        Self::new("default", GroupPattern::All)
    }
}
