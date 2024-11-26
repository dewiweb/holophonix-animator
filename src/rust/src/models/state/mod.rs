use serde::{Serialize, Deserialize};
use super::common::Position;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationState {
    pub id: String,
    pub current_position: Position,
    pub progress: f64,
    pub is_playing: bool,
    pub elapsed_time: f64,
}
