use serde::{Serialize, Deserialize};
use crate::models::Position;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum AnimationType {
    #[default]
    Linear,
    Circular,
    Pattern,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationParameters {
    pub start_position: Position,
    pub end_position: Position,
    pub duration: f64,
    pub speed: f64,
    pub acceleration: Option<f64>,
    pub custom_params: Vec<(String, f64)>,
}
