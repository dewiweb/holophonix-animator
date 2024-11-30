use serde::{Deserialize, Serialize};
use napi::Result;
use async_trait::async_trait;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Position {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }
}

#[async_trait]
pub trait AnimationModel: Send + Sync {
    async fn update(&mut self, delta_time: f64) -> Result<()>;
    async fn get_position(&self) -> Result<Position>;
    async fn start(&mut self, current_time: f64) -> Result<()>;
    async fn stop(&mut self) -> Result<()>;
    async fn is_complete(&self, current_time: f64) -> Result<bool>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub model_type: String,
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
}
