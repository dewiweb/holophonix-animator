use std::time::Duration;
use async_trait::async_trait;
use crate::{Position, error::AnimatorResult};

#[async_trait]
pub trait AnimationModel: Send {
    async fn update(&mut self, elapsed: Duration) -> AnimatorResult<Position>;
    async fn reset(&mut self) -> AnimatorResult<()>;
}

pub struct PluginConfig {
    pub plugin_dir: String,
}

pub struct PluginManager {
    config: PluginConfig,
}

impl PluginManager {
    pub fn new(config: PluginConfig) -> Self {
        Self { config }
    }

    pub fn get_plugin_dir(&self) -> &str {
        &self.config.plugin_dir
    }
}
