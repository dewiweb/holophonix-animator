use std::time::Instant;
use napi::Result;

use crate::position::Position;
use crate::animation::AnimationModel;

#[derive(Debug)]
pub struct PatternModel {
    points: Vec<Position>,
    durations: Vec<f64>,
    current_segment: usize,
    start_time: Option<Instant>,
    is_complete: bool,
}

impl PatternModel {
    pub fn new(points: Vec<Position>, durations: Vec<f64>) -> Self {
        assert!(points.len() >= 2, "Pattern must have at least 2 points");
        assert_eq!(points.len() - 1, durations.len(), "Number of durations must match number of segments");

        Self {
            points,
            durations,
            current_segment: 0,
            start_time: None,
            is_complete: false,
        }
    }

    fn get_total_duration(&self) -> f64 {
        self.durations.iter().sum()
    }

    fn get_segment_start_time(&self, segment: usize) -> f64 {
        self.durations.iter().take(segment).sum()
    }
}

impl AnimationModel for PatternModel {
    fn start(&mut self) -> Result<()> {
        self.start_time = Some(Instant::now());
        self.current_segment = 0;
        self.is_complete = false;
        Ok(())
    }

    fn stop(&mut self) -> Result<()> {
        self.start_time = None;
        self.is_complete = true;
        Ok(())
    }

    fn update(&mut self, _time: f64) -> Result<Position> {
        if self.is_complete {
            return Ok(self.points.last().unwrap().clone());
        }

        let elapsed = match self.start_time {
            Some(start) => start.elapsed().as_secs_f64(),
            None => 0.0,
        };

        let total_duration = self.get_total_duration();
        if elapsed >= total_duration {
            self.is_complete = true;
            return Ok(self.points.last().unwrap().clone());
        }

        // Find current segment
        let mut segment_start_time = 0.0;
        for (i, &duration) in self.durations.iter().enumerate() {
            if elapsed >= segment_start_time && elapsed < segment_start_time + duration {
                self.current_segment = i;
                let segment_progress = (elapsed - segment_start_time) / duration;
                return Ok(Position::lerp(
                    &self.points[i],
                    &self.points[i + 1],
                    segment_progress,
                ));
            }
            segment_start_time += duration;
        }

        // If we get here, we're at the end
        self.is_complete = true;
        Ok(self.points.last().unwrap().clone())
    }

    fn is_complete(&self) -> Result<bool> {
        Ok(self.is_complete)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pattern_model() {
        let points = vec![
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 0.0),
        ];
        let durations = vec![5.0, 5.0];
        let mut model = PatternModel::new(points, durations);

        // Test initial state
        assert!(!model.is_complete().unwrap());

        // Test start
        model.start().unwrap();
        assert!(!model.is_complete().unwrap());

        // Test first segment midpoint
        let pos = model.update(2.5).unwrap();
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);

        // Test second segment midpoint
        let pos = model.update(7.5).unwrap();
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 5.0);
        assert_eq!(pos.z, 0.0);

        // Test completion
        let pos = model.update(10.0).unwrap();
        assert_eq!(pos.x, 10.0);
        assert_eq!(pos.y, 10.0);
        assert_eq!(pos.z, 0.0);
        assert!(model.is_complete().unwrap());

        // Test stop
        model.stop().unwrap();
        assert!(model.is_complete().unwrap());
    }

    #[test]
    #[should_panic(expected = "Pattern must have at least 2 points")]
    fn test_pattern_model_invalid_points() {
        PatternModel::new(
            vec![Position::new(0.0, 0.0, 0.0)],
            vec![],
        );
    }

    #[test]
    #[should_panic(expected = "Number of durations must match number of segments")]
    fn test_pattern_model_invalid_durations() {
        PatternModel::new(
            vec![
                Position::new(0.0, 0.0, 0.0),
                Position::new(1.0, 1.0, 1.0),
            ],
            vec![1.0, 1.0], // Should only be one duration for two points
        );
    }
}
