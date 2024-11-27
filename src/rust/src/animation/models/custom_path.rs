use crate::{AnimatorError, AnimatorResult};
use crate::animation::models::Position;

#[derive(Debug, Clone)]
pub struct CustomPathModel {
    pub points: Vec<Position>,
}

impl CustomPathModel {
    pub fn new(points: Vec<Position>) -> Self {
        Self { points }
    }

    pub fn evaluate(&self, t: f64) -> AnimatorResult<Position> {
        if self.points.is_empty() {
            return Err(AnimatorError::validation_error("No points defined in custom path"));
        }

        if t <= 0.0 {
            return Ok(self.points[0].clone());
        }
        if t >= 1.0 {
            return Ok(self.points[self.points.len() - 1].clone());
        }

        let segment_length = 1.0 / (self.points.len() - 1) as f64;
        let segment_index = (t / segment_length).floor() as usize;
        let segment_t = (t - segment_index as f64 * segment_length) / segment_length;

        let p0 = &self.points[segment_index];
        let p1 = &self.points[segment_index + 1];

        Ok(Position {
            x: p0.x + (p1.x - p0.x) * segment_t,
            y: p0.y + (p1.y - p0.y) * segment_t,
            z: p0.z + (p1.z - p0.z) * segment_t,
        })
    }
}
