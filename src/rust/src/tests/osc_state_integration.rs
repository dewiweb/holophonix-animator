use std::sync::Arc;
use std::time::Duration;
use tempfile::tempdir;
use tokio::sync::Mutex;
use crate::osc::{OSCConfig, OSCServer, OSCClient};
use crate::state::StateManager;

#[tokio::test]
async fn test_osc_state_integration() {
    // Setup
    let temp_dir = tempdir().unwrap();
    let state_manager = Arc::new(Mutex::new(StateManager::new(temp_dir.path().to_path_buf())));
    
    let config = OSCConfig {
        client_address: "0.0.0.0".to_string(),
        client_port: 0,
        server_address: "127.0.0.1".to_string(),
        server_port: 9001,
    };

    // Create OSC server with state manager
    let server = OSCServer::with_state_manager(config.clone(), Arc::clone(&state_manager)).unwrap();
    let client = OSCClient::new(config).unwrap();

    // Start server in background
    let server_handle = tokio::spawn(async move {
        server.start_listening().await.unwrap();
    });

    // Give server time to start
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Test track position update via OSC
    client.send_track_position("track1", 0.5, -0.5).await.unwrap();

    // Give time for message processing
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Verify state was updated
    let position = state_manager.lock().await.get_track_position("track1").unwrap().unwrap();
    assert_eq!(position, (0.5, -0.5));

    // Test animation creation via OSC
    client.send_animation_create(
        "anim1",
        "track1",
        "linear",
        &[("start", (0.0, 0.0)), ("end", (1.0, 1.0)), ("duration", 5.0)]
    ).await.unwrap();

    // Give time for message processing
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Verify animation was created
    let animations = state_manager.lock().await.get_active_animations().unwrap();
    assert_eq!(animations.len(), 1);
    assert_eq!(animations[0].id, "anim1");

    // Cleanup
    server_handle.abort();
}

#[tokio::test]
async fn test_osc_state_sync() {
    let temp_dir = tempdir().unwrap();
    let state_manager = Arc::new(Mutex::new(StateManager::new(temp_dir.path().to_path_buf())));
    
    let config = OSCConfig {
        client_address: "0.0.0.0".to_string(),
        client_port: 0,
        server_address: "127.0.0.1".to_string(),
        server_port: 9002,
    };

    // Create OSC server with state manager
    let server = OSCServer::with_state_manager(config.clone(), Arc::clone(&state_manager)).unwrap();
    let client = OSCClient::new(config).unwrap();

    // Start server in background
    let server_handle = tokio::spawn(async move {
        server.start_listening().await.unwrap();
    });

    // Give server time to start
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Make state change through state manager
    {
        let mut manager = state_manager.lock().await;
        let mut track_state = manager.track_state().lock().unwrap();
        track_state.add_track("track1".to_string(), (0.0, 0.0));
        manager.notify_track_change("track1".to_string());
    }

    // Give time for sync
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Verify OSC server has the track
    let track = server.get_track_state("track1").await.unwrap();
    assert_eq!(track.position, (0.0, 0.0));

    // Cleanup
    server_handle.abort();
}
