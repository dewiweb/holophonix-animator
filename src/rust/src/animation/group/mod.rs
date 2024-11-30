use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub animations: HashMap<String, String>,
}

impl ObjectFinalize for Group {}

#[napi]
impl Group {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            animations: HashMap::new(),
        }
    }

    #[napi]
    pub async fn add_animation(&mut self, animation_id: String) -> napi::Result<()> {
        self.animations.insert(animation_id, animation_id);
        Ok(())
    }

    #[napi]
    pub async fn remove_animation(&mut self, animation_id: String) -> napi::Result<()> {
        self.animations.remove(&animation_id);
        Ok(())
    }

    #[napi]
    pub async fn get_animation(&self, animation_id: String) -> napi::Result<bool> {
        Ok(self.animations.contains_key(&animation_id))
    }

    #[napi]
    pub async fn get_animations(&self) -> napi::Result<Vec<String>> {
        Ok(self.animations.keys().cloned().collect())
    }

    #[napi]
    pub async fn clear_animations(&mut self) -> napi::Result<()> {
        self.animations.clear();
        Ok(())
    }
}

#[napi]
#[derive(Debug, Clone)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub animations: HashMap<String, Animation>,
}

impl napi::bindgen_prelude::ObjectFinalize for Group {}

#[napi]
impl Group {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            animations: HashMap::new(),
        }
    }

    #[napi]
    pub fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        if self.animations.contains_key(&animation.id) {
            return Err(AnimatorError::AnimationExists.into());
        }
        self.animations.insert(animation.id.clone(), animation);
        Ok(())
    }

    #[napi]
    pub fn remove_animation(&mut self, id: String) -> napi::Result<()> {
        if !self.animations.contains_key(&id) {
            return Err(AnimatorError::AnimationNotFound.into());
        }
        self.animations.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_animation_ids(&self) -> Vec<String> {
        self.animations.keys().cloned().collect()
    }
}

#[napi]
#[derive(Debug, Default)]
pub struct GroupManager {
    groups: Arc<Mutex<HashMap<String, Group>>>,
}

#[napi]
impl GroupManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            groups: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    #[napi]
    pub async fn add_group(&self, group: Group) -> napi::Result<()> {
        let mut groups = self.groups.lock().await;
        groups.insert(group.id.clone(), group);
        Ok(())
    }

    #[napi]
    pub async fn get_group(&self, id: String) -> napi::Result<Option<Group>> {
        let groups = self.groups.lock().await;
        Ok(groups.get(&id).cloned())
    }

    #[napi]
    pub async fn remove_group(&self, id: String) -> napi::Result<()> {
        let mut groups = self.groups.lock().await;
        groups.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn clear_groups(&self) -> napi::Result<()> {
        let mut groups = self.groups.lock().await;
        groups.clear();
        Ok(())
    }

    #[napi]
    pub async fn get_all_groups(&self) -> napi::Result<Vec<Group>> {
        let groups = self.groups.lock().await;
        Ok(groups.values().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_group_manager() {
        let manager = GroupManager::new();

        // Test adding a group
        let group = Group::new("test".to_string(), "Test Group".to_string());
        manager.add_group(group.clone()).await.unwrap();

        // Test getting a group
        let retrieved_group = manager.get_group("test".to_string()).await.unwrap();
        assert!(retrieved_group.is_some());
        let retrieved_group = retrieved_group.unwrap();
        assert_eq!(retrieved_group.id, "test");
        assert_eq!(retrieved_group.name, "Test Group");

        // Test getting a non-existent group
        let non_existent = manager.get_group("non_existent".to_string()).await.unwrap();
        assert!(non_existent.is_none());

        // Test removing a group
        manager.remove_group("test".to_string()).await.unwrap();
        let removed = manager.get_group("test".to_string()).await.unwrap();
        assert!(removed.is_none());

        // Test clearing all groups
        manager.add_group(group.clone()).await.unwrap();
        manager.clear_groups().await.unwrap();
        let all_groups = manager.get_all_groups().await.unwrap();
        assert_eq!(all_groups.len(), 0);
    }
}
