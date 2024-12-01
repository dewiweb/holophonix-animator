use std::time::Duration;
use crate::Position;

pub trait PositionAssertions {
    fn assert_close_to(&self, other: &Position, epsilon: f64);
}

impl PositionAssertions for Position {
    fn assert_close_to(&self, other: &Position, epsilon: f64) {
        assert!((self.x - other.x).abs() < epsilon, "x coordinates differ by more than {}", epsilon);
        assert!((self.y - other.y).abs() < epsilon, "y coordinates differ by more than {}", epsilon);
        assert!((self.z - other.z).abs() < epsilon, "z coordinates differ by more than {}", epsilon);
        assert!((self.roll - other.roll).abs() < epsilon, "roll coordinates differ by more than {}", epsilon);
        assert!((self.pitch - other.pitch).abs() < epsilon, "pitch coordinates differ by more than {}", epsilon);
        assert!((self.yaw - other.yaw).abs() < epsilon, "yaw coordinates differ by more than {}", epsilon);
    }
}

pub trait TimingAssertions {
    fn assert_duration_close_to(&self, expected: Duration, epsilon_ms: u64);
}

impl TimingAssertions for Duration {
    fn assert_duration_close_to(&self, expected: Duration, epsilon_ms: u64) {
        let diff = if *self > expected {
            self.as_millis() as i128 - expected.as_millis() as i128
        } else {
            expected.as_millis() as i128 - self.as_millis() as i128
        };
        
        assert!(diff < epsilon_ms as i128, 
            "durations differ by {} ms, which is more than the allowed {} ms",
            diff, epsilon_ms
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::TestPositions;

    #[test]
    fn test_position_assertions() {
        let pos1 = TestPositions::origin();
        let pos2 = Position::new(0.001, 0.001, 0.001, 0.001, 0.001, 0.001);
        pos1.assert_close_to(&pos2, 0.01);
    }

    #[test]
    #[should_panic(expected = "x coordinates differ by more than 0.001")]
    fn test_position_assertions_fail() {
        let pos1 = TestPositions::origin();
        let pos2 = Position::new(0.01, 0.0, 0.0, 0.0, 0.0, 0.0);
        pos1.assert_close_to(&pos2, 0.001);
    }

    #[test]
    fn test_timing_assertions() {
        let duration1 = Duration::from_millis(1000);
        let duration2 = Duration::from_millis(1005);
        duration1.assert_duration_close_to(duration2, 10);
    }

    #[test]
    #[should_panic(expected = "durations differ by 50 ms")]
    fn test_timing_assertions_fail() {
        let duration1 = Duration::from_millis(1000);
        let duration2 = Duration::from_millis(1050);
        duration1.assert_duration_close_to(duration2, 10);
    }
}
