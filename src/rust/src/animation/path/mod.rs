use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use crate::error::{AnimatorError, AnimatorResult};
use nalgebra::{Point3, Vector3};
use splines::{Interpolation, Key, Spline};
use std::time::Duration;
use napi::Error;

/// Path types for different animation trajectories
#[derive(Debug, Clone, Serialize, Deserialize, Hash, Eq, PartialEq)]
pub enum PathType {
    Linear,
    Bezier,
    Spline,
    Custom(String),
}

/// Path point with position and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathPoint {
    pub coords: Point3<f64>,
    pub velocity: Option<Vector3<f64>>,
    pub acceleration: Option<Vector3<f64>>,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl PathPoint {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self {
            coords: Point3::new(x, y, z),
            velocity: None,
            acceleration: None,
            metadata: HashMap::new(),
        }
    }

    pub fn with_velocity(mut self, vx: f64, vy: f64, vz: f64) -> Self {
        self.velocity = Some(Vector3::new(vx, vy, vz));
        self
    }

    pub fn with_acceleration(mut self, ax: f64, ay: f64, az: f64) -> Self {
        self.acceleration = Some(Vector3::new(ax, ay, az));
        self
    }
}

/// Animation path definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationPath {
    pub path_type: PathType,
    pub points: Vec<PathPoint>,
    pub duration: f64,
    pub loop_behavior: LoopBehavior,
    pub constraints: Vec<PathConstraint>,
}

impl AnimationPath {
    pub fn new(path_type: PathType) -> Self {
        Self {
            path_type,
            points: Vec::new(),
            duration: 0.0,
            loop_behavior: LoopBehavior::None,
            constraints: Vec::new(),
        }
    }

    pub fn add_point(&mut self, position: Point3<f64>, time: Duration) {
        self.points.push(PathPoint {
            coords: position,
            velocity: None,
            acceleration: None,
            metadata: HashMap::new(),
        });
    }

    pub fn generate_point(&self, time: f64) -> AnimatorResult<PathPoint> {
        if self.points.is_empty() {
            return Err(AnimatorError::ValidationError(String::from("Path has no points")).into());
        }

        match self.path_type {
            PathType::Linear => self.generate_linear_point(time),
            PathType::Bezier => self.generate_bezier_point(time),
            PathType::Spline => self.generate_spline_point(time),
            PathType::Custom(_) => Err(AnimatorError::ValidationError(String::from("Custom path type not supported")).into()),
        }
    }

    fn generate_linear_point(&self, time: f64) -> AnimatorResult<PathPoint> {
        if self.points.len() < 2 {
            return Err(AnimatorError::ValidationError(String::from("Linear path must have at least two points")).into());
        }

        // Find the two points that bound the current time
        let (p1, p2) = self.find_bounding_points(time)?;

        // Linear interpolation between points
        let t = (time - p1.coords.x) / (p2.coords.x - p1.coords.x);
        let position = interpolate_points(&p1.coords, &p2.coords, t);

        Ok(PathPoint {
            coords: position,
            velocity: None,
            acceleration: None,
            metadata: HashMap::new(),
        })
    }

    fn generate_bezier_point(&self, time: f64) -> AnimatorResult<PathPoint> {
        if self.points.len() < 4 {
            return Err(AnimatorError::ValidationError(String::from("Bezier path must have at least four control points")).into());
        }

        // Calculate t parameter (0 to 1)
        let t = time / self.duration;

        // Cubic Bezier interpolation
        let p0 = &self.points[0].coords;
        let p1 = &self.points[1].coords;
        let p2 = &self.points[2].coords;
        let p3 = &self.points[3].coords;

        let position = interpolate_points(p0, p1, t * 3.0) * (1.0 - t).powi(2)
            + interpolate_points(p1, p2, t * 3.0) * 3.0 * t * (1.0 - t)
            + interpolate_points(p2, p3, t * 3.0) * 3.0 * t.powi(2) * (1.0 - t)
            + p3 * t.powi(3);

        Ok(PathPoint {
            coords: position,
            velocity: None,
            acceleration: None,
            metadata: HashMap::new(),
        })
    }

    fn generate_spline_point(&self, time: f64) -> AnimatorResult<PathPoint> {
        if self.points.len() < 2 {
            return Err(AnimatorError::ValidationError(String::from("Spline path must have at least two points")).into());
        }

        // Create spline from points
        let mut spline = Spline::from_vec(
            self.points
                .iter()
                .enumerate()
                .map(|(i, p)| {
                    Key::new(
                        i as f64 / (self.points.len() - 1) as f64,
                        p.coords,
                        Interpolation::Linear,
                    )
                })
                .collect(),
        );

        // Calculate t parameter (0 to 1)
        let t = time / self.duration;
        let position = spline.sample(t).ok_or_else(|| AnimatorError::ValidationError(String::from("Failed to interpolate spline")).into())?;

        Ok(PathPoint {
            coords: position,
            velocity: None,
            acceleration: None,
            metadata: HashMap::new(),
        })
    }

    fn find_bounding_points(&self, time: f64) -> AnimatorResult<(&PathPoint, &PathPoint)> {
        if time < 0.0 || time > self.duration {
            Err(AnimatorError::ValidationError(String::from("Time out of path range")).into())
        } else {
            // Find points that bound the given time
            let mut prev_point = &self.points[0];
            for point in &self.points[1..] {
                if time <= point.coords.x {
                    return Ok((prev_point, point));
                }
                prev_point = point;
            }
            Ok((&self.points[self.points.len() - 2], &self.points[self.points.len() - 1]))
        }
    }
}

/// Loop behavior for paths
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum LoopBehavior {
    None,
    Loop,
    PingPong,
    Custom(u32),
}

/// Path constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathConstraint {
    pub constraint_type: PathConstraintType,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PathConstraintType {
    MaxSpeed,
    MaxAcceleration,
    MinDistance,
    MaxCurvature,
}

/// Path generator for creating animation paths
pub struct PathGenerator {
    interpolators: HashMap<PathType, Box<dyn PathInterpolator>>,
}

/// Trait for path interpolation
pub trait PathInterpolator: Send + Sync {
    fn interpolate(&self, path: &AnimationPath, time: f64) -> AnimatorResult<PathPoint>;
    fn validate(&self, path: &AnimationPath) -> AnimatorResult<()>;
}

impl PathGenerator {
    pub fn new() -> Self {
        let mut generator = Self {
            interpolators: HashMap::new(),
        };
        
        // Register default interpolators
        generator.register_interpolator(
            PathType::Linear,
            Box::new(LinearInterpolator::new())
        );
        generator.register_interpolator(
            PathType::Bezier,
            Box::new(BezierInterpolator::new())
        );
        generator.register_interpolator(
            PathType::Spline,
            Box::new(SplineInterpolator::new())
        );
        
        generator
    }

    /// Register a new path interpolator
    pub fn register_interpolator(
        &mut self,
        path_type: PathType,
        interpolator: Box<dyn PathInterpolator>
    ) {
        self.interpolators.insert(path_type, interpolator);
    }

    /// Generate path point at given time
    pub fn generate_point(&self, path: &AnimationPath, time: f64) -> AnimatorResult<PathPoint> {
        let interpolator = self.interpolators
            .get(&path.path_type)
            .ok_or_else(|| AnimatorError::ValidationError(String::from("No interpolator registered for path type")).into())?;
            
        interpolator.interpolate(path, time)
    }

    /// Validate path configuration
    pub fn validate_path(&self, path: &AnimationPath) -> AnimatorResult<()> {
        // Basic validation
        if path.points.is_empty() {
            return Err(AnimatorError::ValidationError(String::from("Path must have at least one point")).into());
        }
        
        if path.duration <= 0.0 {
            return Err(AnimatorError::ValidationError(String::from("Path duration must be positive")).into());
        }
        
        // Get interpolator and validate
        let interpolator = self.interpolators
            .get(&path.path_type)
            .ok_or_else(|| AnimatorError::ValidationError(String::from("No interpolator registered for path type")).into())?;
            
        interpolator.validate(path)?;
        
        Ok(())
    }
}

/// Linear path interpolator
pub struct LinearInterpolator;

impl LinearInterpolator {
    pub fn new() -> Self {
        Self
    }
}

impl PathInterpolator for LinearInterpolator {
    fn interpolate(&self, path: &AnimationPath, time: f64) -> AnimatorResult<PathPoint> {
        path.generate_point(time)
    }

    fn validate(&self, path: &AnimationPath) -> AnimatorResult<()> {
        if path.points.len() < 2 {
            return Err(AnimatorError::ValidationError(String::from("Linear path must have at least two points")).into());
        }
        Ok(())
    }
}

/// Bezier path interpolator
pub struct BezierInterpolator;

impl BezierInterpolator {
    pub fn new() -> Self {
        Self
    }
}

impl PathInterpolator for BezierInterpolator {
    fn interpolate(&self, path: &AnimationPath, time: f64) -> AnimatorResult<PathPoint> {
        path.generate_point(time)
    }

    fn validate(&self, path: &AnimationPath) -> AnimatorResult<()> {
        if path.points.len() < 4 {
            return Err(AnimatorError::ValidationError(String::from("Bezier path must have at least four control points")).into());
        }
        Ok(())
    }
}

/// Spline path interpolator
pub struct SplineInterpolator;

impl SplineInterpolator {
    pub fn new() -> Self {
        Self
    }
}

impl PathInterpolator for SplineInterpolator {
    fn interpolate(&self, path: &AnimationPath, time: f64) -> AnimatorResult<PathPoint> {
        path.generate_point(time)
    }

    fn validate(&self, path: &AnimationPath) -> AnimatorResult<()> {
        if path.points.len() < 2 {
            return Err(AnimatorError::ValidationError(String::from("Spline path must have at least two points")).into());
        }
        Ok(())
    }
}

pub fn interpolate_points(p1: &Point3<f64>, p2: &Point3<f64>, t: f64) -> Point3<f64> {
    Point3::new(
        p1.x + (p2.x - p1.x) * t,
        p1.y + (p2.y - p1.y) * t,
        p1.z + (p2.z - p1.z) * t,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_interpolation() {
        let mut generator = PathGenerator::new();
        
        let path = AnimationPath {
            path_type: PathType::Linear,
            points: vec![
                PathPoint {
                    coords: Point3::new(0.0, 0.0, 0.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
                PathPoint {
                    coords: Point3::new(1.0, 1.0, 1.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
            ],
            duration: 1.0,
            loop_behavior: LoopBehavior::None,
            constraints: vec![],
        };
        
        let point = generator.generate_point(&path, 0.5).unwrap();
        assert_eq!(point.coords, Point3::new(0.5, 0.5, 0.5));
    }

    #[test]
    fn test_bezier_interpolation() {
        let mut generator = PathGenerator::new();
        
        let path = AnimationPath {
            path_type: PathType::Bezier,
            points: vec![
                PathPoint {
                    coords: Point3::new(0.0, 0.0, 0.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
                PathPoint {
                    coords: Point3::new(0.0, 1.0, 0.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
                PathPoint {
                    coords: Point3::new(1.0, 1.0, 0.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
                PathPoint {
                    coords: Point3::new(1.0, 0.0, 0.0),
                    velocity: None,
                    acceleration: None,
                    metadata: HashMap::new(),
                },
            ],
            duration: 1.0,
            loop_behavior: LoopBehavior::None,
            constraints: vec![],
        };
        
        generator.validate_path(&path).unwrap();
        let point = generator.generate_point(&path, 0.5).unwrap();
        assert!(point.coords.x > 0.0 && point.coords.x < 1.0);
        assert!(point.coords.y > 0.0 && point.coords.y < 1.0);
    }
}
