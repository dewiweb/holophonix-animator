use std::time::Duration;
use crate::error::AnimatorResult;

pub enum RecoveryStrategy {
    RetryWithBackoff,
    SafeMode,
}

pub struct RecoveryConfig {
    pub max_retries: u32,
    pub base_delay: Duration,
}

pub struct RecoveryManager {
    config: RecoveryConfig,
    retry_count: u32,
}

impl RecoveryManager {
    pub fn new(config: RecoveryConfig) -> Self {
        Self {
            config,
            retry_count: 0,
        }
    }

    pub async fn handle_error(&mut self, error: &dyn std::error::Error, strategy: RecoveryStrategy) -> AnimatorResult<()> {
        match strategy {
            RecoveryStrategy::RetryWithBackoff => {
                if self.retry_count < self.config.max_retries {
                    let delay = self.config.base_delay * (2_u32.pow(self.retry_count));
                    tokio::time::sleep(delay).await;
                    self.retry_count += 1;
                    Ok(())
                } else {
                    self.retry_count = 0;
                    Err(error.to_string().into())
                }
            }
            RecoveryStrategy::SafeMode => {
                // Reset state and enter safe mode
                self.retry_count = 0;
                Ok(())
            }
        }
    }

    pub fn reset(&mut self) {
        self.retry_count = 0;
    }
}
