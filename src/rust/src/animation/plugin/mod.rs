use std::collections::HashMap;
use async_trait::async_trait;
use serde::{Serialize, Deserialize};
use crate::error::{AnimatorError, AnimatorResult};

/// Plugin metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
}

/// Plugin configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub enabled: bool,
    pub settings: HashMap<String, serde_json::Value>,
}

/// Animation model interface that plugins must implement
#[async_trait]
pub trait AnimationModel: Send + Sync {
    /// Get plugin metadata
    fn metadata(&self) -> &PluginMetadata;
    
    /// Initialize the plugin
    async fn initialize(&mut self, config: PluginConfig) -> AnimatorResult<()>;
    
    /// Calculate next animation frame
    async fn next_frame(&mut self, time: f64, params: AnimationParams) -> AnimatorResult<AnimationFrame>;
    
    /// Clean up resources
    async fn cleanup(&mut self) -> AnimatorResult<()>;
}

/// Animation parameters passed to plugins
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationParams {
    pub position: (f64, f64, f64),
    pub velocity: (f64, f64, f64),
    pub acceleration: (f64, f64, f64),
    pub constraints: Vec<AnimationConstraint>,
    pub custom_params: HashMap<String, serde_json::Value>,
}

/// Animation constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConstraint {
    pub constraint_type: ConstraintType,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConstraintType {
    MinPosition,
    MaxPosition,
    MinVelocity,
    MaxVelocity,
    MinAcceleration,
    MaxAcceleration,
}

/// Animation frame output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationFrame {
    pub position: (f64, f64, f64),
    pub velocity: (f64, f64, f64),
    pub acceleration: (f64, f64, f64),
    pub custom_data: HashMap<String, serde_json::Value>,
}

/// Plugin manager handles loading and managing animation plugins
pub struct PluginManager {
    plugins: HashMap<String, Box<dyn AnimationModel>>,
    configs: HashMap<String, PluginConfig>,
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            configs: HashMap::new(),
        }
    }

    /// Register a new plugin
    pub fn register_plugin(&mut self, plugin: Box<dyn AnimationModel>) -> AnimatorResult<()> {
        let metadata = plugin.metadata();
        let name = metadata.name.clone();
        
        if self.plugins.contains_key(&name) {
            return Err(napi::Error::from(AnimatorError::ValidationError(
                format!("Plugin '{}' is already registered", name)
            )));
        }
        
        self.plugins.insert(name, plugin);
        Ok(())
    }

    /// Configure a plugin
    pub async fn configure_plugin(&mut self, name: &str, config: PluginConfig) -> AnimatorResult<()> {
        if let Some(plugin) = self.plugins.get_mut(name) {
            plugin.initialize(config).await?;
            self.configs.insert(name.to_string(), config);
            Ok(())
        } else {
            Err(napi::Error::from(AnimatorError::ValidationError(
                format!("Plugin '{}' is not registered", name)
            )))
        }
    }

    /// Initialize all plugins
    pub async fn initialize_plugins(&mut self) -> AnimatorResult<()> {
        for (_, plugin) in self.plugins.iter_mut() {
            let config = self.configs
                .get(plugin.metadata().name.as_str())
                .cloned()
                .unwrap_or_else(|| PluginConfig {
                    enabled: true,
                    settings: HashMap::new(),
                });
                
            plugin.initialize(config).await?;
        }
        Ok(())
    }

    /// Get a plugin by name
    pub fn get_plugin(&mut self, name: &str) -> Option<&mut Box<dyn AnimationModel>> {
        self.plugins.get_mut(name)
    }

    /// Remove a plugin
    pub async fn remove_plugin(&mut self, name: &str) -> AnimatorResult<()> {
        if let Some(mut plugin) = self.plugins.remove(name) {
            plugin.cleanup().await?;
            self.configs.remove(name);
            Ok(())
        } else {
            Err(napi::Error::from(AnimatorError::ValidationError(
                format!("Plugin '{}' is not registered", name)
            )))
        }
    }

    /// Clean up all plugins
    pub async fn cleanup(&mut self) -> AnimatorResult<()> {
        for (_, plugin) in self.plugins.iter_mut() {
            plugin.cleanup().await?;
        }
        self.plugins.clear();
        self.configs.clear();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use tokio::sync::Mutex;

    // Mock plugin for testing
    struct MockPlugin {
        metadata: PluginMetadata,
    }

    #[async_trait]
    impl AnimationModel for MockPlugin {
        fn metadata(&self) -> &PluginMetadata {
            &self.metadata
        }

        async fn initialize(&mut self, _config: PluginConfig) -> AnimatorResult<()> {
            Ok(())
        }

        async fn next_frame(&mut self, _time: f64, params: AnimationParams) -> AnimatorResult<AnimationFrame> {
            Ok(AnimationFrame {
                position: params.position,
                velocity: params.velocity,
                acceleration: params.acceleration,
                custom_data: HashMap::new(),
            })
        }

        async fn cleanup(&mut self) -> AnimatorResult<()> {
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_plugin_manager() {
        let mut manager = PluginManager::new();
        
        // Create mock plugin
        let plugin = MockPlugin {
            metadata: PluginMetadata {
                name: "mock".to_string(),
                version: "1.0".to_string(),
                author: "test".to_string(),
                description: "Mock plugin for testing".to_string(),
            },
        };
        
        // Register plugin
        manager.register_plugin(Box::new(plugin)).unwrap();
        
        // Configure plugin
        let config = PluginConfig {
            enabled: true,
            settings: HashMap::new(),
        };
        manager.configure_plugin("mock", config).await.unwrap();
        
        // Initialize plugins
        manager.initialize_plugins().await.unwrap();
        
        // Clean up
        manager.cleanup().await.unwrap();
    }
}
