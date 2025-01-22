#[cfg(test)]
mod tests {
    use holophonix_animator_core::math::vector::Vector3;
    use std::f64::consts::PI;

    #[test]
    fn test_vector3_creation() {
        let v = Vector3::new(1.0, 2.0, 3.0);
        assert_eq!(v.x, 1.0);
        assert_eq!(v.y, 2.0);
        assert_eq!(v.z, 3.0);
    }

    #[test]
    fn test_vector3_addition() {
        let v1 = Vector3::new(1.0, 2.0, 3.0);
        let v2 = Vector3::new(2.0, 3.0, 4.0);
        let result = v1 + v2;
        assert_eq!(result.x, 3.0);
        assert_eq!(result.y, 5.0);
        assert_eq!(result.z, 7.0);
    }

    #[test]
    fn test_vector3_magnitude() {
        let v = Vector3::new(3.0, 4.0, 0.0);
        assert_eq!(v.magnitude(), 5.0);
    }

    #[test]
    fn test_vector3_subtraction() {
        let v1 = Vector3::new(3.0, 4.0, 5.0);
        let v2 = Vector3::new(1.0, 1.0, 1.0);
        let result = v1 - v2;
        assert_eq!(result.x, 2.0);
        assert_eq!(result.y, 3.0);
        assert_eq!(result.z, 4.0);
    }

    #[test]
    fn test_vector3_dot_product() {
        let v1 = Vector3::new(1.0, 2.0, 3.0);
        let v2 = Vector3::new(4.0, 5.0, 6.0);
        let result = v1.dot(&v2);
        assert_eq!(result, 32.0); // (1*4 + 2*5 + 3*6)
    }

    #[test]
    fn test_vector3_normalization() {
        let v = Vector3::new(3.0, 0.0, 4.0);
        let normalized = v.normalize();
        let expected_x = 0.6;
        let expected_z = 0.8;
        
        // Use approximate equality due to floating point arithmetic
        assert!((normalized.x - expected_x).abs() < 1e-10);
        assert_eq!(normalized.y, 0.0);
        assert!((normalized.z - expected_z).abs() < 1e-10);
        
        // Verify magnitude is 1.0
        assert!((normalized.magnitude() - 1.0).abs() < 1e-10);
    }

    #[test]
    #[should_panic(expected = "Cannot normalize zero vector")]
    fn test_normalize_zero_vector() {
        let zero = Vector3::new(0.0, 0.0, 0.0);
        zero.normalize();
    }

    #[test]
    fn test_vector3_cross_product() {
        let v1 = Vector3::new(1.0, 0.0, 0.0); // x unit vector
        let v2 = Vector3::new(0.0, 1.0, 0.0); // y unit vector
        let result = v1.cross(&v2);
        // x × y = z
        assert!((result.x - 0.0).abs() < 1e-10);
        assert!((result.y - 0.0).abs() < 1e-10);
        assert!((result.z - 1.0).abs() < 1e-10);
    }

    #[test]
    fn test_vector3_scalar_multiplication() {
        let v = Vector3::new(1.0, 2.0, 3.0);
        let result = v * 2.0;
        assert_eq!(result.x, 2.0);
        assert_eq!(result.y, 4.0);
        assert_eq!(result.z, 6.0);

        // Test commutative property
        let result2 = 2.0 * v;
        assert_eq!(result, result2);
    }

    #[test]
    fn test_vector3_distance() {
        let v1 = Vector3::new(1.0, 1.0, 1.0);
        let v2 = Vector3::new(4.0, 5.0, 1.0);
        let distance = v1.distance(&v2);
        assert_eq!(distance, 5.0); // sqrt((4-1)^2 + (5-1)^2 + (1-1)^2) = 5
    }

    #[test]
    fn test_vector3_angle() {
        let v1 = Vector3::new(1.0, 0.0, 0.0);
        let v2 = Vector3::new(0.0, 1.0, 0.0);
        let angle = v1.angle(&v2);
        assert!((angle - PI/2.0).abs() < 1e-10); // 90 degrees = π/2 radians

        // Test parallel vectors
        let v3 = Vector3::new(2.0, 0.0, 0.0);
        let angle_parallel = v1.angle(&v3);
        assert!(angle_parallel.abs() < 1e-10); // 0 radians
    }

    #[test]
    fn test_vector3_lerp() {
        let v1 = Vector3::new(0.0, 0.0, 0.0);
        let v2 = Vector3::new(10.0, 20.0, 30.0);
        
        // Test start point
        let start = v1.lerp(&v2, 0.0);
        assert_eq!(start, v1);
        
        // Test end point
        let end = v1.lerp(&v2, 1.0);
        assert_eq!(end, v2);
        
        // Test midpoint
        let mid = v1.lerp(&v2, 0.5);
        assert_eq!(mid, Vector3::new(5.0, 10.0, 15.0));
    }

    #[test]
    fn test_vector3_rotate_around_axis() {
        let v = Vector3::new(1.0, 0.0, 0.0);
        let axis = Vector3::new(0.0, 0.0, 1.0); // z-axis
        
        // Rotate 90 degrees (PI/2 radians) around z-axis
        let rotated = v.rotate_around_axis(&axis, PI/2.0);
        assert!((rotated.x - 0.0).abs() < 1e-10);
        assert!((rotated.y - 1.0).abs() < 1e-10);
        assert!((rotated.z - 0.0).abs() < 1e-10);
        
        // Rotate 180 degrees (PI radians)
        let rotated = v.rotate_around_axis(&axis, PI);
        assert!((rotated.x + 1.0).abs() < 1e-10);
        assert!((rotated.y - 0.0).abs() < 1e-10);
        assert!((rotated.z - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_vector3_project_onto() {
        let v = Vector3::new(3.0, 3.0, 0.0);
        let onto = Vector3::new(5.0, 0.0, 0.0); // x-axis
        
        let projected = v.project_onto(&onto);
        assert!((projected.x - 3.0).abs() < 1e-10);
        assert!((projected.y - 0.0).abs() < 1e-10);
        assert!((projected.z - 0.0).abs() < 1e-10);
    }

    #[test]
    fn test_vector3_reflect() {
        let v = Vector3::new(1.0, -1.0, 0.0);
        let normal = Vector3::new(0.0, 1.0, 0.0); // Reflecting off horizontal surface
        
        let reflected = v.reflect(&normal);
        assert!((reflected.x - 1.0).abs() < 1e-10);
        assert!((reflected.y - 1.0).abs() < 1e-10);
        assert!((reflected.z - 0.0).abs() < 1e-10);
    }
}
