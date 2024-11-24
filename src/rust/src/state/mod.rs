use std::path::PathBuf;
use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use crate::osc::types::TrackParameters;
use std::sync::Arc;
use tokio::sync::Mutex;

mod animation;
mod config;
mod group;
mod persistence;
mod selection;
mod sync;
mod timeline;
mod track;

pub use animation::*;
pub use config::*;
pub use group::*;
pub use persistence::*;
pub use selection::*;
pub use sync::*;
pub use timeline::*;
pub use track::*;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: String,
    pub parameters: TrackParameters,
}

#[napi]
pub struct StateManager {
    track_state: Arc<Mutex<track::TrackState>>,
    animation_state: Arc<Mutex<animation::AnimationState>>,
    group_state: Arc<Mutex<group::GroupState>>,
    selection_state: Arc<Mutex<selection::SelectionState>>,
    timeline: Arc<Mutex<timeline::Timeline>>,
    config_state: Arc<Mutex<config::ConfigState>>,
    sync: Arc<Mutex<sync::StateSync>>,
    save_dir: PathBuf,
    tracks: Vec<TrackState>,
}

#[napi]
impl StateManager {
    #[napi(constructor)]
    pub fn new(save_dir: PathBuf) -> Result<Self> {
        std::fs::create_dir_all(&save_dir)
            .map_err(|e| Error::from_reason(format!("Failed to create state directory: {}", e)))?;

        let sync = StateSync::new();

        Ok(Self {
            track_state: Arc::new(Mutex::new(track::TrackState::default())),
            animation_state: Arc::new(Mutex::new(animation::AnimationState::default())),
            group_state: Arc::new(Mutex::new(group::GroupState::default())),
            selection_state: Arc::new(Mutex::new(selection::SelectionState::default())),
            timeline: Arc::new(Mutex::new(timeline::Timeline::default())),
            config_state: Arc::new(Mutex::new(config::ConfigState::default())),
            sync: Arc::new(Mutex::new(sync)),
            save_dir,
            tracks: Vec::new(),
        })
    }

    #[napi]
    pub async fn get_active_animations(&self) -> Result<Vec<String>> {
        match self.animation_state.lock().await {
            Ok(animation_state) => Ok(animation_state.get_active_animations()),
            Err(_) => Err(Error::from_reason("Failed to lock animation state")),
        }
    }

    #[napi]
    pub async fn get_track_position(&self, track_id: String) -> Result<Option<(f64, f64, f64)>> {
        match self.track_state.lock().await {
            Ok(track_state) => Ok(track_state.get_track_position(&track_id)),
            Err(_) => Err(Error::from_reason("Failed to lock track state")),
        }
    }

    #[napi]
    pub async fn update_track_position(&self, track_id: String, position: (f64, f64, f64)) -> Result<bool> {
        match self.track_state.lock().await {
            Ok(mut track_state) => {
                let updated = track_state.update_track_position(&track_id, position)
                    .map_err(|e| Error::from_reason(format!("Failed to update track position: {}", e)))?;
                Ok(updated)
            }
            Err(_) => Err(Error::from_reason("Failed to lock track state")),
        }
    }

    #[napi]
    pub async fn subscribe(&self, id: String) -> Result<tokio::sync::mpsc::Receiver<sync::ChangeNotification>> {
        match self.sync.lock().await {
            Ok(mut sync) => Ok(sync.subscribe(id)),
            Err(_) => Err(Error::from_reason("Failed to lock sync state")),
        }
    }

    #[napi]
    pub async fn unsubscribe(&self, id: String) -> Result<()> {
        match self.sync.lock().await {
            Ok(mut sync) => {
                sync.unsubscribe(&id);
                Ok(())
            }
            Err(_) => Err(Error::from_reason("Failed to lock sync state")),
        }
    }

    #[napi]
    pub async fn save_state(&self) -> Result<()> {
        self.save_tracks().await?;
        self.save_animations().await?;
        self.save_groups().await?;
        self.save_timeline().await?;
        self.save_config().await?;
        Ok(())
    }

    #[napi]
    pub async fn load_state(&mut self) -> Result<()> {
        self.load_tracks().await?;
        self.load_animations().await?;
        self.load_groups().await?;
        self.load_timeline().await?;
        self.load_config().await?;
        Ok(())
    }

    #[napi]
    pub async fn update_track(&mut self, track_id: String, parameters: TrackParameters) -> Result<()> {
        if let Some(track) = self.tracks.iter_mut().find(|t| t.id == track_id) {
            track.parameters = parameters;
        } else {
            self.tracks.push(TrackState {
                id: track_id,
                parameters,
            });
        }

        if let Ok(mut sync) = self.sync.try_lock().await {
            sync.notify_change(sync::StateChange::Track(track_id));
        }

        self.save_tracks().await
    }

    #[napi]
    pub async fn get_track(&self, track_id: String) -> Option<TrackState> {
        self.tracks.iter().find(|t| t.id == track_id).cloned()
    }

    #[napi]
    pub async fn get_all_tracks(&self) -> Vec<TrackState> {
        self.tracks.clone()
    }

    async fn save_tracks(&self) -> Result<()> {
        let tracks = self.tracks.clone();
        let path = self.save_dir.join("tracks.json");
        let json = serde_json::to_string_pretty(&tracks)
            .map_err(|e| Error::from_reason(format!("Failed to serialize tracks: {}", e)))?;
        std::fs::write(&path, json)
            .map_err(|e| Error::from_reason(format!("Failed to write tracks file: {}", e)))?;
        Ok(())
    }

    async fn load_tracks(&mut self) -> Result<()> {
        let path = self.save_dir.join("tracks.json");
        if !path.exists() {
            return Ok(());
        }
        let json = std::fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read tracks file: {}", e)))?;
        self.tracks = serde_json::from_str(&json)
            .map_err(|e| Error::from_reason(format!("Failed to deserialize tracks: {}", e)))?;
        Ok(())
    }

    async fn save_animations(&self) -> Result<()> {
        let animations = self.animation_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock animation state"))?;
        let path = self.save_dir.join("animations.json");
        let json = serde_json::to_string_pretty(&*animations)
            .map_err(|e| Error::from_reason(format!("Failed to serialize animations: {}", e)))?;
        std::fs::write(&path, json)
            .map_err(|e| Error::from_reason(format!("Failed to write animations file: {}", e)))?;
        Ok(())
    }

    async fn load_animations(&mut self) -> Result<()> {
        let path = self.save_dir.join("animations.json");
        if !path.exists() {
            return Ok(());
        }
        let json = std::fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read animations file: {}", e)))?;
        let animations: AnimationState = serde_json::from_str(&json)
            .map_err(|e| Error::from_reason(format!("Failed to deserialize animations: {}", e)))?;
        let mut animation_state = self.animation_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock animation state"))?;
        *animation_state = animations;
        Ok(())
    }

    async fn save_groups(&self) -> Result<()> {
        let groups = self.group_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock group state"))?;
        let path = self.save_dir.join("groups.json");
        let json = serde_json::to_string_pretty(&*groups)
            .map_err(|e| Error::from_reason(format!("Failed to serialize groups: {}", e)))?;
        std::fs::write(&path, json)
            .map_err(|e| Error::from_reason(format!("Failed to write groups file: {}", e)))?;
        Ok(())
    }

    async fn load_groups(&mut self) -> Result<()> {
        let path = self.save_dir.join("groups.json");
        if !path.exists() {
            return Ok(());
        }
        let json = std::fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read groups file: {}", e)))?;
        let groups: GroupState = serde_json::from_str(&json)
            .map_err(|e| Error::from_reason(format!("Failed to deserialize groups: {}", e)))?;
        let mut group_state = self.group_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock group state"))?;
        *group_state = groups;
        Ok(())
    }

    async fn save_timeline(&self) -> Result<()> {
        let timeline = self.timeline.lock().await
            .map_err(|_| Error::from_reason("Failed to lock timeline state"))?;
        let path = self.save_dir.join("timeline.json");
        let json = serde_json::to_string_pretty(&*timeline)
            .map_err(|e| Error::from_reason(format!("Failed to serialize timeline: {}", e)))?;
        std::fs::write(&path, json)
            .map_err(|e| Error::from_reason(format!("Failed to write timeline file: {}", e)))?;
        Ok(())
    }

    async fn load_timeline(&mut self) -> Result<()> {
        let path = self.save_dir.join("timeline.json");
        if !path.exists() {
            return Ok(());
        }
        let json = std::fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read timeline file: {}", e)))?;
        let timeline: Timeline = serde_json::from_str(&json)
            .map_err(|e| Error::from_reason(format!("Failed to deserialize timeline: {}", e)))?;
        let mut timeline_state = self.timeline.lock().await
            .map_err(|_| Error::from_reason("Failed to lock timeline state"))?;
        *timeline_state = timeline;
        Ok(())
    }

    async fn save_config(&self) -> Result<()> {
        let config = self.config_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock config state"))?;
        let path = self.save_dir.join("config.json");
        let json = serde_json::to_string_pretty(&*config)
            .map_err(|e| Error::from_reason(format!("Failed to serialize config: {}", e)))?;
        std::fs::write(&path, json)
            .map_err(|e| Error::from_reason(format!("Failed to write config file: {}", e)))?;
        Ok(())
    }

    async fn load_config(&mut self) -> Result<()> {
        let path = self.save_dir.join("config.json");
        if !path.exists() {
            return Ok(());
        }
        let json = std::fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read config file: {}", e)))?;
        let config: ConfigState = serde_json::from_str(&json)
            .map_err(|e| Error::from_reason(format!("Failed to deserialize config: {}", e)))?;
        let mut config_state = self.config_state.lock().await
            .map_err(|_| Error::from_reason("Failed to lock config state"))?;
        *config_state = config;
        Ok(())
    }
}
