use crate::error::{AnimatorError, AnimatorResult};
use std::f64::consts::PI;

pub trait Interpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64>;
}

#[derive(Debug, Clone)]
pub struct LinearInterpolator;

impl Interpolator for LinearInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }
        Ok(start + (end - start) * t)
    }
}

#[derive(Debug, Clone)]
pub struct EaseInInterpolator;

impl Interpolator for EaseInInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }
        let t = t * t;
        Ok(start + (end - start) * t)
    }
}

#[derive(Debug, Clone)]
pub struct EaseOutInterpolator;

impl Interpolator for EaseOutInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }
        let t = 1.0 - (1.0 - t) * (1.0 - t);
        Ok(start + (end - start) * t)
    }
}

#[derive(Debug, Clone)]
pub struct EaseInOutInterpolator;

impl Interpolator for EaseInOutInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }
        let t = if t < 0.5 {
            2.0 * t * t
        } else {
            -1.0 + (4.0 - 2.0 * t) * t
        };
        Ok(start + (end - start) * t)
    }
}

#[derive(Debug, Clone)]
pub struct BounceInterpolator {
    pub bounces: u32,
    pub elasticity: f64,
}

impl BounceInterpolator {
    pub fn new(bounces: u32, elasticity: f64) -> Self {
        Self { bounces, elasticity }
    }
}

impl Interpolator for BounceInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }

        let mut result = 0.0;
        let mut current_t = t;
        let mut amplitude = 1.0;

        for _ in 0..self.bounces {
            let decay = (1.0 - current_t).powf(2.0);
            result += amplitude * (1.0 - decay);
            amplitude *= self.elasticity;
            current_t = (current_t - 1.0) * 2.0;
            if current_t <= 0.0 {
                break;
            }
        }

        Ok(start + (end - start) * result)
    }
}

#[derive(Debug, Clone)]
pub struct ElasticInterpolator {
    pub frequency: f64,
    pub damping: f64,
}

impl ElasticInterpolator {
    pub fn new(frequency: f64, damping: f64) -> Self {
        Self { frequency, damping }
    }
}

impl Interpolator for ElasticInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }

        let t = t - 1.0;
        let elastic = (-self.damping * t).exp() * (self.frequency * PI * t).cos();
        Ok(start + (end - start) * (1.0 + elastic))
    }
}

#[derive(Debug, Clone)]
pub struct CubicBezierInterpolator {
    pub p1: (f64, f64),
    pub p2: (f64, f64),
}

impl CubicBezierInterpolator {
    pub fn new(p1: (f64, f64), p2: (f64, f64)) -> Self {
        Self { p1, p2 }
    }

    fn cubic_bezier(&self, t: f64) -> f64 {
        let t2 = t * t;
        let t3 = t2 * t;
        let mt = 1.0 - t;
        let mt2 = mt * mt;
        let mt3 = mt2 * mt;

        let x = self.p1.0 * 3.0 * mt2 * t + 
                self.p2.0 * 3.0 * mt * t2 + t3;
        let y = self.p1.1 * 3.0 * mt2 * t + 
                self.p2.1 * 3.0 * mt * t2 + t3;

        y / x
    }
}

impl Interpolator for CubicBezierInterpolator {
    fn interpolate(&self, start: f64, end: f64, t: f64) -> AnimatorResult<f64> {
        if t < 0.0 || t > 1.0 {
            return Err(AnimatorError::validation_error(
                "Interpolation parameter t must be between 0 and 1",
            ));
        }

        let y = self.cubic_bezier(t);
        Ok(start + (end - start) * y)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_interpolation() {
        let interpolator = LinearInterpolator;
        assert_eq!(interpolator.interpolate(0.0, 1.0, 0.5).unwrap(), 0.5);
        assert_eq!(interpolator.interpolate(0.0, 10.0, 0.1).unwrap(), 1.0);
        
        // Test bounds
        assert!(interpolator.interpolate(0.0, 1.0, -0.1).is_err());
        assert!(interpolator.interpolate(0.0, 1.0, 1.1).is_err());
    }

    #[test]
    fn test_ease_in_out_interpolation() {
        let interpolator = EaseInOutInterpolator;
        assert!(interpolator.interpolate(0.0, 1.0, 0.5).unwrap() == 0.5);
        assert!(interpolator.interpolate(0.0, 1.0, 0.25).unwrap() < 0.25);
        assert!(interpolator.interpolate(0.0, 1.0, 0.75).unwrap() > 0.75);
        
        // Test bounds
        assert!(interpolator.interpolate(0.0, 1.0, -0.1).is_err());
        assert!(interpolator.interpolate(0.0, 1.0, 1.1).is_err());
    }

    #[test]
    fn test_cubic_bezier_interpolation() {
        let interpolator = CubicBezierInterpolator::new((0.42, 0.0), (0.58, 1.0));
        assert!(interpolator.interpolate(0.0, 1.0, 0.5).unwrap() == 0.5);
        
        // Test bounds
        assert!(interpolator.interpolate(0.0, 1.0, -0.1).is_err());
        assert!(interpolator.interpolate(0.0, 1.0, 1.1).is_err());
    }

    #[test]
    fn test_bounce_interpolation() {
        let interpolator = BounceInterpolator::new(2, 0.5);
        let result = interpolator.interpolate(0.0, 1.0, 0.5).unwrap();
        assert!(result >= 0.0 && result <= 1.0);
        
        // Test bounds
        assert!(interpolator.interpolate(0.0, 1.0, -0.1).is_err());
        assert!(interpolator.interpolate(0.0, 1.0, 1.1).is_err());
    }

    #[test]
    fn test_elastic_interpolation() {
        let interpolator = ElasticInterpolator::new(2.0, 0.5);
        let result = interpolator.interpolate(0.0, 1.0, 0.5).unwrap();
        assert!(result >= 0.0 && result <= 1.0);
        
        // Test bounds
        assert!(interpolator.interpolate(0.0, 1.0, -0.1).is_err());
        assert!(interpolator.interpolate(0.0, 1.0, 1.1).is_err());
    }
}
