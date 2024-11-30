use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StateChange {
    TrackAdded(String),
    TrackRemoved(String),
    TrackUpdated(String),
    PositionUpdated(String),
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeNotification {
    pub change_type: StateChange,
    pub timestamp: f64,
}

#[napi]
impl ChangeNotification {
    #[napi(constructor)]
    pub fn new(change_type: StateChange, timestamp: f64) -> Self {
        Self {
            change_type,
            timestamp,
        }
    }

    #[napi]
    pub fn get_change_type(&self) -> StateChange {
        self.change_type.clone()
    }

    #[napi]
    pub fn get_timestamp(&self) -> f64 {
        self.timestamp
    }
}

pub struct StateSync {
    sender: broadcast::Sender<ChangeNotification>,
}

impl StateSync {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self { sender }
    }

    pub fn notify(&self, change: StateChange) {
        let notification = ChangeNotification::new(
            change,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs_f64(),
        );
        let _ = self.sender.send(notification);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<ChangeNotification> {
        self.sender.subscribe()
    }
}

impl Default for StateSync {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{sleep, Duration};

    #[tokio::test]
    async fn test_state_sync() {
        let sync = StateSync::new();
        let mut rx1 = sync.subscribe();
        let mut rx2 = sync.subscribe();

        // Send a notification
        sync.notify(StateChange::TrackAdded("test".to_string()));

        // Wait a bit for the notification to be processed
        sleep(Duration::from_millis(10)).await;

        // Both receivers should get the notification
        let n1 = rx1.try_recv().unwrap();
        let n2 = rx2.try_recv().unwrap();

        match n1.change_type {
            StateChange::TrackAdded(id) => assert_eq!(id, "test"),
            _ => panic!("Wrong change type"),
        }

        match n2.change_type {
            StateChange::TrackAdded(id) => assert_eq!(id, "test"),
            _ => panic!("Wrong change type"),
        }
    }
}
