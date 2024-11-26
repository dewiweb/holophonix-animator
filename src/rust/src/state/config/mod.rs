use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub save_directory: PathBuf,
    pub autosave_interval: u64,  // in seconds
    pub max_backup_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeConfig {
    pub animation_fps: u32,
    pub max_tracks: usize,
    pub max_groups: usize,
    pub max_animations: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub osc_server: OSCConfig,
    pub osc_client: OSCConfig,
    pub storage: StorageConfig,
    pub runtime: RuntimeConfig,
    pub custom_parameters: HashMap<String, String>,
}

impl Default for SystemConfig {
    fn default() -> Self {
        Self {
            osc_server: OSCConfig {
                host: String::from("127.0.0.1"),
                port: 8000,
            },
            osc_client: OSCConfig {
                host: String::from("127.0.0.1"),
                port: 8001,
            },
            storage: StorageConfig {
                save_directory: PathBuf::from("./saves"),
                autosave_interval: 300,  // 5 minutes
                max_backup_count: 5,
            },
            runtime: RuntimeConfig {
                animation_fps: 60,
                max_tracks: 1000,
                max_groups: 100,
                max_animations: 500,
            },
            custom_parameters: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct ConfigState {
    pub config: SystemConfig,
    modified: bool,
}

impl ConfigState {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_config(&self) -> &SystemConfig {
        &self.config
    }

    pub fn update_config(&mut self, config: SystemConfig) {
        self.config = config;
        self.modified = true;
    }

    pub fn is_modified(&self) -> bool {
        self.modified
    }

    pub fn mark_saved(&mut self) {
        self.modified = false;
    }

    pub fn get_custom_parameter(&self, key: &str) -> Option<&String> {
        self.config.custom_parameters.get(key)
    }

    pub fn set_custom_parameter(&mut self, key: String, value: String) {
        self.config.custom_parameters.insert(key, value);
    }

    pub fn remove_custom_parameter(&mut self, key: &str) -> bool {
        self.config.custom_parameters.remove(key).is_some()
    }
}
