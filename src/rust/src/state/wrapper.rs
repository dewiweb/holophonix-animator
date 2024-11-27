use napi::bindgen_prelude::*;
use napi_derive::napi;
use crate::models::common::{Animation, Position};
use super::core::StateManager;

#[napi]
#[derive(Debug)]
pub struct StateManagerWrapper {
    #[napi(skip)]
    pub inner: StateManager,
}

impl ObjectFinalize for StateManagerWrapper {}

#[napi]
impl StateManagerWrapper {
    #[napi(constructor)]
    pub fn new(state_dir: String) -> napi::Result<Self> {
        Ok(Self {
            inner: StateManager::new(state_dir)?
        })
    }

    #[napi]
    pub async unsafe fn add_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        self.inner.add_position(id, position).await
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> napi::Result<Option<Position>> {
        self.inner.get_position(&id).await
    }

    #[napi]
    pub async unsafe fn remove_position(&mut self, id: String) -> napi::Result<()> {
        self.inner.remove_position(&id).await
    }

    #[napi]
    pub fn get_position_count(&self) -> napi::Result<i32> {
        self.inner.get_position_count()
    }

    #[napi]
    pub fn get_all_positions(&self) -> napi::Result<Vec<Position>> {
        self.inner.get_all_positions()
    }

    #[napi]
    pub async unsafe fn update_track_position(&mut self, id: String, position: (f64, f64)) -> napi::Result<()> {
        self.inner.update_track_position(id, position).await
    }

    #[napi]
    pub async unsafe fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        self.inner.add_animation(animation).await
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        self.inner.get_animation(id).await
    }

    #[napi]
    pub async unsafe fn update_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        self.inner.update_position(id, position).await
    }

    #[napi]
    pub fn get_state(&self) -> napi::Result<Vec<Position>> {
        self.inner.get_all_positions()
    }

    #[napi]
    pub async unsafe fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        self.inner.update(delta_time).await
    }
}

impl Default for StateManagerWrapper {
    fn default() -> Self {
        Self {
            inner: StateManager::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::runtime::Runtime;

    #[test]
    fn test_state_manager_wrapper() {
        let rt = Runtime::new().unwrap();
        rt.block_on(async {
            let mut wrapper = StateManagerWrapper::new("test".to_string()).unwrap();
            let position = Position {
                x: 1.0,
                y: 2.0,
                z: 3.0,
            };

            unsafe { wrapper.add_position("test".to_string(), position.clone()).await.unwrap() };
            let retrieved = wrapper.get_position("test".to_string()).await.unwrap();
            assert!(retrieved.is_some());
            assert_eq!(retrieved.unwrap().x, position.x);

            unsafe { wrapper.remove_position("test".to_string()).await.unwrap() };
            let retrieved = wrapper.get_position("test".to_string()).await.unwrap();
            assert!(retrieved.is_none());
        });
    }
}
