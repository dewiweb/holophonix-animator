use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use crate::{
    animation::models::Position,
    error::AnimatorResult,
    osc::{
        server::OSCServer,
        types::{OSCError, OSCErrorType, OSCMessage},
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
use std::collections::VecDeque;
use rosc::{OscMessage, OscType};
use async_trait::async_trait;

#[derive(Debug, Default)]
pub struct MockOSCServer {
    sent_messages: Arc<Mutex<Vec<OscMessage>>>,
    received_messages: Arc<Mutex<VecDeque<OscMessage>>>,
}

impl MockOSCServer {
    pub fn new() -> Self {
        Self {
            sent_messages: Arc::new(Mutex::new(Vec::new())),
            received_messages: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    pub fn add_message(&self, message: OscMessage) {
        self.received_messages.lock().unwrap().push_back(message);
    }

    pub fn get_sent_messages(&self) -> Vec<OscMessage> {
        self.sent_messages.lock().unwrap().clone()
    }
}

#[async_trait]
impl OSCServer for MockOSCServer {
    async fn send_message(&self, addr: &str, args: Vec<OscType>) -> Result<(), OSCError> {
        if !addr.starts_with('/') {
            return Err(OSCError::new(
                OSCErrorType::Validation,
                "OSC address must start with '/'".to_string(),
            ));
        }

        let message = OscMessage {
            addr: addr.to_string(),
            args,
        };

        self.sent_messages.lock().unwrap().push(message);
        Ok(())
    }

    async fn receive_message(&self) -> Result<OscMessage, OSCError> {
        self.received_messages
            .lock()
            .unwrap()
            .pop_front()
            .ok_or_else(|| OSCError::new(
                OSCErrorType::Protocol,
                "No messages available".to_string(),
            ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_mock_time_provider() {
        let provider = MockTimeProvider::new();
        let start = provider.get_time();
        provider.advance(Duration::from_secs(1));
        let end = provider.get_time();
        assert!(end > start);
        assert_eq!(end - start, Duration::from_secs(1));
    }

    #[tokio::test]
    async fn test_mock_osc_server() {
        let server = MockOSCServer::new();
        
        // Test sending message
        let result = server.send_message("/test", vec![OscType::Float(1.0)]).await;
        assert!(result.is_ok());

        // Test getting messages
        let messages = server.get_sent_messages();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].addr, "/test");
        assert_eq!(messages[0].args.len(), 1);

        // Test receiving message
        server.add_message(OscMessage {
            addr: "/test".to_string(),
            args: vec![OscType::Float(1.0)],
        });
        let received = server.receive_message().await;
        assert!(received.is_ok());
        let message = received.unwrap();
        assert_eq!(message.addr, "/test");
        assert_eq!(message.args.len(), 1);

        // Test receiving from empty queue
        let empty_receive = server.receive_message().await;
        assert!(empty_receive.is_err());
        match empty_receive.unwrap_err().error_type {
            OSCErrorType::Protocol => (),
            _ => panic!("Expected Protocol error"),
        }

        // Test clearing messages
        server.add_message(OscMessage {
            addr: "/test2".to_string(),
            args: vec![OscType::Float(2.0)],
        });
        let messages = server.get_sent_messages();
        assert_eq!(messages.len(), 1);

        // Test validation error
        let invalid_result = server.send_message("", vec![]).await;
        assert!(invalid_result.is_err());
        match invalid_result.unwrap_err().error_type {
            OSCErrorType::Validation => (),
            _ => panic!("Expected Validation error"),
        }
    }
}
