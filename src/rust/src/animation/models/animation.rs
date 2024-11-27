use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub name: String,
    pub duration: f64,
    pub loop_count: i32,
    pub start_time: f64,
    pub end_time: f64,
    pub is_playing: bool,
    pub is_paused: bool,
    pub is_muted: bool,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            duration: 0.0,
            loop_count: 1,
            start_time: 0.0,
            end_time: 0.0,
            is_playing: false,
            is_paused: false,
            is_muted: false,
        }
    }

    #[napi]
    pub fn play(&mut self) {
        self.is_playing = true;
        self.is_paused = false;
    }

    #[napi]
    pub fn pause(&mut self) {
        self.is_paused = true;
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_playing = false;
        self.is_paused = false;
    }

    #[napi]
    pub fn mute(&mut self) {
        self.is_muted = true;
    }

    #[napi]
    pub fn unmute(&mut self) {
        self.is_muted = false;
    }
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            duration: 0.0,
            loop_count: 1,
            start_time: 0.0,
            end_time: 0.0,
            is_playing: false,
            is_paused: false,
            is_muted: false,
        }
    }
}

// Implement NAPI traits
impl FromNapiValue for Animation {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = JsObject::from_raw_unchecked(env, napi_val);
        
        Ok(Self {
            id: obj.get::<_, String>("id")?.unwrap_or_default(),
            name: obj.get::<_, String>("name")?.unwrap_or_default(),
            duration: obj.get::<_, f64>("duration")?.unwrap_or_default(),
            loop_count: obj.get::<_, i32>("loopCount")?.unwrap_or(1),
            start_time: obj.get::<_, f64>("startTime")?.unwrap_or_default(),
            end_time: obj.get::<_, f64>("endTime")?.unwrap_or_default(),
            is_playing: obj.get::<_, bool>("isPlaying")?.unwrap_or_default(),
            is_paused: obj.get::<_, bool>("isPaused")?.unwrap_or_default(),
            is_muted: obj.get::<_, bool>("isMuted")?.unwrap_or_default(),
        })
    }
}

impl ToNapiValue for Animation {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = JsObject::new(env)?;
        
        obj.set("id", val.id)?;
        obj.set("name", val.name)?;
        obj.set("duration", val.duration)?;
        obj.set("loopCount", val.loop_count)?;
        obj.set("startTime", val.start_time)?;
        obj.set("endTime", val.end_time)?;
        obj.set("isPlaying", val.is_playing)?;
        obj.set("isPaused", val.is_paused)?;
        obj.set("isMuted", val.is_muted)?;
        
        Ok(obj.into_raw())
    }
}
