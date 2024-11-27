use std::collections::HashMap;
use std::path::PathBuf;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use crate::models::common::{Animation, Position};

#[napi]
#[derive(Debug)]
pub struct StateManager {
    #[napi(skip)]
    pub positions: HashMap<String, Position>,
    #[napi(skip)]
    pub animations: HashMap<String, Animation>,
    #[napi(skip)]
    pub state_dir: PathBuf,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new(state_dir: String) -> napi::Result<Self> {
        Ok(Self {
            positions: HashMap::new(),
            animations: HashMap::new(),
            state_dir: PathBuf::from(state_dir),
        })
    }

    #[napi]
    pub async fn add_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        self.positions.insert(id, position);
        Ok(())
    }

    #[napi]
    pub async fn get_position(&self, id: String) -> napi::Result<Option<Position>> {
        Ok(self.positions.get(&id).cloned())
    }

    #[napi]
    pub async fn remove_position(&mut self, id: String) -> napi::Result<()> {
        self.positions.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        self.animations.insert(animation.id.clone(), animation);
        Ok(())
    }

    #[napi]
    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        Ok(self.animations.get(&id).cloned())
    }

    #[napi]
    pub async fn remove_animation(&mut self, id: String) -> napi::Result<()> {
        self.animations.remove(&id);
        Ok(())
    }

    #[napi]
    pub async fn update_animation(&mut self, id: String, animation: Animation) -> napi::Result<()> {
        if let Some(existing) = self.animations.get_mut(&id) {
            *existing = animation;
        }
        Ok(())
    }

    #[napi]
    pub async fn get_all_animations(&self) -> napi::Result<Vec<Animation>> {
        Ok(self.animations.values().cloned().collect())
    }

    #[napi]
    pub async fn get_all_positions(&self) -> napi::Result<Vec<Position>> {
        Ok(self.positions.values().cloned().collect())
    }

    #[napi]
    pub async fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        // Add update logic here
        Ok(())
    }
}

impl StateManager {
    pub fn new(state_dir: String) -> napi::Result<Self> {
        Ok(Self {
            positions: HashMap::new(),
            animations: HashMap::new(),
            state_dir: PathBuf::from(state_dir),
        })
    }

    pub async fn add_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        self.positions.insert(id, position);
        Ok(())
    }

    pub async fn get_position(&self, id: &str) -> napi::Result<Option<Position>> {
        Ok(self.positions.get(id).cloned())
    }

    pub async fn remove_position(&mut self, id: &str) -> napi::Result<()> {
        self.positions.remove(id);
        Ok(())
    }

    pub fn get_position_count(&self) -> napi::Result<i32> {
        Ok(self.positions.len() as i32)
    }

    pub fn get_all_positions(&self) -> napi::Result<Vec<Position>> {
        Ok(self.positions.values().cloned().collect())
    }

    pub async fn update_track_position(&mut self, id: String, position: (f64, f64)) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            pos.x = position.0;
            pos.y = position.1;
        }
        Ok(())
    }

    pub async fn add_animation(&mut self, animation: Animation) -> napi::Result<()> {
        self.animations.insert(animation.id.clone(), animation);
        Ok(())
    }

    pub async fn get_animation(&self, id: String) -> napi::Result<Option<Animation>> {
        Ok(self.animations.get(&id).cloned())
    }

    pub async fn update_position(&mut self, id: String, position: Position) -> napi::Result<()> {
        if let Some(pos) = self.positions.get_mut(&id) {
            *pos = position;
        }
        Ok(())
    }

    pub async fn get_state(&self) -> napi::Result<Vec<Position>> {
        Ok(self.positions.values().cloned().collect())
    }

    pub async fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        // Add update logic here
        Ok(())
    }
}

impl Default for StateManager {
    fn default() -> Self {
        Self {
            positions: HashMap::new(),
            animations: HashMap::new(),
            state_dir: PathBuf::from("state"),
        }
    }
}
