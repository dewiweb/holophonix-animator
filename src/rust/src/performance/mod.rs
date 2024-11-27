use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::time::{Duration, Instant};
use std::collections::VecDeque;

#[napi]
#[derive(Debug)]
pub struct PerformanceMetrics {
    frame_times: VecDeque<Duration>,
    last_frame_time: Instant,
    max_samples: usize,
}

#[napi]
impl PerformanceMetrics {
    #[napi(constructor)]
    pub fn new(max_samples: Option<i32>) -> Self {
        let max_samples = max_samples.unwrap_or(60) as usize;
        Self {
            frame_times: VecDeque::with_capacity(max_samples),
            last_frame_time: Instant::now(),
            max_samples,
        }
    }

    #[napi]
    pub fn start_frame(&mut self) {
        self.last_frame_time = Instant::now();
    }

    #[napi]
    pub fn end_frame(&mut self) {
        let frame_time = self.last_frame_time.elapsed();
        if self.frame_times.len() >= self.max_samples {
            self.frame_times.pop_front();
        }
        self.frame_times.push_back(frame_time);
    }

    #[napi]
    pub fn get_average_frame_time(&self) -> f64 {
        if self.frame_times.is_empty() {
            return 0.0;
        }
        let sum: Duration = self.frame_times.iter().sum();
        sum.as_secs_f64() / self.frame_times.len() as f64
    }

    #[napi]
    pub fn get_fps(&self) -> f64 {
        let avg_frame_time = self.get_average_frame_time();
        if avg_frame_time == 0.0 {
            return 0.0;
        }
        1.0 / avg_frame_time
    }

    #[napi]
    pub fn reset(&mut self) {
        self.frame_times.clear();
        self.last_frame_time = Instant::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;

    #[test]
    fn test_performance_metrics() {
        let mut metrics = PerformanceMetrics::new(Some(5));
        
        // Test frame timing
        for _ in 0..3 {
            metrics.start_frame();
            sleep(Duration::from_millis(16)); // Simulate ~60 FPS
            metrics.end_frame();
        }

        let avg_frame_time = metrics.get_average_frame_time();
        assert!(avg_frame_time > 0.015 && avg_frame_time < 0.017);

        let fps = metrics.get_fps();
        assert!(fps > 58.0 && fps < 62.0);

        // Test max samples
        for _ in 0..10 {
            metrics.start_frame();
            metrics.end_frame();
        }
        assert!(metrics.frame_times.len() <= 5);

        // Test reset
        metrics.reset();
        assert_eq!(metrics.frame_times.len(), 0);
        assert_eq!(metrics.get_average_frame_time(), 0.0);
    }
}
