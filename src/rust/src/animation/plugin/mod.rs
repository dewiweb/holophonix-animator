use std::collections::HashMap;
use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use serde_json::Value;
use crate::{AnimatorError, AnimatorResult, models::position::Position3D, models::common::AnimationConfig};

#[napi(object)]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PluginSettings {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub settings: HashMap<String, String>, 
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginState {
    pub id: String,
    pub plugin_id: String,
    pub position: Position3D,
    pub velocity: Position3D,
    pub acceleration: Position3D,
    pub config: Option<AnimationConfig>,
    #[serde(default)]
    pub custom_params: HashMap<String, String>, 
}

#[napi]
impl PluginState {
    #[napi(constructor)]
    pub fn new(
        id: String,
        plugin_id: String,
        position: Position3D,
        velocity: Position3D,
        acceleration: Position3D,
        config: Option<AnimationConfig>,
        custom_params: HashMap<String, String>,
    ) -> Self {
        Self {
            id,
            plugin_id,
            position,
            velocity,
            acceleration,
            config,
            custom_params,
        }
    }
}

#[napi]
pub struct PluginManager {
    plugins: HashMap<String, PluginSettings>,
    states: HashMap<String, PluginState>,
}

#[napi]
impl PluginManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            states: HashMap::new(),
        }
    }

    #[napi]
    pub fn register_plugin(&mut self, settings: PluginSettings) -> napi::Result<()> {
        self.plugins.insert(settings.id.clone(), settings);
        Ok(())
    }

    #[napi]
    pub fn unregister_plugin(&mut self, id: String) -> napi::Result<()> {
        self.plugins.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_plugin(&self, id: String) -> napi::Result<Option<PluginSettings>> {
        Ok(self.plugins.get(&id).cloned())
    }

    #[napi]
    pub fn create_plugin_state(&mut self, state: PluginState) -> napi::Result<()> {
        if !self.plugins.contains_key(&state.plugin_id) {
            return Err(Error::from_reason(format!(
                "Plugin '{}' not found",
                state.plugin_id
            )));
        }
        self.states.insert(state.id.clone(), state);
        Ok(())
    }

    #[napi]
    pub fn remove_plugin_state(&mut self, id: String) -> napi::Result<()> {
        self.states.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_plugin_state(&self, id: String) -> napi::Result<Option<PluginState>> {
        Ok(self.states.get(&id).cloned())
    }

    #[napi]
    pub fn update_plugin_state(&mut self, id: String, state: PluginState) -> napi::Result<()> {
        if !self.states.contains_key(&id) {
            return Err(Error::from_reason(format!(
                "Plugin state '{}' not found",
                id
            )));
        }
        self.states.insert(id, state);
        Ok(())
    }

    #[napi]
    pub fn get_all_plugins(&self) -> napi::Result<Vec<PluginSettings>> {
        Ok(self.plugins.values().cloned().collect())
    }

    #[napi]
    pub fn get_all_plugin_states(&self) -> napi::Result<Vec<PluginState>> {
        Ok(self.states.values().cloned().collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_registration() {
        let mut manager = PluginManager::new();
        
        let settings = PluginSettings {
            id: "plugin1".to_string(),
            name: "Test Plugin".to_string(),
            settings: HashMap::new(),
        };
        
        assert!(manager.register_plugin(settings.clone()).is_ok());
        
        let retrieved = manager.get_plugin("plugin1".to_string()).unwrap().unwrap();
        assert_eq!(retrieved.id, "plugin1");
        assert_eq!(retrieved.name, "Test Plugin");
        
        assert!(manager.unregister_plugin("plugin1".to_string()).is_ok());
        assert!(manager.get_plugin("plugin1".to_string()).unwrap().is_none());
    }

    #[test]
    fn test_plugin_state() {
        let mut manager = PluginManager::new();
        
        let settings = PluginSettings {
            id: "plugin1".to_string(),
            name: "Test Plugin".to_string(),
            settings: HashMap::new(),
        };
        manager.register_plugin(settings).unwrap();
        
        let state = PluginState {
            id: "state1".to_string(),
            plugin_id: "plugin1".to_string(),
            position: Position3D { x: 0.0, y: 0.0, z: 0.0 },
            velocity: Position3D { x: 0.0, y: 0.0, z: 0.0 },
            acceleration: Position3D { x: 0.0, y: 0.0, z: 0.0 },
            config: None,
            custom_params: HashMap::new(),
        };
        
        assert!(manager.create_plugin_state(state.clone()).is_ok());
        
        let retrieved = manager.get_plugin_state("state1".to_string()).unwrap().unwrap();
        assert_eq!(retrieved.id, "state1");
        assert_eq!(retrieved.plugin_id, "plugin1");
        
        assert!(manager.remove_plugin_state("state1".to_string()).is_ok());
        assert!(manager.get_plugin_state("state1".to_string()).unwrap().is_none());
    }
}
