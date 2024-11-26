use serde::{Serialize, Deserialize};
use super::common::Position;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub duration: f64,
    pub start_position: Position,
    pub end_position: Position,
    pub animation_type: AnimationType,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum AnimationType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}
