use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub duration: f64,
    pub model_type: String,
    pub model_params: serde_json::Value,
    pub playing: bool,
    pub paused: bool,
    pub active: bool,
    pub speed: f64,
    pub loop_enabled: bool,
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::new(),
            duration: 0.0,
            model_type: String::new(),
            model_params: serde_json::Value::Null,
            playing: false,
            paused: false,
            active: true,
            speed: 1.0,
            loop_enabled: false,
        }
    }
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(
        id: String,
        duration: f64,
        model_type: String,
        model_params: serde_json::Value,
        playing: bool,
        paused: bool,
        active: bool,
        speed: f64,
        loop_enabled: bool,
    ) -> Self {
        Self {
            id,
            duration,
            model_type,
            model_params,
            playing,
            paused,
            active,
            speed,
            loop_enabled,
        }
    }

    #[napi]
    pub fn set_playing(&mut self, playing: bool) {
        self.playing = playing;
    }

    #[napi]
    pub fn set_paused(&mut self, paused: bool) {
        self.paused = paused;
    }

    #[napi]
    pub fn set_active(&mut self, active: bool) {
        self.active = active;
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }

    #[napi]
    pub fn set_loop_enabled(&mut self, loop_enabled: bool) {
        self.loop_enabled = loop_enabled;
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    pub duration: f64,
    pub model_type: String,
    pub model_params: serde_json::Value,
}

impl Default for AnimationConfig {
    fn default() -> Self {
        Self {
            duration: 0.0,
            model_type: String::new(),
            model_params: serde_json::Value::Null,
        }
    }
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(duration: f64, model_type: String, model_params: serde_json::Value) -> Self {
        Self {
            duration,
            model_type,
            model_params,
        }
    }
}
