use crate::math::vector::Vector3;
use std::time::Duration;
use std::any::Any;

/// A trait for objects that can calculate positions over time
pub trait MotionModel: Send + Sync {
    /// Calculate the position at a given time
    fn calculate_position(&self, time: Duration) -> Vector3;

    /// Get the duration of one cycle of the motion
    fn cycle_duration(&self) -> Duration;

    /// Whether this motion repeats
    fn is_cyclic(&self) -> bool;

    /// Clone this motion model into a boxed trait object
    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync>;

    /// Convert to Any for downcasting
    fn as_any(&self) -> &dyn Any;
}

impl Clone for Box<dyn MotionModel + Send + Sync> {
    fn clone(&self) -> Self {
        self.clone_box()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[derive(Clone)]
    struct TestMotion {
        position: Vector3,
        duration: Duration,
    }

    impl MotionModel for TestMotion {
        fn calculate_position(&self, _time: Duration) -> Vector3 {
            self.position
        }

        fn cycle_duration(&self) -> Duration {
            self.duration
        }

        fn is_cyclic(&self) -> bool {
            false
        }

        fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
            Box::new(self.clone())
        }

        fn as_any(&self) -> &dyn Any {
            self
        }
    }

    #[test]
    fn test_motion_model() {
        let motion = TestMotion {
            position: Vector3::new(1.0, 2.0, 3.0),
            duration: Duration::from_secs(1),
        };

        let boxed_motion: Box<dyn MotionModel + Send + Sync> = Box::new(motion.clone());
        let cloned_motion = boxed_motion.clone();

        assert_eq!(
            boxed_motion.calculate_position(Duration::from_secs(0)),
            cloned_motion.calculate_position(Duration::from_secs(0))
        );
    }
}
