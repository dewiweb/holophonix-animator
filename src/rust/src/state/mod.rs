use std::sync::Arc;
use tokio::sync::Mutex;
use napi_derive::napi;

use crate::{Position, error::AnimatorResult};

pub mod wrapper;
pub use wrapper::StateManagerWrapper;

#[napi(object)]
#[derive(Debug, Clone)]
pub struct State {
    pub position: Position,
    pub is_active: bool,
}

#[napi]
impl State {
    #[napi(constructor)]
    pub fn new(position: Position, is_active: bool) -> Self {
        Self {
            position,
            is_active,
        }
    }
}

#[napi]
pub struct StateManager {
    states: Arc<Mutex<Vec<State>>>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            states: Arc::new(Mutex::new(Vec::new())),
        }
    }

    #[napi]
    pub async fn update_state(&self, id: String, state: State) -> AnimatorResult<()> {
        let mut states = self.states.lock().await;
        // TODO: Implement proper state update
        states.push(state);
        Ok(())
    }

    #[napi]
    pub async fn get_state(&self, id: String) -> AnimatorResult<Option<State>> {
        let states = self.states.lock().await;
        // TODO: Implement proper state lookup
        Ok(None)
    }

    #[napi]
    pub async fn remove_state(&self, id: String) -> AnimatorResult<()> {
        let mut states = self.states.lock().await;
        // TODO: Implement proper state removal
        Ok(())
    }
}
