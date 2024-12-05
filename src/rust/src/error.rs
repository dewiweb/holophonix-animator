use thiserror::Error;
use crate::osc::error::OSCError;

pub type AnimatorResult<T> = Result<T, AnimatorError>;

#[derive(Debug, Error)]
pub enum AnimatorError {
    #[error("Animation not found: {0}")]
    AnimationNotFound(String),
    
    #[error("Animation group not found: {0}")]
    GroupNotFound(String),
    
    #[error("Track not found: {0}")]
    TrackNotFound(String),
    
    #[error("Duplicate track: {0}")]
    DuplicateTrack(String),
    
    #[error("Duplicate animation: {0}")]
    DuplicateAnimation(String),
    
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
    
    #[error("OSC error: {0}")]
    OscError(#[from] OSCError),
    
    #[error("Other error: {0}")]
    Other(String),
}

impl From<std::io::Error> for AnimatorError {
    fn from(err: std::io::Error) -> Self {
        AnimatorError::Other(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_messages() {
        let err = AnimatorError::AnimationNotFound("test".to_string());
        assert_eq!(err.to_string(), "Animation not found: test");

        let err = AnimatorError::GroupNotFound("group1".to_string());
        assert_eq!(err.to_string(), "Animation group not found: group1");

        let err = AnimatorError::TrackNotFound("track1".to_string());
        assert_eq!(err.to_string(), "Track not found: track1");
    }
}
