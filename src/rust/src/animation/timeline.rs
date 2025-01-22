use std::time::Duration;
use super::parameters::MotionParameters;
use super::motion::CircularPlane;
use crate::math::vector::Vector3;

#[derive(Debug)]
pub struct Keyframe {
    time: Duration,
    parameters: MotionParameters,
}

impl Clone for Keyframe {
    fn clone(&self) -> Self {
        Self {
            time: self.time,
            parameters: self.parameters.clone(),
        }
    }
}

impl PartialEq for Keyframe {
    fn eq(&self, other: &Self) -> bool {
        self.time == other.time && self.parameters == other.parameters
    }
}

#[derive(Debug)]
pub struct Timeline {
    keyframes: Vec<Keyframe>,
    current_time: Duration,
}

impl Timeline {
    pub fn new() -> Self {
        Self {
            keyframes: Vec::new(),
            current_time: Duration::from_secs(0),
        }
    }

    pub fn add_keyframe(&mut self, time: Duration, parameters: MotionParameters) {
        let keyframe = Keyframe { time, parameters };
        // Find the correct position to insert the keyframe to maintain time order
        let pos = self.keyframes.partition_point(|k| k.time <= time);
        self.keyframes.insert(pos, keyframe);
    }

    pub fn duration(&self) -> Duration {
        self.keyframes
            .last()
            .map_or(Duration::from_secs(0), |k| k.time)
    }

    pub fn current_time(&self) -> Duration {
        self.current_time
    }

    pub fn set_time(&mut self, time: Duration) {
        self.current_time = time;
    }

    /// Find the keyframes surrounding the given time
    /// Returns (previous_keyframe, next_keyframe) if they exist
    pub fn find_surrounding_keyframes(&self, time: Duration) -> Option<(&Keyframe, &Keyframe)> {
        if self.keyframes.len() < 2 {
            return None;
        }

        // Find the index of the first keyframe that comes after the given time
        let next_idx = self.keyframes.partition_point(|k| k.time <= time);
        
        // If we're at the start or end of the timeline, return None
        if next_idx == 0 || next_idx >= self.keyframes.len() {
            return None;
        }

        Some((&self.keyframes[next_idx - 1], &self.keyframes[next_idx]))
    }

    /// Get the current motion parameters based on the current time
    pub fn current_motion(&self) -> Option<MotionParameters> {
        let time = self.current_time;
        
        // Handle special cases
        if self.keyframes.is_empty() {
            return None;
        }
        
        // If we're before the first keyframe, use its parameters
        if time <= self.keyframes[0].time {
            return Some(self.keyframes[0].parameters.clone());
        }
        
        // If we're after the last keyframe, use its parameters
        if let Some(last) = self.keyframes.last() {
            if time >= last.time {
                return Some(last.parameters.clone());
            }
        }
        
        // Find surrounding keyframes and interpolate between them
        if let Some((prev, next)) = self.find_surrounding_keyframes(time) {
            // Calculate interpolation factor (0 to 1)
            let total_duration = next.time.saturating_sub(prev.time);
            let elapsed = time.saturating_sub(prev.time);
            
            // Avoid division by zero
            if total_duration.as_secs_f64() == 0.0 {
                return Some(prev.parameters.clone());
            }
            
            let t = elapsed.as_secs_f64() / total_duration.as_secs_f64();
            
            // Interpolate between the two motion parameters
            return Some(MotionParameters::interpolate(&prev.parameters, &next.parameters, t));
        }
        
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_empty_timeline() {
        let timeline = Timeline::new();
        assert_eq!(timeline.keyframes.len(), 0);
        assert_eq!(timeline.current_time(), Duration::from_secs(0));
    }

    #[test]
    fn test_add_keyframe() {
        let mut timeline = Timeline::new();
        let params = MotionParameters::Linear {
            start: Vector3::zero(),
            end: Vector3::new(1.0, 0.0, 0.0),
            duration: Duration::from_secs(1),
        };
        
        timeline.add_keyframe(Duration::from_secs(1), params.clone());
        assert_eq!(timeline.keyframes.len(), 1);
        assert_eq!(timeline.keyframes[0].parameters, params);
    }

    #[test]
    fn test_get_timeline_duration() {
        let mut timeline = Timeline::new();
        
        // Add keyframes at different times
        let params1 = MotionParameters::Linear {
            start: Vector3::zero(),
            end: Vector3::new(1.0, 0.0, 0.0),
            duration: Duration::from_secs(1),
        };
        
        let params2 = MotionParameters::Circular {
            center: Vector3::zero(),
            radius: 1.0,
            frequency: 1.0,
            plane: CircularPlane::XY,
        };
        
        timeline.add_keyframe(Duration::from_secs(1), params1);
        timeline.add_keyframe(Duration::from_secs(3), params2);
        
        assert_eq!(timeline.duration(), Duration::from_secs(3));
    }

    #[test]
    fn test_keyframe_ordering() {
        let mut timeline = Timeline::new();
        let params = MotionParameters::default();
        
        // Add keyframes in non-sequential order
        timeline.add_keyframe(Duration::from_secs(3), params.clone());
        timeline.add_keyframe(Duration::from_secs(1), params.clone());
        timeline.add_keyframe(Duration::from_secs(2), params.clone());
        
        // Verify they are stored in order
        let times: Vec<u64> = timeline.keyframes.iter()
            .map(|k| k.time.as_secs())
            .collect();
        assert_eq!(times, vec![1, 2, 3]);
    }

    #[test]
    fn test_find_surrounding_keyframes() {
        let mut timeline = Timeline::new();
        let params = MotionParameters::default();
        
        // Add three keyframes
        timeline.add_keyframe(Duration::from_secs(1), params.clone());
        timeline.add_keyframe(Duration::from_secs(3), params.clone());
        timeline.add_keyframe(Duration::from_secs(5), params.clone());
        
        // Test finding keyframes at different times
        let time1 = Duration::from_secs(2);
        if let Some((prev, next)) = timeline.find_surrounding_keyframes(time1) {
            assert_eq!(prev.time.as_secs(), 1);
            assert_eq!(next.time.as_secs(), 3);
        } else {
            panic!("Expected to find surrounding keyframes");
        }
        
        // Test when time is before first keyframe
        let time2 = Duration::from_secs(0);
        assert!(timeline.find_surrounding_keyframes(time2).is_none());
        
        // Test when time is after last keyframe
        let time3 = Duration::from_secs(6);
        assert!(timeline.find_surrounding_keyframes(time3).is_none());
    }

    #[test]
    fn test_current_motion() {
        let mut timeline = Timeline::new();
        
        // Add two keyframes with different motion parameters
        let params1 = MotionParameters::Linear {
            start: Vector3::zero(),
            end: Vector3::new(1.0, 0.0, 0.0),
            duration: Duration::from_secs(1),
        };
        
        let params2 = MotionParameters::Linear {
            start: Vector3::new(1.0, 0.0, 0.0),
            end: Vector3::new(2.0, 0.0, 0.0),
            duration: Duration::from_secs(1),
        };
        
        timeline.add_keyframe(Duration::from_secs(1), params1.clone());
        timeline.add_keyframe(Duration::from_secs(3), params2.clone());
        
        // Test motion at different times
        timeline.set_time(Duration::from_secs(0));
        assert_eq!(timeline.current_motion(), Some(params1.clone()));
        
        timeline.set_time(Duration::from_secs(4));
        assert_eq!(timeline.current_motion(), Some(params2.clone()));
        
        // Test interpolation at midpoint (t = 0.5)
        timeline.set_time(Duration::from_secs(2));
        let interpolated = timeline.current_motion().unwrap();
        match interpolated {
            MotionParameters::Linear { start, end, duration } => {
                // At t = 0.5, we expect:
                // start = lerp(params1.start, params1.end, 0.5) = (0.5, 0, 0)
                // end = lerp(params2.start, params2.end, 0.5) = (1.5, 0, 0)
                assert_eq!(start, Vector3::new(0.5, 0.0, 0.0));
                assert_eq!(end, Vector3::new(1.5, 0.0, 0.0));
                assert_eq!(duration.as_secs(), 1);
            },
            _ => panic!("Expected Linear motion parameters"),
        }
    }
}
