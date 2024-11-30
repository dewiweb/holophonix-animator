use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EasingFunction {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}

impl EasingFunction {
    pub fn calculate(&self, t: f64) -> f64 {
        match self {
            EasingFunction::Linear => t,
            EasingFunction::EaseIn => t * t,
            EasingFunction::EaseOut => t * (2.0 - t),
            EasingFunction::EaseInOut => {
                if t < 0.5 {
                    2.0 * t * t
                } else {
                    -1.0 + (4.0 - 2.0 * t) * t
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_easing() {
        let easing = EasingFunction::Linear;
        assert_eq!(easing.calculate(0.0), 0.0);
        assert_eq!(easing.calculate(0.5), 0.5);
        assert_eq!(easing.calculate(1.0), 1.0);
    }

    #[test]
    fn test_ease_in() {
        let easing = EasingFunction::EaseIn;
        assert_eq!(easing.calculate(0.0), 0.0);
        assert_eq!(easing.calculate(0.5), 0.25);
        assert_eq!(easing.calculate(1.0), 1.0);
    }

    #[test]
    fn test_ease_out() {
        let easing = EasingFunction::EaseOut;
        assert_eq!(easing.calculate(0.0), 0.0);
        assert_eq!(easing.calculate(0.5), 0.75);
        assert_eq!(easing.calculate(1.0), 1.0);
    }

    #[test]
    fn test_ease_in_out() {
        let easing = EasingFunction::EaseInOut;
        assert_eq!(easing.calculate(0.0), 0.0);
        assert_eq!(easing.calculate(0.25), 0.125);
        assert_eq!(easing.calculate(0.5), 0.5);
        assert_eq!(easing.calculate(0.75), 0.875);
        assert_eq!(easing.calculate(1.0), 1.0);
    }
}
