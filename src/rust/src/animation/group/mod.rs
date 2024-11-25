mod relationship;
mod formation;

use std::collections::HashMap;
use crate::models::Position;

pub use relationship::{Relationship, RelationshipType};
pub use formation::{Formation, FormationType};

/// Manages track groups and their relationships
pub struct GroupManager {
    groups: HashMap<String, Group>,
    relationships: HashMap<String, Relationship>,
}

impl GroupManager {
    pub fn new() -> Self {
        Self {
            groups: HashMap::new(),
            relationships: HashMap::new(),
        }
    }

    pub fn initialize(&mut self) -> Result<(), String> {
        Ok(())
    }

    pub fn process_frame(&mut self, delta_time: f64) -> Result<(), String> {
        // Process each group's animation
        for group in self.groups.values_mut() {
            group.process_frame(delta_time)?;
        }
        Ok(())
    }

    pub fn cleanup(&mut self) -> Result<(), String> {
        self.groups.clear();
        self.relationships.clear();
        Ok(())
    }

    /// Create a new group from a pattern
    pub fn create_group(&mut self, pattern: &str) -> Result<String, String> {
        let group_id = format!("group_{}", self.groups.len());
        let tracks = Self::parse_pattern(pattern)?;
        
        let group = Group::new(group_id.clone(), tracks);
        self.groups.insert(group_id.clone(), group);
        
        Ok(group_id)
    }

    /// Parse a pattern into track IDs
    fn parse_pattern(pattern: &str) -> Result<Vec<String>, String> {
        let mut tracks = Vec::new();
        
        // Handle range syntax [start-end]
        if pattern.starts_with('[') && pattern.ends_with(']') {
            let range = &pattern[1..pattern.len()-1];
            let parts: Vec<&str> = range.split('-').collect();
            if parts.len() != 2 {
                return Err("Invalid range syntax".to_string());
            }
            
            let start: i32 = parts[0].parse().map_err(|_| "Invalid start number")?;
            let end: i32 = parts[1].parse().map_err(|_| "Invalid end number")?;
            
            for i in start..=end {
                tracks.push(format!("track_{}", i));
            }
        }
        // Handle set syntax {track1,track2,...}
        else if pattern.starts_with('{') && pattern.ends_with('}') {
            let set = &pattern[1..pattern.len()-1];
            for track in set.split(',') {
                tracks.push(track.trim().to_string());
            }
        }
        else {
            return Err("Invalid pattern syntax".to_string());
        }
        
        Ok(tracks)
    }
}

/// A group of tracks that can be animated together
pub struct Group {
    id: String,
    tracks: Vec<String>,
    formation: Formation,
    center: Position,
}

impl Group {
    pub fn new(id: String, tracks: Vec<String>) -> Self {
        Self {
            id,
            tracks,
            formation: Formation::new(FormationType::Default),
            center: Position::default(),
        }
    }

    pub fn process_frame(&mut self, delta_time: f64) -> Result<(), String> {
        // Update formation and center
        self.formation.update(delta_time)?;
        // Process individual track animations within the group
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_parsing() {
        let manager = GroupManager::new();
        
        // Test range syntax
        let tracks = GroupManager::parse_pattern("[1-3]").unwrap();
        assert_eq!(tracks, vec!["track_1", "track_2", "track_3"]);
        
        // Test set syntax
        let tracks = GroupManager::parse_pattern("{track_1,track_2,track_3}").unwrap();
        assert_eq!(tracks, vec!["track_1", "track_2", "track_3"]);
        
        // Test invalid syntax
        assert!(GroupManager::parse_pattern("invalid").is_err());
    }
}
