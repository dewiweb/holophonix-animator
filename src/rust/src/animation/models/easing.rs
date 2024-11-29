use std::f64::consts::PI;

pub fn linear(t: f64) -> f64 {
    t
}

pub fn ease_in(t: f64) -> f64 {
    t * t
}

pub fn ease_out(t: f64) -> f64 {
    1.0 - (1.0 - t) * (1.0 - t)
}

pub fn ease_in_out(t: f64) -> f64 {
    if t < 0.5 {
        2.0 * t * t
    } else {
        -1.0 + (4.0 - 2.0 * t) * t
    }
}

pub fn sine_in(t: f64) -> f64 {
    1.0 - (t * PI / 2.0).cos()
}

pub fn sine_out(t: f64) -> f64 {
    (t * PI / 2.0).sin()
}

pub fn sine_in_out(t: f64) -> f64 {
    -(t * PI).cos() / 2.0 + 0.5
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear() {
        assert_eq!(linear(0.0), 0.0);
        assert_eq!(linear(0.5), 0.5);
        assert_eq!(linear(1.0), 1.0);
    }

    #[test]
    fn test_ease_in() {
        assert_eq!(ease_in(0.0), 0.0);
        assert!(ease_in(0.5) < 0.5);
        assert_eq!(ease_in(1.0), 1.0);
    }

    #[test]
    fn test_ease_out() {
        assert_eq!(ease_out(0.0), 0.0);
        assert!(ease_out(0.5) > 0.5);
        assert_eq!(ease_out(1.0), 1.0);
    }

    #[test]
    fn test_ease_in_out() {
        assert_eq!(ease_in_out(0.0), 0.0);
        assert_eq!(ease_in_out(0.5), 0.5);
        assert_eq!(ease_in_out(1.0), 1.0);
    }

    #[test]
    fn test_sine_in() {
        assert!(sine_in(0.0).abs() < 1e-10);
        assert!(sine_in(1.0) - 1.0 < 1e-10);
    }

    #[test]
    fn test_sine_out() {
        assert!(sine_out(0.0).abs() < 1e-10);
        assert!(sine_out(1.0) - 1.0 < 1e-10);
    }

    #[test]
    fn test_sine_in_out() {
        assert!(sine_in_out(0.0).abs() < 1e-10);
        assert!(sine_in_out(0.5) - 0.5 < 1e-10);
        assert!(sine_in_out(1.0) - 1.0 < 1e-10);
    }
}
