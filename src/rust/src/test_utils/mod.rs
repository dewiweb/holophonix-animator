use std::sync::Arc;
use tokio::sync::Mutex;

use crate::{
    animation::AnimationEngine,
    error::AnimatorResult,
    osc::{
        server::OSCServer,
        types::OSCMessage,
    },
    state::StateManager,
    Position,
};

pub mod fixtures;
pub mod mocks;

pub use fixtures::*;
pub use mocks::*;

pub struct TestContext {
    pub animation_manager: Arc<Mutex<AnimationEngine>>,
    pub state_manager: Arc<Mutex<StateManager>>,
    pub osc_server: Option<Arc<Mutex<mocks::MockOscServer>>>,
}

impl TestContext {
    pub async fn new() -> AnimatorResult<Self> {
        Ok(Self {
            animation_manager: Arc::new(Mutex::new(AnimationEngine::new())),
            state_manager: Arc::new(Mutex::new(StateManager::new())),
            osc_server: None,
        })
    }

    pub async fn with_osc() -> AnimatorResult<Self> {
        let mut ctx = Self::new().await?;
        ctx.osc_server = Some(Arc::new(Mutex::new(mocks::MockOscServer::new())));
        Ok(ctx)
    }

    pub async fn cleanup(&self) -> AnimatorResult<()> {
        if let Some(osc_server) = &self.osc_server {
            osc_server.lock().await.clear_messages().await;
        }
        Ok(())
    }
}

pub struct TestPositions;

impl TestPositions {
    pub fn origin() -> Position {
        Position {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            rx: 0.0,
            ry: 0.0,
            rz: 0.0,
        }
    }

    pub fn unit() -> Position {
        Position {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            rx: 1.0,
            ry: 1.0,
            rz: 1.0,
        }
    }
}
