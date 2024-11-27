use std::collections::HashMap;
use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use crate::models::common::AnimationConfig;
use crate::state::core::StateManager;
use std::sync::Arc;
use tokio::sync::Mutex;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub track_ids: Vec<String>,
    pub config: Option<AnimationConfig>,
}

impl ObjectFinalize for Group {}

#[napi]
#[derive(Debug)]
pub struct GroupManager {
    #[napi(skip)]
    pub state_manager: Arc<Mutex<StateManager>>,
    #[napi(skip)]
    pub groups: HashMap<String, Group>,
}

#[napi]
impl GroupManager {
    #[napi(constructor)]
    pub fn new(state_manager: Arc<Mutex<StateManager>>) -> Self {
        Self {
            state_manager,
            groups: HashMap::new(),
        }
    }

    #[napi]
    pub async unsafe fn create_group(&mut self, name: String, tracks: Vec<String>, config: Option<AnimationConfig>) -> Result<String> {
        let id = format!("group_{}", name);
        let group = Group {
            id: id.clone(),
            name,
            track_ids: tracks,
            config,
        };
        self.groups.insert(id.clone(), group);
        Ok(id)
    }

    #[napi]
    pub async fn get_group(&self, id: String) -> Result<Option<Group>> {
        Ok(self.groups.get(&id).cloned())
    }

    #[napi]
    pub async unsafe fn remove_group(&mut self, id: String) -> Result<()> {
        self.groups.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_all_groups(&self) -> Result<Vec<Group>> {
        Ok(self.groups.values().cloned().collect())
    }
}

impl Default for GroupManager {
    fn default() -> Self {
        Self {
            state_manager: Arc::new(Mutex::new(StateManager::default())),
            groups: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::runtime::Runtime;

    #[test]
    fn test_group_manager() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let mut manager = GroupManager::default();
            let tracks = vec!["track1".to_string(), "track2".to_string()];
            
            let id = unsafe { manager.create_group("test".to_string(), tracks.clone(), None).await.unwrap() };
            
            let group = manager.get_group(id.clone()).await.unwrap();
            assert!(group.is_some());
            let group = group.unwrap();
            assert_eq!(group.name, "test");
            assert_eq!(group.track_ids, tracks);
            
            unsafe { manager.remove_group(id).await.unwrap() };
            let group = manager.get_group(id).await.unwrap();
            assert!(group.is_none());
        });
    }
}
