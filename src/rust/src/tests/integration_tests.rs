use std::sync::Arc;
use tokio::sync::Mutex;
use crate::osc::client::OSCClient;
use crate::osc::server::OSCServer;
use crate::osc::types::{OSCConfig, CartesianCoordinates, PolarCoordinates, Color, TrackParameters};
use crate::state::AppState;

#[tokio::test]
async fn test_osc_communication() {
    let config = OSCConfig {
        client_address: "0.0.0.0".to_string(),
        client_port: 0,
        server_address: "127.0.0.1".to_string(),
        server_port: 9000,
    };

    let app_state = Arc::new(Mutex::new(AppState::new(config.clone())));
    
    let client = OSCClient::new(config.clone()).unwrap();
    let server = OSCServer::new(config.clone()).unwrap();

    // Start server in background
    tokio::spawn(async move {
        server.start_listening().await.unwrap();
    });

    // Test sending track parameters
    let track_params = TrackParameters {
        cartesian: Some(CartesianCoordinates {
            x: 0.5,
            y: -0.5,
            z: 0.0,
        }),
        polar: None,
        gain: Some(-6.0),
        mute: Some(false),
        color: Some(Color {
            r: 1.0,
            g: 0.5,
            b: 0.0,
            a: 1.0,
        }),
    };

    client.send_track_parameters("1", &track_params).await.unwrap();

    // Give some time for the message to be processed
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Verify state was updated
    let state = app_state.lock().await;
    let track_state = state.get_track_state("1").unwrap();
    
    assert_eq!(track_state.parameters.cartesian, track_params.cartesian);
    assert_eq!(track_state.parameters.gain, track_params.gain);
    assert_eq!(track_state.parameters.mute, track_params.mute);
    assert_eq!(track_state.parameters.color, track_params.color);
}

#[tokio::test]
async fn test_invalid_messages() {
    let config = OSCConfig {
        client_address: "0.0.0.0".to_string(),
        client_port: 0,
        server_address: "127.0.0.1".to_string(),
        server_port: 9002,
    };

    let client = OSCClient::new(config.clone()).unwrap();

    // Test invalid track parameters
    let invalid_params = TrackParameters {
        cartesian: Some(CartesianCoordinates {
            x: 1.5, // Out of range
            y: -0.5,
            z: 0.0,
        }),
        polar: None,
        gain: None,
        mute: None,
        color: None,
    };

    let result = client.send_track_parameters("1", &invalid_params).await;
    assert!(result.is_err());
}
