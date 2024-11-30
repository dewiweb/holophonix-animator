use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};

#[napi]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[repr(i32)]
pub enum CycleMode {
    OneShot = 0,
    Loop = 1,
    PingPong = 2,
}

impl CycleMode {
    pub fn calculate_progress(&self, elapsed_ms: f64, duration_ms: f64) -> f64 {
        if duration_ms <= 0.0 {
            return 0.0;
        }

        let progress = (elapsed_ms / duration_ms).clamp(0.0, 1.0);
        match self {
            CycleMode::OneShot => progress,
            CycleMode::Loop => progress % 1.0,
            CycleMode::PingPong => {
                let cycle = (progress * 2.0) % 2.0;
                if cycle <= 1.0 {
                    cycle
                } else {
                    2.0 - cycle
                }
            }
        }
    }

    pub fn is_complete(&self, elapsed_ms: f64, duration_ms: f64) -> bool {
        match self {
            CycleMode::OneShot => elapsed_ms >= duration_ms,
            CycleMode::Loop | CycleMode::PingPong => false,
        }
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CycleConfig {
    pub mode: CycleMode,
    pub duration_ms: f64,
    pub delay_ms: f64,
}

#[napi]
impl CycleConfig {
    #[napi(constructor)]
    pub fn new(mode: CycleMode, duration_ms: f64, delay_ms: f64) -> Self {
        Self {
            mode,
            duration_ms: duration_ms.max(0.0),
            delay_ms: delay_ms.max(0.0),
        }
    }

    #[napi]
    pub fn get_mode(&self) -> CycleMode {
        self.mode
    }

    #[napi]
    pub fn get_duration(&self) -> f64 {
        self.duration_ms
    }

    #[napi]
    pub fn get_delay(&self) -> f64 {
        self.delay_ms
    }

    #[napi]
    pub fn calculate_progress(&self, elapsed_ms: f64) -> f64 {
        if elapsed_ms < self.delay_ms {
            return 0.0;
        }
        self.mode.calculate_progress(elapsed_ms - self.delay_ms, self.duration_ms)
    }

    #[napi]
    pub fn is_complete(&self, elapsed_ms: f64) -> bool {
        if elapsed_ms < self.delay_ms {
            return false;
        }
        self.mode.is_complete(elapsed_ms - self.delay_ms, self.duration_ms)
    }
}

impl ObjectFinalize for CycleConfig {}

impl Default for CycleConfig {
    fn default() -> Self {
        Self {
            mode: CycleMode::OneShot,
            duration_ms: 1000.0,
            delay_ms: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use float_cmp::assert_approx_eq;

    #[test]
    fn test_cycle_config() {
        let config = CycleConfig::new(CycleMode::Loop, 1000.0, 500.0);
        assert_eq!(config.get_mode() as i32, CycleMode::Loop as i32);
        assert_approx_eq!(f64, config.get_duration(), 1000.0);
        assert_approx_eq!(f64, config.get_delay(), 500.0);
    }

    #[test]
    fn test_default_config() {
        let config = CycleConfig::default();
        assert_eq!(config.get_mode() as i32, CycleMode::OneShot as i32);
        assert_approx_eq!(f64, config.get_duration(), 1000.0);
        assert_approx_eq!(f64, config.get_delay(), 0.0);
    }

    #[test]
    fn test_cycle_mode_progress() {
        // Test OneShot mode
        let mode = CycleMode::OneShot;
        assert_approx_eq!(f64, mode.calculate_progress(0.0, 1000.0), 0.0);
        assert_approx_eq!(f64, mode.calculate_progress(500.0, 1000.0), 0.5);
        assert_approx_eq!(f64, mode.calculate_progress(1000.0, 1000.0), 1.0);
        assert_approx_eq!(f64, mode.calculate_progress(1500.0, 1000.0), 1.0);

        // Test Loop mode
        let mode = CycleMode::Loop;
        assert_approx_eq!(f64, mode.calculate_progress(0.0, 1000.0), 0.0);
        assert_approx_eq!(f64, mode.calculate_progress(500.0, 1000.0), 0.5);
        assert_approx_eq!(f64, mode.calculate_progress(1500.0, 1000.0), 0.5);
        assert_approx_eq!(f64, mode.calculate_progress(2500.0, 1000.0), 0.5);

        // Test PingPong mode
        let mode = CycleMode::PingPong;
        assert_approx_eq!(f64, mode.calculate_progress(0.0, 1000.0), 0.0);
        assert_approx_eq!(f64, mode.calculate_progress(500.0, 1000.0), 0.5);
        assert_approx_eq!(f64, mode.calculate_progress(1000.0, 1000.0), 1.0);
        assert_approx_eq!(f64, mode.calculate_progress(1500.0, 1000.0), 0.5);
        assert_approx_eq!(f64, mode.calculate_progress(2000.0, 1000.0), 0.0);
    }

    #[test]
    fn test_cycle_mode_completion() {
        // Test OneShot mode
        let mode = CycleMode::OneShot;
        assert!(!mode.is_complete(0.0, 1000.0));
        assert!(!mode.is_complete(500.0, 1000.0));
        assert!(mode.is_complete(1000.0, 1000.0));
        assert!(mode.is_complete(1500.0, 1000.0));

        // Test Loop mode
        let mode = CycleMode::Loop;
        assert!(!mode.is_complete(0.0, 1000.0));
        assert!(!mode.is_complete(1000.0, 1000.0));
        assert!(!mode.is_complete(2000.0, 1000.0));

        // Test PingPong mode
        let mode = CycleMode::PingPong;
        assert!(!mode.is_complete(0.0, 1000.0));
        assert!(!mode.is_complete(1000.0, 1000.0));
        assert!(!mode.is_complete(2000.0, 1000.0));
    }
}
