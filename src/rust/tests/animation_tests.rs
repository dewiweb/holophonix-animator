use std::time::Duration;
use holophonix_animator_core::{
    animation::{
        motion::{LinearMotion, CircularMotion, CircularPlane},
        models::MotionModel,
    },
    math::vector::Vector3,
};
use approx::assert_relative_eq;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_motion() {
        let start = Vector3::new(0.0, 0.0, 0.0);
        let end = Vector3::new(1.0, 1.0, 1.0);
        let duration = Duration::from_secs(2);

        let motion = LinearMotion::new(start, end, duration);

        // Test start position
        assert_eq!(motion.calculate_position(Duration::from_secs(0)), start);

        // Test halfway position
        let half = Vector3::new(0.5, 0.5, 0.5);
        assert_eq!(motion.calculate_position(Duration::from_secs(1)), half);

        // Test end position
        assert_eq!(motion.calculate_position(Duration::from_secs(2)), end);

        // Test beyond duration
        assert_eq!(motion.calculate_position(Duration::from_secs(3)), end);
    }

    #[test]
    fn test_circular_motion() {
        let center = Vector3::new(0.0, 0.0, 0.0);
        let radius = 1.0;
        let frequency = 0.5; // One rotation every 2 seconds
        let plane = CircularPlane::XY;

        let motion = CircularMotion::new(center, radius, frequency, plane);

        // Test start position (should be on positive x-axis)
        let start_pos = motion.calculate_position(Duration::from_secs(0));
        assert_eq!(start_pos.x(), radius);
        assert_eq!(start_pos.y(), 0.0);
        assert_eq!(start_pos.z(), 0.0);

        // Test quarter rotation (should be on positive y-axis)
        let quarter_pos = motion.calculate_position(Duration::from_secs_f64(0.5));
        assert!(quarter_pos.x().abs() < 1e-10);
        assert_eq!(quarter_pos.y(), radius);
        assert_eq!(quarter_pos.z(), 0.0);

        // Test half rotation (should be on negative x-axis)
        let half_pos = motion.calculate_position(Duration::from_secs(1));
        assert_eq!(half_pos.x(), -radius);
        assert!(half_pos.y().abs() < 1e-10);
        assert_eq!(half_pos.z(), 0.0);
    }

    #[test]
    fn test_circular_motion_planes() {
        let center = Vector3::new(1.0, 2.0, 3.0);
        let radius = 2.0;
        let frequency = 1.0;

        // Test XY plane
        let motion_xy = CircularMotion::new(center, radius, frequency, CircularPlane::XY);
        let pos_xy = motion_xy.calculate_position(Duration::from_secs(0));
        assert_eq!(pos_xy.x(), center.x() + radius);
        assert_eq!(pos_xy.y(), center.y());
        assert_eq!(pos_xy.z(), center.z());

        // Test XZ plane
        let motion_xz = CircularMotion::new(center, radius, frequency, CircularPlane::XZ);
        let pos_xz = motion_xz.calculate_position(Duration::from_secs(0));
        assert_eq!(pos_xz.x(), center.x() + radius);
        assert_eq!(pos_xz.y(), center.y());
        assert_eq!(pos_xz.z(), center.z());

        // Test YZ plane
        let motion_yz = CircularMotion::new(center, radius, frequency, CircularPlane::YZ);
        let pos_yz = motion_yz.calculate_position(Duration::from_secs(0));
        assert_eq!(pos_yz.x(), center.x());
        assert_eq!(pos_yz.y(), center.y() + radius);
        assert_eq!(pos_yz.z(), center.z());
    }

    #[test]
    fn test_aed_circular_motion() {
        let center = Vector3::new(0.0, 0.0, 1.0); // Center in spherical coordinates
        let radius = 45.0_f64.to_radians(); // 45 degrees in radians
        let frequency = 1.0;
        let plane = CircularPlane::XY;

        let motion = CircularMotion::new(center, radius, frequency, plane);

        // Test start position
        let start_pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(start_pos.x(), center.x() + radius, epsilon = 1e-10);
        assert_relative_eq!(start_pos.y(), center.y(), epsilon = 1e-10);
        assert_relative_eq!(start_pos.z(), center.z(), epsilon = 1e-10);

        // Test quarter rotation
        let quarter_pos = motion.calculate_position(Duration::from_secs_f64(0.25));
        assert_relative_eq!(quarter_pos.x(), center.x(), epsilon = 1e-10);
        assert_relative_eq!(quarter_pos.y(), center.y() + radius, epsilon = 1e-10);
        assert_relative_eq!(quarter_pos.z(), center.z(), epsilon = 1e-10);

        // Test half rotation
        let half_pos = motion.calculate_position(Duration::from_secs_f64(0.5));
        assert_relative_eq!(half_pos.x(), center.x() - radius, epsilon = 1e-10);
        assert_relative_eq!(half_pos.y(), center.y(), epsilon = 1e-10);
        assert_relative_eq!(half_pos.z(), center.z(), epsilon = 1e-10);
    }

    #[test]
    fn test_motion_reversibility() {
        let start = Vector3::new(0.0, 0.0, 0.0);
        let end = Vector3::new(1.0, 1.0, 1.0);
        let duration = Duration::from_secs(1);

        let motion = LinearMotion::new(start, end, duration);

        // Sample points at different times
        let times = vec![0.0, 0.25, 0.5, 0.75, 1.0];
        let mut positions = Vec::new();

        // Forward pass
        for t in &times {
            let pos = motion.calculate_position(Duration::from_secs_f64(*t));
            positions.push(pos);
        }

        // Reverse pass
        for (i, t) in times.iter().rev().enumerate() {
            let pos = motion.calculate_position(Duration::from_secs_f64(*t));
            assert_eq!(pos, positions[positions.len() - 1 - i]);
        }
    }

    #[test]
    fn test_motion_path_continuity() {
        let start = Vector3::new(0.0, 0.0, 0.0);
        let end = Vector3::new(1.0, 1.0, 1.0);
        let duration = Duration::from_secs(1);

        let motion = LinearMotion::new(start, end, duration);

        let mut prev_pos = start;
        let steps = 100;
        let dt = duration.as_secs_f64() / steps as f64;

        for i in 1..=steps {
            let t = Duration::from_secs_f64(dt * i as f64);
            let curr_pos = motion.calculate_position(t);
            let dist = (curr_pos - prev_pos).magnitude();
            assert!(dist <= (end - start).magnitude() / steps as f64 * 1.1); // Allow 10% margin
            prev_pos = curr_pos;
        }
    }

    #[test]
    fn test_coordinate_system_consistency() {
        let start = Vector3::new(0.0, 0.0, 0.0);
        let end = Vector3::new(1.0, 1.0, 1.0);
        let duration = Duration::from_secs(1);

        let motion = LinearMotion::new(start, end, duration);

        // Sample points at different times
        let times = vec![0.0, 0.25, 0.5, 0.75, 1.0];
        for t in times {
            let pos = motion.calculate_position(Duration::from_secs_f64(t));
            assert!(pos.x() >= start.x() && pos.x() <= end.x());
            assert!(pos.y() >= start.y() && pos.y() <= end.y());
            assert!(pos.z() >= start.z() && pos.z() <= end.z());
        }
    }
}
