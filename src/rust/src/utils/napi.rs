use std::sync::Arc;
use tokio::sync::Mutex;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsyncMutexWrapper<T> {
    #[serde(skip)]
    inner: Arc<Mutex<T>>,
}

impl<T> AsyncMutexWrapper<T> {
    pub fn new(inner: Arc<Mutex<T>>) -> Self {
        Self { inner }
    }

    pub fn inner(&self) -> Arc<Mutex<T>> {
        self.inner.clone()
    }
}

impl<T: Default> Default for AsyncMutexWrapper<T> {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(T::default())),
        }
    }
}

impl<T: Clone> FromNapiValue for AsyncMutexWrapper<T> {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        Ok(AsyncMutexWrapper::default())
    }
}

impl<T: Clone> ToNapiValue for AsyncMutexWrapper<T> {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        Ok(obj.0)
    }
}
