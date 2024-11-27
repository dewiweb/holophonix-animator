use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub active: bool,
    pub metadata: HashMap<String, String>,
    pub timeline_id: Option<String>,
    pub parent_id: Option<String>,
    pub track_ids: Vec<String>,
    pub children: Vec<String>,
}

impl Default for Group {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            active: false,
            metadata: HashMap::new(),
            timeline_id: None,
            parent_id: None,
            track_ids: Vec::new(),
            children: Vec::new(),
        }
    }
}

impl ObjectFinalize for Group {}

#[napi]
impl Group {
    #[napi(constructor)]
    pub fn new(id: String, name: String, active: bool, metadata: HashMap<String, String>, timeline_id: Option<String>, parent_id: Option<String>, track_ids: Vec<String>, children: Vec<String>) -> Self {
        Self {
            id,
            name,
            active,
            metadata,
            timeline_id,
            parent_id,
            track_ids,
            children,
        }
    }
}

#[napi]
#[derive(Debug)]
pub struct GroupState {
    #[napi(skip)]
    pub groups: HashMap<String, Group>,
}

#[napi]
impl GroupState {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        Ok(Self {
            groups: HashMap::new(),
        })
    }

    #[napi]
    pub fn add_group(&mut self, group: Group) -> napi::Result<()> {
        self.groups.insert(group.id.clone(), group);
        Ok(())
    }

    #[napi]
    pub fn get_group(&self, id: String) -> napi::Result<Option<Group>> {
        Ok(self.groups.get(&id).cloned())
    }

    #[napi]
    pub fn remove_group(&mut self, id: String) -> napi::Result<()> {
        self.groups.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_group_count(&self) -> napi::Result<i32> {
        Ok(self.groups.len() as i32)
    }

    #[napi]
    pub fn get_all_groups(&self) -> napi::Result<Vec<Group>> {
        Ok(self.groups.values().cloned().collect())
    }
}

impl Default for GroupState {
    fn default() -> Self {
        Self {
            groups: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_group_state() {
        let mut state = GroupState::new().unwrap();

        let group = Group {
            id: "test1".to_string(),
            name: "Test Group".to_string(),
            active: true,
            metadata: HashMap::new(),
            timeline_id: Some("timeline1".to_string()),
            parent_id: None,
            track_ids: vec!["track1".to_string()],
            children: Vec::new(),
        };

        state.add_group(group.clone()).unwrap();
        assert_eq!(state.get_group_count().unwrap(), 1);
        assert_eq!(
            state.get_group("test1".to_string()).unwrap().unwrap().name,
            "Test Group"
        );
    }
}
