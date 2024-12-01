#[cfg(test)]
mod tests {
    use crate::{
        test_utils::{
            TestContext,
            fixtures::{TestPositions, TestAnimations},
            assertions::PositionAssertions,
            generators::PositionGenerator,
        },
        async_test,
    };
    use super::*;

    async_test!(test_animation_config, |ctx| async {
        // Use test fixtures for common positions
        let config = TestAnimations::linear_1s();
        
        assert_eq!(config.get_start_position(), TestPositions::origin());
        assert_eq!(config.get_end_position(), TestPositions::unit_x());
        assert_eq!(config.get_duration(), 1.0);
        assert_eq!(config.get_model_type(), "linear");
        Ok(())
    });

    async_test!(test_animation_config_validation, |ctx| async {
        let start_pos = TestPositions::origin();
        let end_pos = TestPositions::unit_x();
        
        // Test with negative duration
        let config = AnimationConfig::new(
            start_pos.clone(),
            end_pos.clone(),
            -1.0,
            String::from("linear"),
        );
        
        assert_eq!(config.get_duration(), -1.0);
        Ok(())
    });

    async_test!(test_random_positions, |ctx| async {
        // Test with randomly generated positions
        let positions = PositionGenerator::random_sequence(5);
        
        for pos in positions {
            let config = AnimationConfig::new(
                TestPositions::origin(),
                pos,
                1.0,
                String::from("linear"),
            );
            
            // Verify position normalization
            config.get_end_position().assert_normalized();
        }
        Ok(())
    });

    async_test!(test_position_interpolation, |ctx| async {
        let config = TestAnimations::linear_1s();
        let mid_point = Position::new(0.5, 0.0, 0.0, 0.0, 0.0, 0.0);
        
        let result = config.interpolate(0.5);
        result.assert_near(&mid_point, 1e-6);
        Ok(())
    });
}
