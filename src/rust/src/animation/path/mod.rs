use nalgebra::{Point3, Vector3};
use serde::{Serialize, Deserialize};
use napi::bindgen_prelude::*;
use std::result::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathPointSerde {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub time: f64,
}

#[derive(Debug, Clone)]
pub struct PathPoint {
    pub position: Point3<f64>,
    pub time: f64,
}

impl From<&PathPoint> for PathPointSerde {
    fn from(point: &PathPoint) -> Self {
        Self {
            x: point.position.x,
            y: point.position.y,
            z: point.position.z,
            time: point.time,
        }
    }
}

impl From<PathPointSerde> for PathPoint {
    fn from(serde: PathPointSerde) -> Self {
        Self {
            position: Point3::new(serde.x, serde.y, serde.z),
            time: serde.time,
        }
    }
}

impl Serialize for PathPoint {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        PathPointSerde::from(self).serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for PathPoint {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let helper = PathPointSerde::deserialize(deserializer)?;
        Ok(Self::from(helper))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PathType {
    Linear,
    Bezier,
    Spline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LoopBehavior {
    None,
    Loop,
    PingPong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathConstraints {
    pub min_x: Option<f64>,
    pub max_x: Option<f64>,
    pub min_y: Option<f64>,
    pub max_y: Option<f64>,
    pub min_z: Option<f64>,
    pub max_z: Option<f64>,
}

impl Default for PathConstraints {
    fn default() -> Self {
        Self {
            min_x: None,
            max_x: None,
            min_y: None,
            max_y: None,
            min_z: None,
            max_z: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationPathSerde {
    pub points: Vec<PathPointSerde>,
    pub path_type: PathType,
    pub loop_behavior: LoopBehavior,
    pub constraints: PathConstraints,
}

#[derive(Debug, Clone)]
pub struct AnimationPath {
    pub points: Vec<PathPoint>,
    pub path_type: PathType,
    pub loop_behavior: LoopBehavior,
    pub constraints: PathConstraints,
}

impl From<&AnimationPath> for AnimationPathSerde {
    fn from(path: &AnimationPath) -> Self {
        Self {
            points: path.points.iter().map(PathPointSerde::from).collect(),
            path_type: path.path_type.clone(),
            loop_behavior: path.loop_behavior.clone(),
            constraints: path.constraints.clone(),
        }
    }
}

impl From<AnimationPathSerde> for AnimationPath {
    fn from(serde: AnimationPathSerde) -> Self {
        Self {
            points: serde.points.into_iter().map(PathPoint::from).collect(),
            path_type: serde.path_type,
            loop_behavior: serde.loop_behavior,
            constraints: serde.constraints,
        }
    }
}

impl Serialize for AnimationPath {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        AnimationPathSerde::from(self).serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for AnimationPath {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let helper = AnimationPathSerde::deserialize(deserializer)?;
        Ok(Self::from(helper))
    }
}

impl AnimationPath {
    pub fn new(path_type: PathType, loop_behavior: LoopBehavior) -> Self {
        Self {
            points: Vec::new(),
            path_type,
            loop_behavior,
            constraints: PathConstraints::default(),
        }
    }

    pub fn add_point(&mut self, point: PathPoint) {
        self.points.push(point);
        self.points.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());
    }

    pub fn get_point_at_time(&self, time: f64) -> napi::Result<Point3<f64>> {
        if self.points.is_empty() {
            return Err(Error::from_reason("No points in path"));
        }

        if self.points.len() == 1 {
            return Ok(self.points[0].position);
        }

        match self.path_type {
            PathType::Linear => self.linear_interpolation(time),
            PathType::Bezier => self.bezier_interpolation(time),
            PathType::Spline => self.spline_interpolation(time),
        }
    }

    fn linear_interpolation(&self, time: f64) -> napi::Result<Point3<f64>> {
        let mut prev_point = &self.points[0];
        
        for point in &self.points[1..] {
            if time <= point.time {
                let t = (time - prev_point.time) / (point.time - prev_point.time);
                let x = prev_point.position.x + t * (point.position.x - prev_point.position.x);
                let y = prev_point.position.y + t * (point.position.y - prev_point.position.y);
                let z = prev_point.position.z + t * (point.position.z - prev_point.position.z);
                return Ok(Point3::new(x, y, z));
            }
            prev_point = point;
        }

        Ok(prev_point.position)
    }

    fn bezier_interpolation(&self, time: f64) -> napi::Result<Point3<f64>> {
        // For now, use linear interpolation as a placeholder
        // TODO: Implement proper Bezier curve interpolation
        self.linear_interpolation(time)
    }

    fn spline_interpolation(&self, time: f64) -> napi::Result<Point3<f64>> {
        // For now, use linear interpolation as a placeholder
        // TODO: Implement proper spline interpolation
        self.linear_interpolation(time)
    }

    fn validate_constraints(&self, point: &Point3<f64>) -> bool {
        let x_valid = self.constraints.min_x.map_or(true, |min| point.x >= min) &&
                     self.constraints.max_x.map_or(true, |max| point.x <= max);
        let y_valid = self.constraints.min_y.map_or(true, |min| point.y >= min) &&
                     self.constraints.max_y.map_or(true, |max| point.y <= max);
        let z_valid = self.constraints.min_z.map_or(true, |min| point.z >= min) &&
                     self.constraints.max_z.map_or(true, |max| point.z <= max);
        
        x_valid && y_valid && z_valid
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_path_point_serialization() {
        let point = PathPoint {
            position: Point3::new(1.0, 2.0, 3.0),
            time: 0.5,
        };

        let serialized = serde_json::to_string(&point).unwrap();
        let deserialized: PathPoint = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.position.x, point.position.x);
        assert_eq!(deserialized.position.y, point.position.y);
        assert_eq!(deserialized.position.z, point.position.z);
        assert_eq!(deserialized.time, point.time);
    }

    #[test]
    fn test_animation_path_serialization() {
        let mut path = AnimationPath::new(PathType::Linear, LoopBehavior::None);
        path.add_point(PathPoint {
            position: Point3::new(0.0, 0.0, 0.0),
            time: 0.0,
        });
        path.add_point(PathPoint {
            position: Point3::new(1.0, 1.0, 1.0),
            time: 1.0,
        });

        let serialized = serde_json::to_string(&path).unwrap();
        let deserialized: AnimationPath = serde_json::from_str(&serialized).unwrap();

        assert_eq!(deserialized.points.len(), path.points.len());
        assert_eq!(deserialized.points[0].position.x, path.points[0].position.x);
        assert_eq!(deserialized.points[1].position.x, path.points[1].position.x);
    }

    #[test]
    fn test_linear_interpolation() {
        let mut path = AnimationPath::new(PathType::Linear, LoopBehavior::None);
        path.add_point(PathPoint {
            position: Point3::new(0.0, 0.0, 0.0),
            time: 0.0,
        });
        path.add_point(PathPoint {
            position: Point3::new(1.0, 1.0, 1.0),
            time: 1.0,
        });

        let point = path.get_point_at_time(0.5).unwrap();
        assert_eq!(point.x, 0.5);
        assert_eq!(point.y, 0.5);
        assert_eq!(point.z, 0.5);
    }
}
