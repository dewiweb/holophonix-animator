use napi::bindgen_prelude::*;
use std::time::Duration;
use serde::{Deserialize, Serialize};

#[napi]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum CycleMode {
    OneShot,
    Loop,
    PingPong,
}

#[napi]
impl CycleMode {
    #[napi]
    pub fn calculate_progress(&self, elapsed_ms: f64, duration_ms: f64) -> f64 {
        let progress = elapsed_ms / duration_ms;
        
        match self {
            CycleMode::OneShot => progress.clamp(0.0, 1.0),
            CycleMode::Loop => progress.fract(),
            CycleMode::PingPong => {
                let cycle = progress.floor() as i32;
                let fract = progress.fract();
                if cycle % 2 == 0 {
                    fract
                } else {
                    1.0 - fract
                }
            }
        }
    }

    #[napi]
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
            duration_ms,
            delay_ms,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_one_shot_mode() {
        let mode = CycleMode::OneShot;
        let duration_ms = 1000.0;

        assert_eq!(mode.calculate_progress(500.0, duration_ms), 0.5);
        assert_eq!(mode.calculate_progress(2000.0, duration_ms), 1.0);
        assert_eq!(mode.calculate_progress(0.0, duration_ms), 0.0);

        assert!(!mode.is_complete(500.0, duration_ms));
        assert!(mode.is_complete(1000.0, duration_ms));
        assert!(mode.is_complete(2000.0, duration_ms));
    }

    #[test]
    fn test_loop_mode() {
        let mode = CycleMode::Loop;
        let duration_ms = 1000.0;

        assert_eq!(mode.calculate_progress(500.0, duration_ms), 0.5);
        assert_eq!(mode.calculate_progress(2000.0, duration_ms), 0.0);
        assert_eq!(mode.calculate_progress(1500.0, duration_ms), 0.5);

        assert!(!mode.is_complete(2000.0, duration_ms));
    }

    #[test]
    fn test_ping_pong_mode() {
        let mode = CycleMode::PingPong;
        let duration_ms = 1000.0;

        assert_eq!(mode.calculate_progress(500.0, duration_ms), 0.5);
        assert_eq!(mode.calculate_progress(1000.0, duration_ms), 1.0);
        assert_eq!(mode.calculate_progress(1500.0, duration_ms), 0.5);
        assert_eq!(mode.calculate_progress(2000.0, duration_ms), 0.0);

        assert!(!mode.is_complete(2000.0, duration_ms));
    }
}
