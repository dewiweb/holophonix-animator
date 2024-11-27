use std::collections::HashMap;
use tokio::sync::mpsc::{self, Receiver, Sender};
use serde::{Serialize, Deserialize};
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StateChange {
    Track(String),      // track_id
    Group(String),      // group_id
    Animation(String),  // animation_id
    Timeline,
    Config,
    Selection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeNotification {
    pub id: String,
    pub change: StateChange,
    pub timestamp: SystemTime,
}

#[derive(Default)]
pub struct StateSync {
    subscribers: HashMap<String, Sender<ChangeNotification>>,
}

impl StateSync {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn subscribe(&mut self, id: String) -> Receiver<ChangeNotification> {
        let (tx, rx) = mpsc::channel(100);
        self.subscribers.insert(id, tx);
        rx
    }

    pub fn unsubscribe(&mut self, id: &str) {
        self.subscribers.remove(id);
    }

    pub fn notify_change(&mut self, change: StateChange) {
        let dead_subscribers: Vec<String> = self.subscribers
            .iter()
            .filter(|(id, tx)| {
                let notification = ChangeNotification {
                    id: id.to_string(),
                    change: change.clone(),
                    timestamp: SystemTime::now(),
                };
                tx.try_send(notification).is_err()
            })
            .map(|(id, _)| id.clone())
            .collect();

        for id in dead_subscribers {
            self.subscribers.remove(&id);
        }
    }

    pub fn notify_track_change(&mut self, track_id: String) {
        self.notify_change(StateChange::Track(track_id));
    }

    pub fn notify_group_change(&mut self, group_id: String) {
        self.notify_change(StateChange::Group(group_id));
    }

    pub fn notify_animation_change(&mut self, animation_id: String) {
        self.notify_change(StateChange::Animation(animation_id));
    }

    pub fn notify_timeline_change(&mut self) {
        self.notify_change(StateChange::Timeline);
    }

    pub fn notify_config_change(&mut self) {
        self.notify_change(StateChange::Config);
    }

    pub fn notify_selection_change(&mut self) {
        self.notify_change(StateChange::Selection);
    }
}
