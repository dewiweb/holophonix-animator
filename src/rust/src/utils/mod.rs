use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

#[napi]
pub fn get_current_time() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::from_secs(0))
        .as_millis() as u64
}

#[napi]
pub fn linear_interpolate(start: f64, end: f64, t: f64) -> f64 {
    start + (end - start) * t.clamp(0.0, 1.0)
}

#[napi]
pub fn ease_in_out(t: f64) -> f64 {
    if t < 0.5 {
        2.0 * t * t
    } else {
        -1.0 + (4.0 - 2.0 * t) * t
    }
}

#[napi]
pub fn ease_in(t: f64) -> f64 {
    t * t
}

#[napi]
pub fn ease_out(t: f64) -> f64 {
    t * (2.0 - t)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_interpolate() {
        assert_eq!(linear_interpolate(0.0, 10.0, 0.5), 5.0);
        assert_eq!(linear_interpolate(0.0, 10.0, 0.0), 0.0);
        assert_eq!(linear_interpolate(0.0, 10.0, 1.0), 10.0);
        // Test clamping
        assert_eq!(linear_interpolate(0.0, 10.0, 1.5), 10.0);
        assert_eq!(linear_interpolate(0.0, 10.0, -0.5), 0.0);
    }

    #[test]
    fn test_easing_functions() {
        // Test ease_in_out
        assert!(ease_in_out(0.0) < 0.1); // Should start slow
        assert!(ease_in_out(0.5) == 0.5); // Should be at midpoint
        assert!(ease_in_out(1.0) > 0.9); // Should end slow
        
        // Test ease_in
        assert!(ease_in(0.0) == 0.0);
        assert!(ease_in(0.5) <= 0.25);
        assert!(ease_in(1.0) == 1.0);
        
        // Test ease_out
        assert!(ease_out(0.0) == 0.0);
        assert!(ease_out(0.5) >= 0.75);
        assert!(ease_out(1.0) == 1.0);
    }

    #[test]
    fn test_get_current_time() {
        let time1 = get_current_time();
        let time2 = get_current_time();
        assert!(time2 >= time1);
    }
}
