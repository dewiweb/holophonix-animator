use nalgebra::Point3;
use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point3D {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl napi::bindgen_prelude::ObjectFinalize for Point3D {}

#[napi]
impl Point3D {
    #[napi(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    #[napi]
    pub fn get_x(&self) -> f64 {
        self.x
    }

    #[napi]
    pub fn get_y(&self) -> f64 {
        self.y
    }

    #[napi]
    pub fn get_z(&self) -> f64 {
        self.z
    }

    #[napi]
    pub fn set_x(&mut self, x: f64) {
        self.x = x;
    }

    #[napi]
    pub fn set_y(&mut self, y: f64) {
        self.y = y;
    }

    #[napi]
    pub fn set_z(&mut self, z: f64) {
        self.z = z;
    }

    #[napi]
    pub fn to_array(&self) -> Vec<f64> {
        vec![self.x, self.y, self.z]
    }
}

impl From<Point3<f64>> for Point3D {
    fn from(p: Point3<f64>) -> Self {
        Point3D {
            x: p.x,
            y: p.y,
            z: p.z,
        }
    }
}

impl From<Point3D> for Point3<f64> {
    fn from(p: Point3D) -> Self {
        Point3::new(p.x, p.y, p.z)
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathPoint {
    pub point: Point3D,
    pub time: f64,
}

impl napi::bindgen_prelude::ObjectFinalize for PathPoint {}

#[napi]
impl PathPoint {
    #[napi(constructor)]
    pub fn new(point: Point3D, time: f64) -> Self {
        Self { point, time }
    }

    #[napi]
    pub fn get_point(&self) -> Point3D {
        self.point
    }

    #[napi]
    pub fn get_time(&self) -> f64 {
        self.time
    }
}

#[derive(Debug, Clone)]
#[napi]
pub struct Path {
    points: Arc<Vec<PathPoint>>,
}

#[napi]
impl Path {
    #[napi(constructor)]
    pub fn new(points: Vec<PathPoint>) -> Self {
        Path {
            points: Arc::new(points),
        }
    }

    #[napi]
    pub fn get_points(&self) -> Vec<PathPoint> {
        (*self.points).clone()
    }

    #[napi]
    pub fn interpolate(&self, time: f64) -> Option<Point3D> {
        if self.points.is_empty() {
            return None;
        }

        if time <= self.points[0].time {
            return Some(self.points[0].point.clone());
        }

        if time >= self.points.last().unwrap().time {
            return Some(self.points.last().unwrap().point.clone());
        }

        for i in 0..self.points.len() - 1 {
            let p1 = &self.points[i];
            let p2 = &self.points[i + 1];

            if time >= p1.time && time <= p2.time {
                let t = (time - p1.time) / (p2.time - p1.time);
                let x = p1.point.x + (p2.point.x - p1.point.x) * t;
                let y = p1.point.y + (p2.point.y - p1.point.y) * t;
                let z = p1.point.z + (p2.point.z - p1.point.z) * t;
                return Some(Point3D::new(x, y, z));
            }
        }

        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_point3d_conversion() {
        let p1 = Point3D::new(1.0, 2.0, 3.0);
        let p2: Point3<f64> = p1.clone().into();
        let p3: Point3D = p2.into();

        assert_eq!(p1.x, p3.x);
        assert_eq!(p1.y, p3.y);
        assert_eq!(p1.z, p3.z);
    }

    #[test]
    fn test_path_interpolation() {
        let points = vec![
            PathPoint::new(Point3D::new(0.0, 0.0, 0.0), 0.0),
            PathPoint::new(Point3D::new(1.0, 1.0, 1.0), 1.0),
        ];

        let path = Path::new(points);

        // Test start point
        let p0 = path.interpolate(0.0).unwrap();
        assert_eq!(p0.x, 0.0);
        assert_eq!(p0.y, 0.0);
        assert_eq!(p0.z, 0.0);

        // Test end point
        let p1 = path.interpolate(1.0).unwrap();
        assert_eq!(p1.x, 1.0);
        assert_eq!(p1.y, 1.0);
        assert_eq!(p1.z, 1.0);

        // Test middle point
        let p_mid = path.interpolate(0.5).unwrap();
        assert_eq!(p_mid.x, 0.5);
        assert_eq!(p_mid.y, 0.5);
        assert_eq!(p_mid.z, 0.5);
    }
}
