use crate::models::common::Animation as CommonAnimation;
use crate::models::common::Position as CommonPosition;
use crate::models::common::AnimationConfig;
use super::Animation;

impl From<CommonAnimation> for Animation {
    fn from(animation: CommonAnimation) -> Self {
        Self {
            id: animation.id,
            position: CommonPosition::default(),
            duration: animation.config.duration,
            current_time: animation.current_time,
            is_playing: animation.is_playing,
        }
    }
}

impl From<Animation> for CommonAnimation {
    fn from(animation: Animation) -> Self {
        Self {
            id: animation.id,
            config: AnimationConfig {
                duration: animation.duration,
                ..AnimationConfig::default()
            },
            is_playing: animation.is_playing,
            current_time: animation.current_time,
        }
    }
}
