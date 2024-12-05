use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use async_trait::async_trait;
use tokio::sync::mpsc;

use crate::{
    animation::models::Position,
    error::{AnimatorError, AnimatorResult},
    osc::{
        error::{OSCError, OSCErrorType},
        server::OSCServer,
        types::OSCMessage,
    },
    test_utils::fixtures::TestPositions,
};

/// Mock time provider for deterministic testing
pub struct MockTimeProvider {
    current_time: Arc<std::sync::Mutex<Instant>>,
}

impl MockTimeProvider {
    pub fn new() -> Self {
        Self {
            current_time: Arc::new(std::sync::Mutex::new(Instant::now())),
        }
    }

    pub fn advance(&self, duration: Duration) {
        let mut current = self.current_time.lock().unwrap();
        *current = *current + duration;
    }

    pub fn get_time(&self) -> Instant {
        *self.current_time.lock().unwrap()
    }
}

/// Mock OSC server for testing
pub struct MockOSCServer {
    received_messages: Arc<Mutex<Vec<(String, Vec<f32>)>>>,
    is_running: Arc<Mutex<bool>>,
}

impl MockOSCServer {
    pub fn new() -> Self {
        MockOSCServer {
            received_messages: Arc::new(Mutex::new(Vec::new())),
            is_running: Arc::new(Mutex::new(false)),
        }
    }

    pub fn get_received_messages(&self) -> Vec<(String, Vec<f32>)> {
        self.received_messages.lock().unwrap().clone()
    }

    pub fn is_running(&self) -> bool {
        *self.is_running.lock().unwrap()
    }

    pub fn clear_messages(&self) {
        self.received_messages.lock().unwrap().clear();
    }
}

impl OSCServer for MockOSCServer {
    fn send(&mut self, address: &str, args: Vec<f32>) -> Result<(), OSCErrorType> {
        self.received_messages.lock().unwrap().push((address.to_string(), args));
        Ok(())
    }

    fn start(&mut self) -> Result<(), OSCErrorType> {
        *self.is_running.lock().unwrap() = true;
        Ok(())
    }

    fn stop(&mut self) -> Result<(), OSCErrorType> {
        *self.is_running.lock().unwrap() = false;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_mock_time_provider() {
        let provider = MockTimeProvider::new();
        let initial = provider.get_time();
        provider.advance(Duration::from_secs(1));
        assert!(provider.get_time() > initial);
    }

    #[test]
    fn test_mock_server() {
        let mut server = MockOSCServer::new();
        
        // Test initial state
        assert!(!server.is_running());
        assert!(server.get_received_messages().is_empty());

        // Test start
        server.start().unwrap();
        assert!(server.is_running());

        // Test message sending
        server.send("/test/address", vec![1.0, 2.0, 3.0]).unwrap();
        let messages = server.get_received_messages();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].0, "/test/address");
        assert_eq!(messages[0].1, vec![1.0, 2.0, 3.0]);

        // Test stop
        server.stop().unwrap();
        assert!(!server.is_running());

        // Test clear
        server.clear_messages();
        assert!(server.get_received_messages().is_empty());
    }
}
