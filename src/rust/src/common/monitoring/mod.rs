use std::time::{Duration, Instant};
use std::collections::VecDeque;
use std::sync::atomic::{AtomicUsize, Ordering};
use crate::error::{AnimatorError, AnimatorResult};

const METRICS_WINDOW_SIZE: usize = 100;

/// Performance metrics for the animation system
#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub frame_time: Duration,
    pub update_time: Duration,
    pub state_sync_time: Duration,
    pub memory_usage: usize,
    pub active_animations: usize,
    pub cache_hits: usize,
    pub cache_misses: usize,
}

/// Performance monitor for tracking system metrics
pub struct PerformanceMonitor {
    frame_times: VecDeque<Duration>,
    update_times: VecDeque<Duration>,
    sync_times: VecDeque<Duration>,
    cache_hits: AtomicUsize,
    cache_misses: AtomicUsize,
    last_gc_time: Instant,
    gc_interval: Duration,
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            frame_times: VecDeque::with_capacity(METRICS_WINDOW_SIZE),
            update_times: VecDeque::with_capacity(METRICS_WINDOW_SIZE),
            sync_times: VecDeque::with_capacity(METRICS_WINDOW_SIZE),
            cache_hits: AtomicUsize::new(0),
            cache_misses: AtomicUsize::new(0),
            last_gc_time: Instant::now(),
            gc_interval: Duration::from_secs(60), // Default GC interval
        }
    }

    /// Record frame processing time
    pub fn record_frame_time(&mut self, duration: Duration) {
        if self.frame_times.len() >= METRICS_WINDOW_SIZE {
            self.frame_times.pop_front();
        }
        self.frame_times.push_back(duration);
    }

    /// Record state update time
    pub fn record_update_time(&mut self, duration: Duration) {
        if self.update_times.len() >= METRICS_WINDOW_SIZE {
            self.update_times.pop_front();
        }
        self.update_times.push_back(duration);
    }

    /// Record state synchronization time
    pub fn record_sync_time(&mut self, duration: Duration) {
        if self.sync_times.len() >= METRICS_WINDOW_SIZE {
            self.sync_times.pop_front();
        }
        self.sync_times.push_back(duration);
    }

    /// Record cache hit
    pub fn record_cache_hit(&self) {
        self.cache_hits.fetch_add(1, Ordering::Relaxed);
    }

    /// Record cache miss
    pub fn record_cache_miss(&self) {
        self.cache_misses.fetch_add(1, Ordering::Relaxed);
    }

    /// Get current performance metrics
    pub fn get_metrics(&self) -> AnimatorResult<PerformanceMetrics> {
        let avg_frame_time = self.average_duration(&self.frame_times)
            .ok_or_else(|| AnimatorError::state_error("No frame time data available"))?;
        
        let avg_update_time = self.average_duration(&self.update_times)
            .ok_or_else(|| AnimatorError::state_error("No update time data available"))?;
            
        let avg_sync_time = self.average_duration(&self.sync_times)
            .ok_or_else(|| AnimatorError::state_error("No sync time data available"))?;

        Ok(PerformanceMetrics {
            frame_time: avg_frame_time,
            update_time: avg_update_time,
            state_sync_time: avg_sync_time,
            memory_usage: self.estimate_memory_usage(),
            active_animations: 0, // Will be set by AnimationEngine
            cache_hits: self.cache_hits.load(Ordering::Relaxed),
            cache_misses: self.cache_misses.load(Ordering::Relaxed),
        })
    }

    /// Check if garbage collection should run
    pub fn should_run_gc(&self) -> bool {
        self.last_gc_time.elapsed() >= self.gc_interval
    }

    /// Set garbage collection interval
    pub fn set_gc_interval(&mut self, interval: Duration) {
        self.gc_interval = interval;
    }

    /// Calculate average duration from a collection of measurements
    fn average_duration(&self, durations: &VecDeque<Duration>) -> Option<Duration> {
        if durations.is_empty() {
            return None;
        }

        let sum: Duration = durations.iter().sum();
        Some(sum / durations.len() as u32)
    }

    /// Estimate current memory usage
    fn estimate_memory_usage(&self) -> usize {
        // Basic estimation of our known memory usage
        let metrics_size = 
            self.frame_times.len() * std::mem::size_of::<Duration>() +
            self.update_times.len() * std::mem::size_of::<Duration>() +
            self.sync_times.len() * std::mem::size_of::<Duration>() +
            std::mem::size_of::<AtomicUsize>() * 2;

        metrics_size
    }

    /// Reset all metrics
    pub fn reset(&mut self) {
        self.frame_times.clear();
        self.update_times.clear();
        self.sync_times.clear();
        self.cache_hits.store(0, Ordering::Relaxed);
        self.cache_misses.store(0, Ordering::Relaxed);
        self.last_gc_time = Instant::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;

    #[test]
    fn test_performance_monitor() {
        let mut monitor = PerformanceMonitor::new();
        
        // Record some metrics
        monitor.record_frame_time(Duration::from_millis(16));
        monitor.record_update_time(Duration::from_millis(5));
        monitor.record_sync_time(Duration::from_millis(2));
        
        // Test cache hit/miss recording
        monitor.record_cache_hit();
        monitor.record_cache_hit();
        monitor.record_cache_miss();
        
        // Get metrics
        let metrics = monitor.get_metrics().unwrap();
        
        assert_eq!(metrics.frame_time, Duration::from_millis(16));
        assert_eq!(metrics.update_time, Duration::from_millis(5));
        assert_eq!(metrics.state_sync_time, Duration::from_millis(2));
        assert_eq!(metrics.cache_hits, 2);
        assert_eq!(metrics.cache_misses, 1);
    }

    #[test]
    fn test_gc_interval() {
        let mut monitor = PerformanceMonitor::new();
        monitor.set_gc_interval(Duration::from_millis(100));
        
        assert!(!monitor.should_run_gc());
        sleep(Duration::from_millis(150));
        assert!(monitor.should_run_gc());
    }
}
