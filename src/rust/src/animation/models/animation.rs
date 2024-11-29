use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Animation {
    pub id: String,
    pub name: String,
    pub duration: f64,
    pub current_time: f64,
    pub speed: f64,
    pub is_playing: bool,
    pub is_paused: bool,
    pub is_active: bool,
    pub is_looping: bool,
}

#[napi]
impl Animation {
    #[napi(constructor)]
    pub fn new(id: String, name: String) -> Self {
        Self {
            id,
            name,
            duration: 0.0,
            current_time: 0.0,
            speed: 1.0,
            is_playing: false,
            is_paused: false,
            is_active: true,
            is_looping: false,
        }
    }

    #[napi]
    pub fn play(&mut self) {
        if self.is_active {
            self.is_playing = true;
            self.is_paused = false;
        }
    }

    #[napi]
    pub fn pause(&mut self) {
        if self.is_playing {
            self.is_paused = true;
            self.is_playing = false;
        }
    }

    #[napi]
    pub fn stop(&mut self) {
        self.is_playing = false;
        self.is_paused = false;
        self.current_time = 0.0;
    }

    #[napi]
    pub fn set_active(&mut self, active: bool) {
        self.is_active = active;
        if !active {
            self.stop();
        }
    }

    #[napi]
    pub fn set_looping(&mut self, looping: bool) {
        self.is_looping = looping;
    }

    #[napi]
    pub fn set_speed(&mut self, speed: f64) {
        self.speed = speed;
    }

    #[napi]
    pub fn update(&mut self, delta_time: f64) -> napi::Result<()> {
        if self.is_playing && self.is_active && !self.is_paused {
            self.current_time += delta_time * self.speed;
            if self.current_time >= self.duration {
                if self.is_looping {
                    self.current_time = 0.0;
                } else {
                    self.current_time = self.duration;
                    self.stop();
                }
            }
        }
        Ok(())
    }

    #[napi]
    pub fn get_progress(&self) -> f64 {
        if self.duration <= 0.0 {
            return 0.0;
        }
        (self.current_time / self.duration).min(1.0)
    }

    #[napi]
    pub fn is_complete(&self) -> bool {
        !self.is_playing && !self.is_paused && self.current_time >= self.duration
    }
}

impl Default for Animation {
    fn default() -> Self {
        Self {
            id: String::new(),
            name: String::new(),
            duration: 0.0,
            current_time: 0.0,
            speed: 1.0,
            is_playing: false,
            is_paused: false,
            is_active: true,
            is_looping: false,
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
            current_time: obj.get::<_, f64>("currentTime")?.unwrap_or_default(),
            speed: obj.get::<_, f64>("speed")?.unwrap_or(1.0),
            is_playing: obj.get::<_, bool>("isPlaying")?.unwrap_or_default(),
            is_paused: obj.get::<_, bool>("isPaused")?.unwrap_or_default(),
            is_active: obj.get::<_, bool>("isActive")?.unwrap_or(true),
            is_looping: obj.get::<_, bool>("isLooping")?.unwrap_or_default(),
        })
    }
}

impl ToNapiValue for Animation {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = JsObject::new(env)?;
        obj.set("id", val.id)?;
        obj.set("name", val.name)?;
        obj.set("duration", val.duration)?;
        obj.set("currentTime", val.current_time)?;
        obj.set("speed", val.speed)?;
        obj.set("isPlaying", val.is_playing)?;
        obj.set("isPaused", val.is_paused)?;
        obj.set("isActive", val.is_active)?;
        obj.set("isLooping", val.is_looping)?;
        Ok(obj.raw())
    }
}
