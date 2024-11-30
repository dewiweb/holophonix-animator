use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Serialize, Deserialize};
use crate::animation::path::{AnimationPath, Point3D};
use crate::error::AnimatorError;

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackParameters {
    pub id: String,
    pub source_id: String,
    pub initial_position: Point3D,
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: String,
    pub source_id: String,
    pub current_position: Point3D,
    pub is_active: bool,
}

#[napi]
#[derive(Debug, Clone)]
pub struct Track {
    pub id: String,
    pub name: String,
    pub gain: f64,
    pub mute: bool,
}

#[napi]
impl Track {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Track {
            id,
            name,
            gain: 1.0,
            mute: false,
        }
    }

    #[napi]
    pub fn get_id(&self) -> String {
        self.id.clone()
    }

    #[napi]
    pub fn get_name(&self) -> String {
        self.name.clone()
    }

    #[napi]
    pub fn get_gain(&self) -> f64 {
        self.gain
    }

    #[napi]
    pub fn set_gain(&mut self, gain: f64) {
        self.gain = gain;
    }

    #[napi]
    pub fn is_muted(&self) -> bool {
        self.mute
    }

    #[napi]
    pub fn set_mute(&mut self, mute: bool) {
        self.mute = mute;
    }
}
