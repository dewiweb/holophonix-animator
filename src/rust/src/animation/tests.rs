#[cfg(test)]
mod tests {
    use super::*;
    use crate::position::Position;

    #[test]
    fn test_animation_config() {
        let start_pos = Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        let end_pos = Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0);
        let duration = 5.0;
        let model_type = String::from("linear");

        let config = AnimationConfig::new(start_pos.clone(), end_pos.clone(), duration, model_type.clone());

        assert_eq!(config.get_start_position(), start_pos);
        assert_eq!(config.get_end_position(), end_pos);
        assert_eq!(config.get_duration(), duration);
        assert_eq!(config.get_model_type(), model_type);
    }

    #[test]
    fn test_animation_config_validation() {
        let start_pos = Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        let end_pos = Position::new(1.0, 1.0, 1.0, 0.0, 0.0, 0.0);
        
        // Test with negative duration
        let config = AnimationConfig::new(start_pos.clone(), end_pos.clone(), -1.0, String::from("linear"));
        // Duration validation should be handled by the animation model implementation
        assert_eq!(config.get_duration(), -1.0);
    }
}
