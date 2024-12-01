use holophonix_animator_core::{
    animation::{Animation, AnimationConfig, AnimationModel, LinearModel},
    position::Position,
    test_utils::{
        generators::{PositionGenerator, AnimationConfigGenerator},
        assertions::PositionAssertions,
    },
};
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_position_invariants(
        x in -1.0..1.0f64,
        y in -1.0..1.0f64,
        z in -1.0..1.0f64,
        roll in -std::f64::consts::PI..std::f64::consts::PI,
        pitch in -std::f64::consts::PI..std::f64::consts::PI,
        yaw in -std::f64::consts::PI..std::f64::consts::PI,
    ) {
        let pos = Position::new(x, y, z, roll, pitch, yaw);
        
        // Test distance to self is 0
        prop_assert!(pos.distance(&pos) < 1e-6);
        
        // Test distance is symmetric
        let other = Position::new(-x, -y, -z, -roll, -pitch, -yaw);
        prop_assert!((pos.distance(&other) - other.distance(&pos)).abs() < 1e-6);
    }

    #[test]
    fn test_position_array_conversion(pos in PositionGenerator::strategy()) {
        let arr = pos.to_array();
        let pos2 = Position::from_array(arr);
        pos.assert_approx_eq(&pos2);
    }

    #[test]
    fn test_position_interpolation(
        start in PositionGenerator::strategy(),
        end in PositionGenerator::strategy(),
        t in 0.0..1.0f64
    ) {
        let interpolated = start.interpolate(&end, t);
        
        // At t=0, should be equal to start
        if t == 0.0 {
            start.assert_approx_eq(&interpolated);
        }
        // At t=1, should be equal to end
        else if t == 1.0 {
            end.assert_approx_eq(&interpolated);
        }
        // At intermediate values, should be between start and end
        else {
            let dist_to_start = start.distance(&interpolated);
            let dist_to_end = end.distance(&interpolated);
            let total_dist = start.distance(&end);

            // Check that distances are proportional to t
            let expected_dist_to_start = total_dist * t;
            let expected_dist_to_end = total_dist * (1.0 - t);

            assert!((dist_to_start - expected_dist_to_start).abs() < 1e-6);
            assert!((dist_to_end - expected_dist_to_end).abs() < 1e-6);
        }
    }

    #[test]
    fn test_animation_config_validation(config in AnimationConfigGenerator::strategy()) {
        assert!(config.duration_ms > 0);
        assert!(config.loop_count >= 0);
    }

    #[test]
    fn test_animation_config_validity(
        start in position_strategy(),
        end in position_strategy(),
        duration in 0.1..100.0f64,
        animation_type in animation_type_strategy()
    ) {
        let config = AnimationConfig::new(
            start,
            end,
            duration,
            animation_type
        );

        // Properties that should hold for any animation config:
        // 1. Duration should be positive
        assert!(config.duration_ms > 0.0);
        
        // 2. Animation type should be valid
        assert!(config.is_valid_type());
        
        // 3. Start and end positions should be unchanged
        assert_eq!(config.start_position, start);
        assert_eq!(config.end_position, end);
    }

    #[test]
    fn test_group_animation_properties(
        configs in prop::collection::vec(animation_config_strategy(), 1..10)
    ) {
        // Create a group with random animations
        let mut group = AnimationGroup::new();
        for (i, config) in configs.iter().enumerate() {
            group.add_animation(format!("track_{}", i), config.clone());
        }

        // Properties that should hold for any group:
        // 1. All tracks should be present
        for i in 0..configs.len() {
            assert!(group.has_track(&format!("track_{}", i)));
        }

        // 2. Group duration should be max of all animation durations
        let max_duration = configs.iter()
            .map(|c| c.duration_ms)
            .fold(0.0, f64::max);
        assert_eq!(group.duration(), max_duration);
    }

    #[test]
    fn test_animation_interpolation(
        start in PositionGenerator::random(),
        end in PositionGenerator::random(),
        t in 0.0..1.0f64,
    ) {
        let config = AnimationConfig::new(
            start.clone(),
            end.clone(),
            1.0,
            "linear".to_string(),
        );

        let result = config.interpolate(t);
        
        // Interpolated position should be between start and end
        prop_assert!(result.x >= start.x.min(end.x) && result.x <= start.x.max(end.x));
        prop_assert!(result.y >= start.y.min(end.y) && result.y <= start.y.max(end.y));
        prop_assert!(result.z >= start.z.min(end.z) && result.z <= start.z.max(end.z));
    }

    #[test]
    fn test_group_behavior(
        track_count in 1..10usize,
        positions in vec(PositionGenerator::random(), 1..10),
    ) {
        // Create group with random tracks
        let configs: Vec<_> = positions.iter().map(|pos| {
            AnimationConfig::new(
                TestPositions::origin(),
                pos.clone(),
                1.0,
                "linear".to_string(),
            )
        }).collect();

        prop_assert!(configs.len() == positions.len());
        
        // Verify all configs are valid
        for config in configs {
            prop_assert!(config.get_duration() > 0.0);
            prop_assert!(config.get_model_type() == "linear");
        }
    }
}
