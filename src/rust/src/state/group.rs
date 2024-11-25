use std::collections::{HashMap, HashSet};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub track_ids: HashSet<String>,
    pub active: bool,
}

#[derive(Default, Serialize, Deserialize)]
pub struct GroupState {
    groups: HashMap<String, Group>,
}

impl GroupState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_group(&mut self, group: Group) -> bool {
        if self.groups.contains_key(&group.id) {
            return false;
        }
        self.groups.insert(group.id.clone(), group);
        true
    }

    pub fn remove_group(&mut self, id: &str) -> bool {
        self.groups.remove(id).is_some()
    }

    pub fn get_group(&self, id: &str) -> Option<&Group> {
        self.groups.get(id)
    }

    pub fn add_track_to_group(&mut self, group_id: &str, track_id: String) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.track_ids.insert(track_id);
            true
        } else {
            false
        }
    }

    pub fn remove_track_from_group(&mut self, group_id: &str, track_id: &str) -> bool {
        if let Some(group) = self.groups.get_mut(group_id) {
            group.track_ids.remove(track_id)
        } else {
            false
        }
    }

    pub fn get_track_groups(&self, track_id: &str) -> Vec<&Group> {
        self.groups.values()
            .filter(|g| g.track_ids.contains(track_id))
            .collect()
    }

    pub fn get_active_groups(&self) -> Vec<&Group> {
        self.groups.values().filter(|g| g.active).collect()
    }
}
