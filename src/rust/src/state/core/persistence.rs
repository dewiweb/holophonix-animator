use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

use super::config::SystemConfig;
use super::track::TrackState;
use super::group::GroupState;
use super::animation::AnimationState;
use super::timeline::Timeline;

#[derive(Serialize, Deserialize)]
pub struct StateSnapshot {
    pub timestamp: SystemTime,
    pub version: String,
    pub tracks: TrackState,
    pub groups: GroupState,
    pub animations: AnimationState,
    pub timeline: Timeline,
    pub config: SystemConfig,
}

pub struct StatePersistence {
    save_dir: PathBuf,
    current_version: String,
}

impl StatePersistence {
    pub fn new(save_dir: PathBuf) -> Self {
        Self {
            save_dir,
            current_version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }

    pub fn save_snapshot(&self, snapshot: &StateSnapshot) -> Result<PathBuf, Box<dyn Error>> {
        fs::create_dir_all(&self.save_dir)?;
        
        let filename = format!(
            "state_{}_{}.json",
            snapshot.version,
            snapshot.timestamp
                .duration_since(SystemTime::UNIX_EPOCH)?
                .as_secs()
        );
        let filepath = self.save_dir.join(filename);
        
        let json = serde_json::to_string_pretty(snapshot)?;
        fs::write(&filepath, json)?;
        
        Ok(filepath)
    }

    pub fn load_latest_snapshot(&self) -> Result<Option<StateSnapshot>, Box<dyn Error>> {
        if !self.save_dir.exists() {
            return Ok(None);
        }

        let mut entries: Vec<_> = fs::read_dir(&self.save_dir)?
            .filter_map(Result::ok)
            .filter(|entry| {
                entry.path()
                    .extension()
                    .map_or(false, |ext| ext == "json")
            })
            .collect();

        entries.sort_by_key(|entry| {
            fs::metadata(entry.path())
                .and_then(|meta| meta.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH)
        });

        if let Some(latest) = entries.last() {
            let content = fs::read_to_string(latest.path())?;
            let snapshot: StateSnapshot = serde_json::from_str(&content)?;
            Ok(Some(snapshot))
        } else {
            Ok(None)
        }
    }

    pub fn cleanup_old_snapshots(&self, keep_count: usize) -> Result<(), Box<dyn Error>> {
        if !self.save_dir.exists() {
            return Ok(());
        }

        let mut entries: Vec<_> = fs::read_dir(&self.save_dir)?
            .filter_map(Result::ok)
            .filter(|entry| {
                entry.path()
                    .extension()
                    .map_or(false, |ext| ext == "json")
            })
            .collect();

        if entries.len() <= keep_count {
            return Ok(());
        }

        entries.sort_by_key(|entry| {
            fs::metadata(entry.path())
                .and_then(|meta| meta.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH)
        });

        for entry in entries.iter().take(entries.len() - keep_count) {
            fs::remove_file(entry.path())?;
        }

        Ok(())
    }
}
