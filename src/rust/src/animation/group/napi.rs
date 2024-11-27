use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use crate::error::{AnimatorError, AnimatorResult};
use super::state::{Group, GroupState};
use super::GroupManager;
use crate::models::common::Position;

#[napi(object)]
#[derive(Clone, Serialize, Deserialize)]
pub struct GroupData {
    pub id: String,
    pub name: String,
    pub active: bool,
    #[napi(ts_type = "{ [key: string]: string }")]
    pub metadata: HashMap<String, String>,
    pub timeline_id: Option<String>,
    pub parent_id: Option<String>,
}

impl From<Group> for GroupData {
    fn from(group: Group) -> Self {
        Self {
            id: group.id,
            name: group.name,
            active: group.active,
            metadata: group.metadata,
            timeline_id: group.timeline_id,
            parent_id: group.parent_id,
        }
    }
}

impl From<GroupData> for Group {
    fn from(data: GroupData) -> Self {
        Self {
            id: data.id,
            name: data.name,
            active: data.active,
            metadata: data.metadata,
            timeline_id: data.timeline_id,
            parent_id: data.parent_id,
            track_ids: Default::default(),
            children: Default::default(),
        }
    }
}

#[napi]
impl ObjectFinalize for GroupManager {}

#[napi]
impl GroupManager {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        Ok(Self {
            groups: HashMap::new(),
            state: GroupState::default(),
        })
    }

    #[napi]
    pub async fn create_group(&mut self, group: GroupData) -> Result<bool> {
        self.state.add_group(group.into())?;
        Ok(true)
    }

    #[napi]
    pub async fn get_group(&self, id: String) -> Result<Option<GroupData>> {
        Ok(self.state.get_group(id)?.map(GroupData::from))
    }

    #[napi]
    pub async fn remove_group(&mut self, id: String) -> Result<bool> {
        self.state.remove_group(id)?;
        Ok(true)
    }

    #[napi]
    pub async fn get_active_groups(&self) -> Result<Vec<GroupData>> {
        let groups = self.state.get_all_groups()?;
        Ok(groups.into_iter()
            .filter(|g| g.active)
            .map(GroupData::from)
            .collect())
    }

    #[napi]
    pub async fn get_children(&self, id: String) -> Result<Vec<GroupData>> {
        let group = self.state.get_group(id)?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        let children = group.children;
        let mut result = Vec::new();
        for child_id in children {
            if let Some(child) = self.state.get_group(child_id)? {
                result.push(GroupData::from(child));
            }
        }
        Ok(result)
    }

    #[napi]
    pub async fn move_group(&mut self, id: String, parent_id: Option<String>) -> Result<bool> {
        let mut group = self.state.get_group(id.clone())?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        group.parent_id = parent_id;
        self.state.add_group(group)?;
        Ok(true)
    }

    #[napi]
    pub async fn add_track_to_group(&mut self, group_id: String, track_id: String) -> Result<bool> {
        let mut group = self.state.get_group(group_id.clone())?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        if !group.track_ids.contains(&track_id) {
            group.track_ids.push(track_id);
            self.state.add_group(group)?;
        }
        Ok(true)
    }

    #[napi]
    pub async fn remove_track_from_group(&mut self, group_id: String, track_id: String) -> Result<bool> {
        let mut group = self.state.get_group(group_id.clone())?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        group.track_ids.retain(|t| t != &track_id);
        self.state.add_group(group)?;
        Ok(true)
    }

    #[napi]
    pub async fn get_track_groups(&self, track_id: String) -> Result<Vec<GroupData>> {
        let groups = self.state.get_all_groups()?;
        Ok(groups.into_iter()
            .filter(|g| g.track_ids.contains(&track_id))
            .map(GroupData::from)
            .collect())
    }

    #[napi]
    pub async fn update_track_position(&mut self, id: String, position: Position) -> Result<()> {
        let mut group = self.state.get_group(id.clone())?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        
        // Update position in metadata
        group.metadata.insert("x".to_string(), position.x.to_string());
        group.metadata.insert("y".to_string(), position.y.to_string());
        group.metadata.insert("z".to_string(), position.z.to_string());
        
        self.state.add_group(group)?;
        Ok(())
    }

    #[napi]
    pub async fn play_all(&mut self, group_id: String) -> Result<()> {
        let group = self.state.get_group(group_id)?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        
        // TODO: Implement play logic for all tracks in the group
        Ok(())
    }

    #[napi]
    pub async fn pause_all(&mut self, group_id: String) -> Result<()> {
        let group = self.state.get_group(group_id)?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        
        // TODO: Implement pause logic for all tracks in the group
        Ok(())
    }

    #[napi]
    pub async fn stop_all(&mut self, group_id: String) -> Result<()> {
        let group = self.state.get_group(group_id)?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        
        // TODO: Implement stop logic for all tracks in the group
        Ok(())
    }

    #[napi]
    pub async fn sync_tracks(&mut self, group_id: String) -> Result<()> {
        let group = self.state.get_group(group_id)?
            .ok_or_else(|| Error::new(Status::InvalidArg, "Group not found"))?;
        
        // TODO: Implement track synchronization logic
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_group_manager_new() -> Result<()> {
        let manager = GroupManager::new()?;
        assert_eq!(manager.state.get_group_count()?, 0);
        Ok(())
    }

    #[tokio::test]
    async fn test_group_manager_create_group() -> Result<()> {
        let mut manager = GroupManager::new()?;
        let group = GroupData {
            id: "test".to_string(),
            name: "Test Group".to_string(),
            active: true,
            metadata: HashMap::new(),
            timeline_id: None,
            parent_id: None,
        };
        assert!(manager.create_group(group).await?);
        Ok(())
    }

    #[tokio::test]
    async fn test_group_manager_delete_group() -> Result<()> {
        let mut manager = GroupManager::new()?;
        let group = GroupData {
            id: "test".to_string(),
            name: "Test Group".to_string(),
            active: true,
            metadata: HashMap::new(),
            timeline_id: None,
            parent_id: None,
        };
        manager.create_group(group).await?;
        assert!(manager.remove_group("test".to_string()).await?);
        Ok(())
    }
}
