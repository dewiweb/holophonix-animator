#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::Position;

    #[test]
    fn test_linear_interpolation() {
        let start = Position { x: 0.0, y: 0.0 };
        let end = Position { x: 1.0, y: 1.0 };
        
        // Test start point
        let pos = interpolate_linear(&start, &end, 0.0);
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        
        // Test midpoint
        let pos = interpolate_linear(&start, &end, 0.5);
        assert_eq!(pos.x, 0.5);
        assert_eq!(pos.y, 0.5);
        
        // Test end point
        let pos = interpolate_linear(&start, &end, 1.0);
        assert_eq!(pos.x, 1.0);
        assert_eq!(pos.y, 1.0);
    }

    #[test]
    fn test_calculate_positions() {
        let keyframes = vec![
            (0.0, Position { x: 0.0, y: 0.0 }),
            (1.0, Position { x: 1.0, y: 1.0 }),
            (2.0, Position { x: 0.0, y: 0.0 }),
        ];
        
        let positions = calculate_positions(&keyframes, 5);
        assert_eq!(positions.len(), 5);
        
        // Check start point
        assert_eq!(positions[0].x, 0.0);
        assert_eq!(positions[0].y, 0.0);
        
        // Check middle point
        assert_eq!(positions[2].x, 1.0);
        assert_eq!(positions[2].y, 1.0);
        
        // Check end point
        assert_eq!(positions[4].x, 0.0);
        assert_eq!(positions[4].y, 0.0);
    }

    #[test]
    fn test_empty_keyframes() {
        let keyframes: Vec<(f64, Position)> = vec![];
        let positions = calculate_positions(&keyframes, 5);
        assert!(positions.is_empty());
    }

    #[test]
    fn test_single_keyframe() {
        let keyframes = vec![(0.0, Position { x: 0.5, y: 0.5 })];
        let positions = calculate_positions(&keyframes, 5);
        
        assert_eq!(positions.len(), 1);
        assert_eq!(positions[0].x, 0.5);
        assert_eq!(positions[0].y, 0.5);
    }

    #[test]
    fn test_position_bounds() {
        let start = Position { x: -0.5, y: -0.5 };
        let end = Position { x: 1.5, y: 1.5 };
        
        let pos = interpolate_linear(&start, &end, 0.5);
        
        // Values should be clamped between 0.0 and 1.0
        assert!(pos.x >= 0.0 && pos.x <= 1.0);
        assert!(pos.y >= 0.0 && pos.y <= 1.0);
    }

    #[test]
    fn test_animation_timing() {
        let keyframes = vec![
            (0.0, Position { x: 0.0, y: 0.0 }),
            (2.0, Position { x: 1.0, y: 1.0 }),
        ];
        
        let positions = calculate_positions(&keyframes, 3);
        assert_eq!(positions.len(), 3);
        
        // Check timing intervals
        assert_eq!(positions[0].x, 0.0);
        assert_eq!(positions[1].x, 0.5);
        assert_eq!(positions[2].x, 1.0);
    }
}
