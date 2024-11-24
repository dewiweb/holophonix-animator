use crate::state::animation::*;

#[test]
fn test_animation_creation() {
    let mut state = AnimationState::new();
    
    assert!(state.add_animation(
        "anim1".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    ));
    
    // Test duplicate animation
    assert!(!state.add_animation(
        "anim1".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    ));
}

#[test]
fn test_animation_removal() {
    let mut state = AnimationState::new();
    
    state.add_animation(
        "anim1".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    );
    
    assert!(state.remove_animation("anim1"));
    assert!(!state.remove_animation("anim1")); // Already removed
}

#[test]
fn test_animation_progress() {
    let mut state = AnimationState::new();
    
    state.add_animation(
        "anim1".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    );
    
    assert!(state.update_progress("anim1", 0.5));
    let animation = state.get_animation("anim1").unwrap();
    assert_eq!(animation.progress, 0.5);
    
    // Test progress clamping
    assert!(state.update_progress("anim1", 1.5));
    let animation = state.get_animation("anim1").unwrap();
    assert_eq!(animation.progress, 1.0);
}

#[test]
fn test_animation_models() {
    let mut state = AnimationState::new();
    
    // Test Linear
    state.add_animation(
        "linear".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    );
    
    // Test Circular
    state.add_animation(
        "circular".to_string(),
        AnimationModel::Circular {
            center: (0.0, 0.0),
            radius: 1.0,
            speed: 1.0,
            clockwise: true,
        },
        "track2".to_string(),
    );
    
    // Test Random
    state.add_animation(
        "random".to_string(),
        AnimationModel::Random {
            bounds: ((-1.0, -1.0), (1.0, 1.0)),
            speed: 1.0,
        },
        "track3".to_string(),
    );
    
    // Test Custom Path
    state.add_animation(
        "custom".to_string(),
        AnimationModel::CustomPath {
            points: vec![(0.0, 0.0), (1.0, 1.0), (2.0, 0.0)],
            duration: 1.0,
            loop_animation: true,
        },
        "track4".to_string(),
    );
    
    let animations = state.get_active_animations();
    assert_eq!(animations.len(), 4);
}

#[test]
fn test_track_animations() {
    let mut state = AnimationState::new();
    
    state.add_animation(
        "anim1".to_string(),
        AnimationModel::Linear {
            start: (0.0, 0.0),
            end: (1.0, 1.0),
            duration: 1.0,
        },
        "track1".to_string(),
    );
    
    state.add_animation(
        "anim2".to_string(),
        AnimationModel::Linear {
            start: (1.0, 1.0),
            end: (2.0, 2.0),
            duration: 1.0,
        },
        "track1".to_string(),
    );
    
    let track_animations = state.get_track_animations("track1");
    assert_eq!(track_animations.len(), 2);
}
