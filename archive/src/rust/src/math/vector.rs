use std::ops::{Add, Sub, Mul, Div};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Vector3 {
    #[inline(always)]
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Vector3 { x, y, z }
    }

    #[inline(always)]
    pub fn zero() -> Self {
        Vector3::new(0.0, 0.0, 0.0)
    }

    #[inline(always)]
    pub fn x(&self) -> f64 {
        self.x
    }

    #[inline(always)]
    pub fn y(&self) -> f64 {
        self.y
    }

    #[inline(always)]
    pub fn z(&self) -> f64 {
        self.z
    }

    #[inline(always)]
    pub fn set_x(&mut self, x: f64) {
        self.x = x;
    }

    #[inline(always)]
    pub fn set_y(&mut self, y: f64) {
        self.y = y;
    }

    #[inline(always)]
    pub fn set_z(&mut self, z: f64) {
        self.z = z;
    }

    #[inline(always)]
    pub fn dot(&self, other: &Vector3) -> f64 {
        self.x * other.x + self.y * other.y + self.z * other.z
    }

    #[inline(always)]
    pub fn cross(&self, other: &Vector3) -> Vector3 {
        Vector3 {
            x: self.y * other.z - self.z * other.y,
            y: self.z * other.x - self.x * other.z,
            z: self.x * other.y - self.y * other.x,
        }
    }

    #[inline(always)]
    pub fn magnitude_squared(&self) -> f64 {
        self.dot(self)
    }

    #[inline(always)]
    pub fn magnitude(&self) -> f64 {
        self.magnitude_squared().sqrt()
    }

    #[inline(always)]
    pub fn normalize(&self) -> Vector3 {
        let mag = self.magnitude();
        if mag > 0.0 {
            *self / mag
        } else {
            panic!("Cannot normalize zero vector");
        }
    }

    #[inline(always)]
    pub fn distance(&self, other: &Vector3) -> f64 {
        (*self - *other).magnitude()
    }

    #[inline(always)]
    pub fn angle(&self, other: &Vector3) -> f64 {
        let dot = self.dot(other);
        let mags = (self.magnitude_squared() * other.magnitude_squared()).sqrt();
        if mags == 0.0 {
            0.0
        } else {
            (dot / mags).acos()
        }
    }

    #[inline(always)]
    pub fn lerp(&self, other: &Self, t: f64) -> Self {
        Self::new(
            self.x + (other.x - self.x) * t,
            self.y + (other.y - self.y) * t,
            self.z + (other.z - self.z) * t,
        )
    }

    #[inline(always)]
    pub fn to_aed(&self) -> (f64, f64, f64) {
        let r = self.magnitude();
        if r == 0.0 {
            return (0.0, 0.0, 0.0);
        }

        let azimuth = self.y.atan2(self.x);
        let elevation = (self.z / r).asin();
        
        (azimuth, elevation, r)
    }

    #[inline(always)]
    pub fn from_aed(azimuth: f64, elevation: f64, distance: f64) -> Self {
        let cos_e = elevation.cos();
        Self::new(
            distance * cos_e * azimuth.cos(),
            distance * cos_e * azimuth.sin(),
            distance * elevation.sin(),
        )
    }

    #[inline(always)]
    pub fn rotate_around_axis(&self, axis: &Vector3, angle: f64) -> Vector3 {
        let cos_theta = angle.cos();
        let sin_theta = angle.sin();
        let one_minus_cos = 1.0 - cos_theta;
        
        let axis = axis.normalize();
        let x = axis.x;
        let y = axis.y;
        let z = axis.z;
        
        let rot_matrix = [
            cos_theta + x * x * one_minus_cos,
            x * y * one_minus_cos - z * sin_theta,
            x * z * one_minus_cos + y * sin_theta,
            
            y * x * one_minus_cos + z * sin_theta,
            cos_theta + y * y * one_minus_cos,
            y * z * one_minus_cos - x * sin_theta,
            
            z * x * one_minus_cos - y * sin_theta,
            z * y * one_minus_cos + x * sin_theta,
            cos_theta + z * z * one_minus_cos,
        ];
        
        Vector3::new(
            rot_matrix[0] * self.x + rot_matrix[1] * self.y + rot_matrix[2] * self.z,
            rot_matrix[3] * self.x + rot_matrix[4] * self.y + rot_matrix[5] * self.z,
            rot_matrix[6] * self.x + rot_matrix[7] * self.y + rot_matrix[8] * self.z,
        )
    }

    #[inline(always)]
    pub fn project_onto(&self, onto: &Vector3) -> Vector3 {
        let onto_normalized = onto.normalize();
        onto_normalized * self.dot(&onto_normalized)
    }

    #[inline(always)]
    pub fn reflect(&self, normal: &Vector3) -> Vector3 {
        let normal = normal.normalize();
        *self - 2.0 * self.dot(&normal) * normal
    }
}

impl Add for Vector3 {
    type Output = Vector3;

    #[inline(always)]
    fn add(self, other: Vector3) -> Vector3 {
        Vector3 {
            x: self.x + other.x,
            y: self.y + other.y,
            z: self.z + other.z,
        }
    }
}

impl Sub for Vector3 {
    type Output = Vector3;

    #[inline(always)]
    fn sub(self, other: Vector3) -> Vector3 {
        Vector3 {
            x: self.x - other.x,
            y: self.y - other.y,
            z: self.z - other.z,
        }
    }
}

impl Mul<f64> for Vector3 {
    type Output = Vector3;

    #[inline(always)]
    fn mul(self, scalar: f64) -> Vector3 {
        Vector3 {
            x: self.x * scalar,
            y: self.y * scalar,
            z: self.z * scalar,
        }
    }
}

impl Mul<Vector3> for f64 {
    type Output = Vector3;

    #[inline(always)]
    fn mul(self, v: Vector3) -> Vector3 {
        Vector3 {
            x: self * v.x,
            y: self * v.y,
            z: self * v.z,
        }
    }
}

impl Div<f64> for Vector3 {
    type Output = Vector3;

    #[inline(always)]
    fn div(self, scalar: f64) -> Vector3 {
        let inv_scalar = 1.0 / scalar;
        Vector3 {
            x: self.x * inv_scalar,
            y: self.y * inv_scalar,
            z: self.z * inv_scalar,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::f64::EPSILON;
    use std::f64::consts::PI;

    #[test]
    fn test_vector_creation() {
        let v = Vector3::new(1.0, 2.0, 3.0);
        assert_eq!(v.x(), 1.0);
        assert_eq!(v.y(), 2.0);
        assert_eq!(v.z(), 3.0);
    }

    #[test]
    fn test_vector_operations() {
        let v1 = Vector3::new(1.0, 2.0, 3.0);
        let v2 = Vector3::new(4.0, 5.0, 6.0);
        
        let sum = v1 + v2;
        assert_eq!(sum.x(), 5.0);
        assert_eq!(sum.y(), 7.0);
        assert_eq!(sum.z(), 9.0);
        
        let diff = v2 - v1;
        assert_eq!(diff.x(), 3.0);
        assert_eq!(diff.y(), 3.0);
        assert_eq!(diff.z(), 3.0);
        
        let scaled = v1 * 2.0;
        assert_eq!(scaled.x(), 2.0);
        assert_eq!(scaled.y(), 4.0);
        assert_eq!(scaled.z(), 6.0);
    }

    #[test]
    fn test_vector_dot_product() {
        let v1 = Vector3::new(1.0, 2.0, 3.0);
        let v2 = Vector3::new(4.0, 5.0, 6.0);
        assert_eq!(v1.dot(&v2), 32.0);
    }

    #[test]
    fn test_vector_cross_product() {
        let v1 = Vector3::new(1.0, 0.0, 0.0);
        let v2 = Vector3::new(0.0, 1.0, 0.0);
        let cross = v1.cross(&v2);
        assert_eq!(cross.x(), 0.0);
        assert_eq!(cross.y(), 0.0);
        assert_eq!(cross.z(), 1.0);
    }

    #[test]
    fn test_vector_magnitude() {
        let v = Vector3::new(3.0, 4.0, 0.0);
        assert!((v.magnitude() - 5.0).abs() < EPSILON);
    }

    #[test]
    fn test_vector_normalize() {
        let v = Vector3::new(3.0, 4.0, 0.0);
        let normalized = v.normalize();
        assert!((normalized.magnitude() - 1.0).abs() < EPSILON);
    }

    #[test]
    fn test_vector_angle() {
        let v1 = Vector3::new(1.0, 0.0, 0.0);
        let v2 = Vector3::new(0.0, 1.0, 0.0);
        assert!((v1.angle(&v2) - PI/2.0).abs() < EPSILON);
    }

    #[test]
    fn test_lerp() {
        let v1 = Vector3::new(0.0, 0.0, 0.0);
        let v2 = Vector3::new(1.0, 2.0, 3.0);
        let v_mid = v1.lerp(&v2, 0.5);
        assert_eq!(v_mid.x(), 0.5);
        assert_eq!(v_mid.y(), 1.0);
        assert_eq!(v_mid.z(), 1.5);
    }

    #[test]
    fn test_aed_conversion() {
        // Test basic conversion
        let v = Vector3::new(1.0, 0.0, 0.0);
        let (azimuth, elevation, distance) = v.to_aed();
        let v2 = Vector3::from_aed(azimuth, elevation, distance);
        assert!((v.x() - v2.x()).abs() < EPSILON);
        assert!((v.y() - v2.y()).abs() < EPSILON);
        assert!((v.z() - v2.z()).abs() < EPSILON);

        // Test zero vector
        let zero = Vector3::zero();
        let (a, e, d) = zero.to_aed();
        assert!(a.abs() < EPSILON);
        assert!(e.abs() < EPSILON);
        assert!(d.abs() < EPSILON);

        // Test unit vectors
        let x_unit = Vector3::new(1.0, 0.0, 0.0);
        let (a, e, d) = x_unit.to_aed();
        assert!(a.abs() < EPSILON);
        assert!(e.abs() < EPSILON);
        assert!((d - 1.0).abs() < EPSILON);

        let y_unit = Vector3::new(0.0, 1.0, 0.0);
        let (a, e, d) = y_unit.to_aed();
        assert!((a - PI/2.0).abs() < EPSILON);
        assert!(e.abs() < EPSILON);
        assert!((d - 1.0).abs() < EPSILON);

        let z_unit = Vector3::new(0.0, 0.0, 1.0);
        let (a, e, d) = z_unit.to_aed();
        assert!(a.abs() < EPSILON);
        assert!((e - PI/2.0).abs() < EPSILON);
        assert!((d - 1.0).abs() < EPSILON);
    }
}
