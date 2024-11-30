use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EasingFunction {
    Linear,
    QuadraticIn,
    QuadraticOut,
    QuadraticInOut,
    CubicIn,
    CubicOut,
    CubicInOut,
}

#[napi]
impl EasingFunction {
    #[napi]
    pub fn apply(&self, t: f64) -> f64 {
        // Clamp input to [0,1]
        let t = t.max(0.0).min(1.0);
        
        match self {
            EasingFunction::Linear => t,
            EasingFunction::QuadraticIn => t * t,
            EasingFunction::QuadraticOut => {
                let t1 = t - 1.0;
                1.0 - t1 * t1
            }
            EasingFunction::QuadraticInOut => {
                if t < 0.5 {
                    2.0 * t * t
                } else {
                    let t1 = 2.0 * t - 2.0;
                    -0.5 * (t1 * t1 - 2.0)
                }
            }
            EasingFunction::CubicIn => t * t * t,
            EasingFunction::CubicOut => {
                let t1 = t - 1.0;
                1.0 + t1 * t1 * t1
            }
            EasingFunction::CubicInOut => {
                if t < 0.5 {
                    4.0 * t * t * t
                } else {
                    let t1 = t - 1.0;
                    1.0 + t1 * t1 * t1 * 4.0
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use float_cmp::assert_approx_eq;

    #[test]
    fn test_linear() {
        let f = EasingFunction::Linear;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.5), 0.5);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_quadratic_in() {
        let f = EasingFunction::QuadraticIn;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.5), 0.25);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_quadratic_out() {
        let f = EasingFunction::QuadraticOut;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.5), 0.75);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_quadratic_in_out() {
        let f = EasingFunction::QuadraticInOut;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.25), 0.125);
        assert_approx_eq!(f64, f.apply(0.5), 0.5);
        assert_approx_eq!(f64, f.apply(0.75), 0.875);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_cubic_in() {
        let f = EasingFunction::CubicIn;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.5), 0.125);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_cubic_out() {
        let f = EasingFunction::CubicOut;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.5), 0.875);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_cubic_in_out() {
        let f = EasingFunction::CubicInOut;
        assert_approx_eq!(f64, f.apply(0.0), 0.0);
        assert_approx_eq!(f64, f.apply(0.25), 0.0625);
        assert_approx_eq!(f64, f.apply(0.5), 0.5);
        assert_approx_eq!(f64, f.apply(0.75), 0.9375);
        assert_approx_eq!(f64, f.apply(1.0), 1.0);
    }

    #[test]
    fn test_input_clamping() {
        let f = EasingFunction::Linear;
        assert_approx_eq!(f64, f.apply(-1.0), 0.0);
        assert_approx_eq!(f64, f.apply(2.0), 1.0);
    }
}
