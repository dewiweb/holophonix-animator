use napi::bindgen_prelude::*;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::time::{Duration, Instant};
use crate::error::AnimatorError;
use crate::state::core::AnimatorState;

/// Recovery strategy types
#[derive(Debug, Clone, Copy)]
pub enum RecoveryStrategy {
    Retry,              // Retry the failed operation
    Rollback,          // Rollback to last known good state
    SafeMode,          // Enter safe mode with reduced functionality
    Reset,             // Complete reset of the system
}

/// Recovery configuration
#[napi(object)]
#[derive(Debug, Clone)]
pub struct RecoveryConfig {
    pub max_retries: u32,
    pub retry_delay_ms: u32,
    pub rollback_depth: u32,
    pub safe_mode_timeout_ms: u32,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            retry_delay_ms: 100,
            rollback_depth: 5,
            safe_mode_timeout_ms: 300000,
        }
    }
}

/// Recovery manager handles error recovery strategies
#[napi]
pub struct RecoveryManager {
    config: RecoveryConfig,
    state: Arc<RwLock<AnimatorState>>,
    safe_mode_start: Option<Instant>,
    retry_count: u32,
}

#[napi]
impl RecoveryManager {
    #[napi(constructor)]
    pub fn new(state: Arc<RwLock<AnimatorState>>) -> Self {
        Self {
            config: RecoveryConfig::default(),
            state,
            safe_mode_start: None,
            retry_count: 0,
        }
    }

    /// Handle error with appropriate recovery strategy
    #[napi]
    pub async fn handle_error(&mut self, error: &AnimatorError) -> napi::Result<RecoveryStrategy> {
        match error {
            AnimatorError::StateError(_) => {
                self.handle_state_error().await?;
                Ok(RecoveryStrategy::Retry)
            }
            AnimatorError::ResourceError(_) => {
                self.handle_resource_error().await?;
                Ok(RecoveryStrategy::Retry)
            }
            AnimatorError::ValidationError(_) => {
                self.handle_validation_error().await?;
                Ok(RecoveryStrategy::Rollback)
            }
            AnimatorError::ExecutionError(_) => {
                self.handle_execution_error().await?;
                Ok(RecoveryStrategy::SafeMode)
            }
            AnimatorError::SyncError(_) => {
                self.handle_sync_error().await?;
                Ok(RecoveryStrategy::Retry)
            }
            _ => Ok(RecoveryStrategy::SafeMode),
        }
    }

    #[napi]
    pub async fn enter_safe_mode(&mut self) -> napi::Result<()> {
        let mut state = self.state.write().await;
        state.enable_safe_mode(true)
            .map_err(|e| Error::from_reason(e.to_string()))?;
        self.safe_mode_start = Some(Instant::now());
        Ok(())
    }

    #[napi]
    pub async fn exit_safe_mode(&mut self) -> napi::Result<()> {
        let mut state = self.state.write().await;
        state.enable_safe_mode(false)
            .map_err(|e| Error::from_reason(e.to_string()))?;
        self.safe_mode_start = None;
        Ok(())
    }

    #[napi]
    pub fn configure(&mut self, config: RecoveryConfig) {
        self.config = config;
    }

    #[napi]
    pub fn reset(&mut self) {
        self.retry_count = 0;
        self.safe_mode_start = None;
    }

    pub fn should_exit_safe_mode(&self) -> bool {
        if let Some(start_time) = self.safe_mode_start {
            let elapsed = start_time.elapsed();
            elapsed.as_millis() >= self.config.safe_mode_timeout_ms as u128
        } else {
            false
        }
    }

    async fn handle_state_error(&mut self) -> napi::Result<()> {
        self.retry_count += 1;
        if self.retry_count > self.config.max_retries {
            self.enter_safe_mode().await?;
        }
        tokio::time::sleep(Duration::from_millis(self.config.retry_delay_ms as u64)).await;
        Ok(())
    }

    async fn handle_resource_error(&mut self) -> napi::Result<()> {
        self.retry_count += 1;
        tokio::time::sleep(Duration::from_millis(self.config.retry_delay_ms as u64)).await;
        Ok(())
    }

    async fn handle_validation_error(&mut self) -> napi::Result<()> {
        Ok(())
    }

    async fn handle_execution_error(&mut self) -> napi::Result<()> {
        self.retry_count += 1;
        if self.retry_count > self.config.max_retries {
            self.enter_safe_mode().await?;
        }
        tokio::time::sleep(Duration::from_millis(self.config.retry_delay_ms as u64)).await;
        Ok(())
    }

    async fn handle_sync_error(&mut self) -> napi::Result<()> {
        tokio::time::sleep(Duration::from_millis(self.config.retry_delay_ms as u64)).await;
        Ok(())
    }
}

#[cfg(test)]
mod tests;
