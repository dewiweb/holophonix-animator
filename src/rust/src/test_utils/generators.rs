use rand::Rng;
use crate::{
    Position,
    animation::models::AnimationConfig,
};

pub struct PositionGenerator;

impl PositionGenerator {
    pub fn random() -> Position {
        let mut rng = rand::thread_rng();
        Position::new(
            rng.gen_range(-10.0..10.0),
            rng.gen_range(-10.0..10.0),
            rng.gen_range(-10.0..10.0),
            rng.gen_range(0.0..360.0),
            rng.gen_range(0.0..360.0),
            rng.gen_range(0.0..360.0),
        )
    }
}

pub struct AnimationConfigGenerator;

impl AnimationConfigGenerator {
    pub fn random() -> AnimationConfig {
        let mut rng = rand::thread_rng();
        AnimationConfig {
            start_position: PositionGenerator::random(),
            end_position: PositionGenerator::random(),
            duration_ms: rng.gen_range(100.0..5000.0),
            model_type: "linear".to_string(),
            radius: None,
            positions: None,
            durations: None,
            loop_count: 1,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_generator() {
        let pos = PositionGenerator::random();
        assert!(pos.x >= -10.0 && pos.x <= 10.0);
        assert!(pos.y >= -10.0 && pos.y <= 10.0);
        assert!(pos.z >= -10.0 && pos.z <= 10.0);
        assert!(pos.rx >= 0.0 && pos.rx <= 360.0);
        assert!(pos.ry >= 0.0 && pos.ry <= 360.0);
        assert!(pos.rz >= 0.0 && pos.rz <= 360.0);
    }

    #[test]
    fn test_animation_config_generator() {
        let config = AnimationConfigGenerator::random();
        assert!(config.duration_ms >= 100.0 && config.duration_ms <= 5000.0);
        assert_eq!(config.model_type, "linear");
        assert_eq!(config.loop_count, 1);
    }
}
