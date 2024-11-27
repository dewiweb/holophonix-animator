use napi_derive::napi;
use napi::bindgen_prelude::*;
use std::sync::Arc;
use tokio::sync::Mutex;

mod animation;
mod common;
mod error;
mod models;
mod osc;
mod performance;
mod state;
mod tests;

pub use animation::{
    Animation,
    AnimationConfig,
    AnimationType,
    Group,
    GroupManager,
    Timeline,
    TimelineManager,
};

pub use models::{
    Position,
    Position3D,
    TrackParameters,
};

pub use osc::{
    OSCConfig,
    OSCError,
    OSCErrorType,
    TrackParameters as OSCTrackParameters,
    TrackState,
};

pub use error::{AnimatorError, AnimatorResult};
pub use performance::PerformanceMetrics;
pub use state::{StateManager, StateManagerWrapper};

#[napi]
pub struct Animator {
    pub group_manager: GroupManager,
    pub timeline_manager: TimelineManager,
    pub state_manager: StateManagerWrapper,
}

#[napi]
impl Animator {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        let state_manager = StateManagerWrapper::new("".to_string())?;
        let state_manager_arc = Arc::new(Mutex::new(state_manager.inner.clone()));
        
        Ok(Self {
            group_manager: GroupManager::new(state_manager_arc.clone()),
            timeline_manager: TimelineManager::new(state_manager_arc),
            state_manager,
        })
    }

    #[napi]
    pub async unsafe fn update_group(&mut self, id: String, group: Group) -> Result<()> {
        self.group_manager.update_group(id, group).await
    }

    #[napi]
    pub async unsafe fn update_timeline(&mut self, id: String, timeline: Timeline) -> Result<()> {
        self.timeline_manager.update(0.0).await
    }

    #[napi]
    pub async unsafe fn update(&mut self, delta_time: f64) -> Result<()> {
        self.timeline_manager.update(delta_time).await?;
        Ok(())
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;
    use tokio::runtime::Runtime;

    #[test]
    fn test_animator() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let mut animator = Animator::new().unwrap();
            unsafe { animator.update(0.016).await.unwrap() };
        });
    }
}
