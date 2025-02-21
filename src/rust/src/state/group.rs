use std::collections::{HashMap, HashSet};
use std::time::Duration;
use crate::state::TrackRegistry;
use rand::Rng;
use crate::math::vector::Vector3;

/// Represents different ways to specify group members
#[derive(Debug, Clone)]
pub enum GroupPattern {
    All,
    Pattern(String),
    List(Vec<String>),
}

/// Defines how tracks in a group relate to each other
#[derive(Debug, Clone)]
pub enum GroupRelation {
    None,
    Follow(String),
    Offset(Vector3),
    Rotate {
        angle: f64,
        axis: Vector3,
        center: Option<Vector3>,
    },
    Phase(f64), // Phase offset in degrees for cyclic animations
    Isobarycentric {
        reference_distance: Option<f64>, // If None, use initial distances
        maintain_plane: bool, // If true, maintain the plane formed by the points
    },
}

/// A group of tracks with a specific relationship between them
#[derive(Clone)]
pub struct Group {
    name: String,
    pattern: GroupPattern,
    tracks: HashSet<String>,
    relations: HashMap<String, GroupRelation>,
    scale_factor: f64,
    speed_factor: f64,
    time_offset: Duration,
}

impl Group {
    /// Creates a new group with the given name and pattern
    pub fn new(name: &str, pattern: GroupPattern) -> Self {
        Group {
            name: name.to_string(),
            pattern,
            tracks: HashSet::new(),
            relations: HashMap::new(),
            scale_factor: 1.0,
            speed_factor: 1.0,
            time_offset: Duration::from_secs(0),
        }
    }

    /// Gets the name of the group
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Gets the pattern used to match tracks
    pub fn pattern(&self) -> &GroupPattern {
        &self.pattern
    }

    /// Gets the tracks in this group
    pub fn tracks(&self) -> &HashSet<String> {
        &self.tracks
    }

    /// Gets the relation for a track
    pub fn relation(&self, track_id: &str) -> Option<&GroupRelation> {
        self.relations.get(track_id)
    }

    /// Sets the relation for a track
    pub fn set_relation(&mut self, track_id: &str, relation: GroupRelation) {
        self.relations.insert(track_id.to_string(), relation);
    }

    /// Gets the group-wide scale factor
    pub fn scale_factor(&self) -> f64 {
        self.scale_factor
    }

    /// Sets the group-wide scale factor
    pub fn set_scale_factor(&mut self, scale: f64) {
        self.scale_factor = scale;
    }

    /// Gets the group-wide speed factor
    pub fn speed_factor(&self) -> f64 {
        self.speed_factor
    }

    /// Sets the group-wide speed factor
    pub fn set_speed_factor(&mut self, speed: f64) {
        self.speed_factor = speed;
    }

    /// Gets the group-wide time offset
    pub fn time_offset(&self) -> Duration {
        self.time_offset
    }

    /// Sets the group-wide time offset
    pub fn set_time_offset(&mut self, offset: Duration) {
        self.time_offset = offset;
    }

    /// Updates the list of tracks in this group based on the pattern
    pub fn update_members(&mut self, registry: &TrackRegistry) {
        self.tracks.clear();
        match &self.pattern {
            GroupPattern::All => {
                for id in registry.track_ids() {
                    self.tracks.insert(id.to_string());
                }
            },
            GroupPattern::Pattern(pattern) => {
                for id in registry.track_ids() {
                    if id.contains(pattern) {
                        self.tracks.insert(id.to_string());
                    }
                }
            },
            GroupPattern::List(ids) => {
                for id in ids {
                    if registry.get_track(id).is_some() {
                        self.tracks.insert(id.to_string());
                    }
                }
            },
        }
    }

    /// Updates the positions of all tracks in this group
    pub fn update_positions(&self, registry: &mut TrackRegistry, time: Duration) {
        let scaled_time = time + self.time_offset;
        
        // First collect all current positions
        let mut track_positions = HashMap::new();
        for track_id in &self.tracks {
            if let Some(track) = registry.get_track(track_id) {
                let pos = if let Some(m) = track.motion() {
                    m.calculate_position(scaled_time)
                } else {
                    track.position()
                };
                track_positions.insert(track_id.clone(), pos);
            }
        }
        
        // Calculate new positions
        let mut new_positions = HashMap::new();
        for track_id in &self.tracks {
            let base_pos = match track_positions.get(track_id) {
                Some(pos) => pos.clone(),
                None => continue,
            };
            
            let updated_pos = match &self.relation(track_id) {
                None => base_pos,
                Some(relation) => match relation {
                    GroupRelation::None => base_pos,
                    GroupRelation::Follow(target_id) => {
                        track_positions.get(target_id).cloned().unwrap_or(base_pos)
                    },
                    GroupRelation::Offset(offset) => base_pos + *offset,
                    GroupRelation::Rotate { angle, axis, center } => {
                        let rotation_center = center.clone().unwrap_or_else(|| {
                            let mut sum = Vector3::zero();
                            let mut count = 0;
                            for pos in track_positions.values() {
                                sum = sum + *pos;
                                count += 1;
                            }
                            if count > 0 {
                                sum / count as f64
                            } else {
                                Vector3::zero()
                            }
                        });

                        let relative_pos = base_pos - rotation_center;
                        let rotated_pos = relative_pos.rotate(*angle, axis);
                        rotation_center + rotated_pos
                    },
                    GroupRelation::Phase(_) => base_pos,
                    GroupRelation::Isobarycentric { reference_distance, maintain_plane } => {
                        let mut center = Vector3::zero();
                        let mut count = 0;
                        
                        // Calculate center of mass
                        for pos in track_positions.values() {
                            center = center + *pos;
                            count += 1;
                        }
                        
                        if count == 0 {
                            base_pos
                        } else {
                            center = center / count as f64;
                            
                            let target_distance = reference_distance.unwrap_or_else(|| {
                                let mut sum_dist = 0.0;
                                for pos in track_positions.values() {
                                    sum_dist += (*pos - center).magnitude();
                                }
                                sum_dist / count as f64
                            });
                            
                            let current_vec = base_pos - center;
                            let current_dist = current_vec.magnitude();
                            
                            if current_dist < 1e-10 {
                                let random_vec = Vector3::new(
                                    rand::random::<f64>() * 2.0 - 1.0,
                                    rand::random::<f64>() * 2.0 - 1.0,
                                    rand::random::<f64>() * 2.0 - 1.0
                                ).normalize();
                                center + random_vec * target_distance
                            } else {
                                let direction = current_vec / current_dist;
                                
                                if *maintain_plane {
                                    let mut normal = Vector3::zero();
                                    let positions: Vec<_> = track_positions.values().collect();
                                    for i in 0..positions.len() {
                                        let p1 = positions[i];
                                        let p2 = positions[(i + 1) % positions.len()];
                                        let v1 = *p1 - center;
                                        let v2 = *p2 - center;
                                        normal = normal + v1.cross(&v2);
                                    }
                                    
                                    if normal.magnitude() > 1e-10 {
                                        normal = normal.normalize();
                                        let projected = direction - normal * direction.dot(&normal);
                                        if projected.magnitude() > 1e-10 {
                                            center + projected.normalize() * target_distance
                                        } else {
                                            center + direction * target_distance
                                        }
                                    } else {
                                        center + direction * target_distance
                                    }
                                } else {
                                    center + direction * target_distance
                                }
                            }
                        }
                    }
                }
            };

            let final_pos = updated_pos * self.scale_factor;
            new_positions.insert(track_id.clone(), final_pos);
        }
        
        // Apply new positions
        for (track_id, new_pos) in new_positions {
            if let Some(track) = registry.get_track_mut(&track_id) {
                track.set_position(new_pos);
            }
        }
    }
}

impl Default for Group {
    fn default() -> Self {
        Self {
            name: String::new(),
            pattern: GroupPattern::All,
            tracks: HashSet::new(),
            relations: HashMap::new(),
            scale_factor: 1.0,
            speed_factor: 1.0,
            time_offset: Duration::from_secs(0),
        }
    }
}
