#[macro_use]
extern crate napi_derive;

pub mod animation;
pub mod error;
pub mod models;
pub mod position;
pub mod state;

// Re-export commonly used types
pub use animation::Animation;
pub use error::{AnimatorError, AnimatorResult};
pub use models::{AnimationModel, Position};
pub use state::StateManager;

#[napi]
pub fn init() -> napi::Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initialization() -> napi::Result<()> {
        let _ = init()?;
        Ok(())
    }
}
