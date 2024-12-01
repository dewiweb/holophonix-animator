use std::time::{Duration, Instant};

pub struct PerformanceMonitor {
    start_time: Instant,
    frame_times: Vec<Duration>,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            frame_times: Vec::new(),
        }
    }

    pub fn record_frame(&mut self, frame_time: Duration) {
        self.frame_times.push(frame_time);
    }

    pub fn get_average_frame_time(&self) -> Option<Duration> {
        if self.frame_times.is_empty() {
            return None;
        }

        let total: Duration = self.frame_times.iter().sum();
        Some(total / self.frame_times.len() as u32)
    }

    pub fn clear_metrics(&mut self) {
        self.frame_times.clear();
        self.start_time = Instant::now();
    }
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}
