use holophonix_animator_core::{
    state::track::Track,
    animation::{
        models::MotionModel,
        motion::{LinearMotion, CircularMotion},
    },
    math::vector::Vector3,
};
use std::time::Duration;
use approx::assert_relative_eq;

#[cfg(test)]
mod track_tests {
    use super::*;

    #[test]
    fn test_track_creation_and_basic_properties() {
        let track = Track::new("track1", Vector3::new(0.0, 0.0, 0.0));
        
        assert_eq!(track.id(), "track1");
        assert_eq!(track.position(), Vector3::new(0.0, 0.0, 0.0));
        assert!(track.animation().is_none());
        assert!(!track.is_active());
    }

    #[test]
    fn test_track_state_updates() {
        let mut track = Track::new("track2", Vector3::new(1.0, 1.0, 1.0));
        
        track.set_position(Vector3::new(2.0, 2.0, 2.0));
        assert_eq!(track.position(), Vector3::new(2.0, 2.0, 2.0));
        
        track.set_active(true);
        assert!(track.is_active());
    }

    #[test]
    fn test_track_animation_binding() {
        let mut track = Track::new("track3", Vector3::new(0.0, 0.0, 0.0));
        let motion = LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 1.0, 1.0),
            Duration::from_secs(1)
        );
        
        track.bind_animation(Box::new(motion));
        assert!(track.animation().is_some());
        
        // Test position after 0.5 seconds
        let pos = track.animated_position(Duration::from_secs_f64(0.5));
        assert_relative_eq!(pos.x, 0.5);
        assert_relative_eq!(pos.y, 0.5);
        assert_relative_eq!(pos.z, 0.5);
    }

    #[test]
    fn test_track_animation_unbinding() {
        let mut track = Track::new("track4", Vector3::new(0.0, 0.0, 0.0));
        let motion = LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 1.0, 1.0),
            Duration::from_secs(1)
        );
        
        track.bind_animation(Box::new(motion));
        assert!(track.animation().is_some());
        
        track.unbind_animation();
        assert!(track.animation().is_none());
        assert_eq!(track.animated_position(Duration::from_secs_f64(0.5)), track.position());
    }

    #[test]
    fn test_track_metadata() {
        let mut track = Track::new("track5", Vector3::new(0.0, 0.0, 0.0));
        
        track.set_name("Test Track");
        assert_eq!(track.name(), "Test Track");
        
        track.set_description("A test track for validation");
        assert_eq!(track.description(), "A test track for validation");
    }
}
