use crate::animation::models::Position;
use crate::error::{AnimatorError, AnimatorResult};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct AnimationGroup {
    pub id: String,
    pub tracks: HashMap<String, Position>,
    pub is_active: bool,
    pub is_paused: bool,
}

impl AnimationGroup {
    pub fn new(id: String) -> Self {
        Self {
            id,
            tracks: HashMap::new(),
            is_active: false,
            is_paused: false,
        }
    }

    pub fn add_track(&mut self, track_id: String, position: Position) {
        self.tracks.insert(track_id, position);
    }

    pub fn remove_track(&mut self, track_id: &str) -> Option<Position> {
        self.tracks.remove(track_id)
    }

    pub fn get_track_position(&self, track_id: &str) -> Option<&Position> {
        self.tracks.get(track_id)
    }

    pub fn update_track_position(&mut self, track_id: String, position: Position) {
        self.tracks.insert(track_id, position);
    }

    pub fn clear_tracks(&mut self) {
        self.tracks.clear();
    }

    pub fn pause(&mut self) {
        self.is_paused = true;
    }

    pub fn resume(&mut self) {
        self.is_paused = false;
    }

    pub fn stop(&mut self) {
        self.is_active = false;
        self.is_paused = false;
    }

    pub fn start(&mut self) {
        self.is_active = true;
        self.is_paused = false;
    }
}

#[derive(Debug)]
pub struct GroupManager {
    groups: Arc<Mutex<HashMap<String, AnimationGroup>>>,
}

impl GroupManager {
    pub fn new() -> Self {
        Self {
            groups: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn create_group(&self, group_id: String) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        if groups.contains_key(&group_id) {
            return Err(AnimatorError::validation_error(format!(
                "Group {} already exists",
                group_id
            )));
        }
        groups.insert(group_id.clone(), AnimationGroup::new(group_id));
        Ok(())
    }

    pub async fn remove_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        if !groups.contains_key(group_id) {
            return Err(AnimatorError::validation_error(format!(
                "Group {} does not exist",
                group_id
            )));
        }
        groups.remove(group_id);
        Ok(())
    }

    pub async fn add_track_to_group(
        &self,
        group_id: &str,
        track_id: String,
        position: Position,
    ) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.add_track(track_id, position);
        Ok(())
    }

    pub async fn remove_track_from_group(
        &self,
        group_id: &str,
        track_id: &str,
    ) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.remove_track(track_id);
        Ok(())
    }

    pub async fn pause_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.pause();
        Ok(())
    }

    pub async fn resume_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.resume();
        Ok(())
    }

    pub async fn stop_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.stop();
        Ok(())
    }

    pub async fn start_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.start();
        Ok(())
    }

    pub async fn clear_group(&self, group_id: &str) -> AnimatorResult<()> {
        let mut groups = self.groups.lock().await;
        let group = groups.get_mut(group_id).ok_or_else(|| {
            AnimatorError::validation_error(format!("Group {} does not exist", group_id))
        })?;
        group.clear_tracks();
        Ok(())
    }
}
