use serde::{Serialize, Deserialize};
use napi::bindgen_prelude::*;
use std::time::Duration;

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnimationType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
    Quadratic,
    Cubic,
    Exponential,
    Elastic,
    Bounce,
    Custom(String),
}

impl FromNapiValue for AnimationType {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let string = String::from_napi_value(env, napi_val)?;
        match string.as_str() {
            "Linear" => Ok(AnimationType::Linear),
            "EaseIn" => Ok(AnimationType::EaseIn),
            "EaseOut" => Ok(AnimationType::EaseOut),
            "EaseInOut" => Ok(AnimationType::EaseInOut),
            "Quadratic" => Ok(AnimationType::Quadratic),
            "Cubic" => Ok(AnimationType::Cubic),
            "Exponential" => Ok(AnimationType::Exponential),
            "Elastic" => Ok(AnimationType::Elastic),
            "Bounce" => Ok(AnimationType::Bounce),
            custom => Ok(AnimationType::Custom(custom.to_string())),
        }
    }
}

impl ToNapiValue for AnimationType {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let string = match val {
            AnimationType::Linear => "Linear",
            AnimationType::EaseIn => "EaseIn",
            AnimationType::EaseOut => "EaseOut",
            AnimationType::EaseInOut => "EaseInOut",
            AnimationType::Quadratic => "Quadratic",
            AnimationType::Cubic => "Cubic",
            AnimationType::Exponential => "Exponential",
            AnimationType::Elastic => "Elastic",
            AnimationType::Bounce => "Bounce",
            AnimationType::Custom(s) => &s,
        };
        String::to_napi_value(env, string.to_string())
    }
}

#[napi(object)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationConfig {
    #[napi(ts_type = "number")]
    pub duration_ms: u64,
    pub animation_type: AnimationType,
    pub repeat: bool,
    pub repeat_count: Option<u32>,
    pub reverse: bool,
    #[napi(ts_type = "number")]
    pub delay_ms: u64,
}

impl Default for AnimationConfig {
    fn default() -> Self {
        Self {
            duration_ms: 1000,
            animation_type: AnimationType::Linear,
            repeat: false,
            repeat_count: None,
            reverse: false,
            delay_ms: 0,
        }
    }
}

#[napi]
impl AnimationConfig {
    #[napi(constructor)]
    pub fn new(duration_ms: u64, animation_type: AnimationType) -> Self {
        Self {
            duration_ms,
            animation_type,
            ..Default::default()
        }
    }

    #[napi]
    pub fn duration(&self) -> Duration {
        Duration::from_millis(self.duration_ms)
    }

    #[napi]
    pub fn delay(&self) -> Duration {
        Duration::from_millis(self.delay_ms)
    }

    #[napi]
    pub fn with_repeat(mut self, repeat: bool) -> Self {
        self.repeat = repeat;
        self
    }

    #[napi]
    pub fn with_repeat_count(mut self, count: u32) -> Self {
        self.repeat_count = Some(count);
        self
    }

    #[napi]
    pub fn with_reverse(mut self, reverse: bool) -> Self {
        self.reverse = reverse;
        self
    }

    #[napi]
    pub fn with_delay(mut self, delay_ms: u64) -> Self {
        self.delay_ms = delay_ms;
        self
    }
}

impl FromNapiValue for AnimationConfig {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        Ok(Self {
            duration_ms: obj.get::<_, u64>("duration_ms")?.unwrap_or(1000),
            animation_type: obj.get::<_, AnimationType>("animation_type")?.unwrap_or(AnimationType::Linear),
            repeat: obj.get::<_, bool>("repeat")?.unwrap_or(false),
            repeat_count: obj.get::<_, Option<u32>>("repeat_count")?.unwrap_or(None),
            reverse: obj.get::<_, bool>("reverse")?.unwrap_or(false),
            delay_ms: obj.get::<_, u64>("delay_ms")?.unwrap_or(0),
        })
    }
}

impl ToNapiValue for AnimationConfig {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        obj.set("duration_ms", val.duration_ms)?;
        obj.set("animation_type", val.animation_type)?;
        obj.set("repeat", val.repeat)?;
        obj.set("repeat_count", val.repeat_count)?;
        obj.set("reverse", val.reverse)?;
        obj.set("delay_ms", val.delay_ms)?;
        Ok(obj.into_napi_value()?)
    }
}

#[napi(object)]
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub active_animations: usize,
    pub frame_time_ms: f64,
    pub memory_usage_kb: u64,
    pub cpu_usage_percent: f32,
}

impl FromNapiValue for PerformanceMetrics {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object::from_napi_value(env, napi_val)?;
        
        Ok(Self {
            active_animations: obj.get::<_, usize>("active_animations")?.unwrap_or_default(),
            frame_time_ms: obj.get::<_, f64>("frame_time_ms")?.unwrap_or_default(),
            memory_usage_kb: obj.get::<_, u64>("memory_usage_kb")?.unwrap_or_default(),
            cpu_usage_percent: obj.get::<_, f32>("cpu_usage_percent")?.unwrap_or_default(),
        })
    }
}

impl ToNapiValue for PerformanceMetrics {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        obj.set("active_animations", val.active_animations)?;
        obj.set("frame_time_ms", val.frame_time_ms)?;
        obj.set("memory_usage_kb", val.memory_usage_kb)?;
        obj.set("cpu_usage_percent", val.cpu_usage_percent)?;
        Ok(obj.into_napi_value()?)
    }
}
