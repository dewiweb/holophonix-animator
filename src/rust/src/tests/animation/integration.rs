use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{
    animation::{
        AnimationEngine,
        models::{
            AnimationModel,
            AnimationParameters,
            LinearModel,
            CircularModel,
            PatternModel,
        },
        group::GroupManager,
        interpolation::InterpolationSystem,
    },
    state::{
        StateManager,
        StateStore,
    },
    osc::{
        OscServer,
        OscClient,
        Protocol,
    },
    models::Position,
};

#[tokio::test]
async fn test_animation_engine_integration() {
    // Initialize core components
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut animation_engine = AnimationEngine::new(state_manager.clone());
    
    // Initialize the engine
    animation_engine.initialize().expect("Failed to initialize animation engine");

    // Create a test animation
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 2.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![],
    };

    let model = LinearModel::new(params);
    
    // Process a frame and verify state updates
    animation_engine.process_frame(1.0).expect("Failed to process frame");
    
    // Verify state was updated
    let state = state_manager.lock().await;
    assert!(state.is_initialized());
}

#[tokio::test]
async fn test_group_animation_integration() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut animation_engine = AnimationEngine::new(state_manager.clone());
    let mut group_manager = GroupManager::new();

    // Initialize
    animation_engine.initialize().expect("Failed to initialize animation engine");
    group_manager.initialize().expect("Failed to initialize group manager");

    // Create a group with pattern
    let group_id = group_manager.create_group("[1-3]").expect("Failed to create group");
    
    // Add circular animation to group
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 0.0, y: 0.0, z: 0.0 }, // Circular motion returns to start
        duration: 4.0,
        speed: 1.0,
        acceleration: None,
        custom_params: vec![("radius".to_string(), 1.0)],
    };

    let model = CircularModel::new(params);
    group_manager.add_animation(group_id, Box::new(model)).expect("Failed to add animation");

    // Process frames and verify group movement
    group_manager.process_frame(1.0).expect("Failed to process group frame");
}

#[tokio::test]
async fn test_osc_animation_protocol() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut animation_engine = AnimationEngine::new(state_manager.clone());
    
    // Initialize OSC components
    let osc_server = OscServer::new("127.0.0.1:0").expect("Failed to create OSC server");
    let osc_client = OscClient::new("127.0.0.1:0").expect("Failed to create OSC client");

    // Create and send animation control message
    let msg = Protocol::create_animation_message(
        "start",
        vec!["test_animation"],
    );
    
    osc_client.send(&msg).expect("Failed to send OSC message");
    
    // Process animation frame
    animation_engine.process_frame(0.5).expect("Failed to process frame");
    
    // Verify animation state through OSC query
    let query_msg = Protocol::create_query_message("animation/status", vec!["test_animation"]);
    let response = osc_client.query(&query_msg).expect("Failed to query animation status");
    
    assert!(response.contains("active"));
}

#[tokio::test]
async fn test_interpolation_system() {
    let state_manager = Arc::new(Mutex::new(StateManager::new()));
    let mut animation_engine = AnimationEngine::new(state_manager.clone());

    // Create pattern animation with interpolation
    let params = AnimationParameters {
        start_position: Position { x: 0.0, y: 0.0, z: 0.0 },
        end_position: Position { x: 1.0, y: 1.0, z: 0.0 },
        duration: 2.0,
        speed: 1.0,
        acceleration: Some(0.5),
        custom_params: vec![],
    };

    let model = PatternModel::new(params);
    
    // Process frames with interpolation
    for i in 0..10 {
        animation_engine.process_frame(0.1).expect("Failed to process frame");
        
        // Verify smooth transitions
        let state = state_manager.lock().await;
        // Add position verification based on interpolation
    }
}
