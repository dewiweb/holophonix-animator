use crate::osc::server::OSCServer;
use crate::osc::types::{OSCConfig, TrackState};
use rosc::{OscMessage, OscType};
use std::net::UdpSocket;
use tokio::sync::Mutex;

fn setup_server() -> OSCServer {
    let config = OSCConfig {
        client_address: "127.0.0.1".to_string(),
        client_port: 57120,
        server_address: "127.0.0.1".to_string(),
        server_port: 57121,
    };
    OSCServer::new(config).unwrap()
}

fn create_message(addr: &str, args: Vec<OscType>) -> OscMessage {
    OscMessage {
        addr: addr.to_string(),
        args,
    }
}

#[tokio::test]
async fn test_cartesian_coordinates() {
    let server = setup_server();
    let track_id = "1";

    // Test x coordinate
    let msg = create_message(
        &format!("/track/{}/x", track_id),
        vec![OscType::Float(0.5)],
    );
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.cartesian.as_ref().unwrap().x, 0.5);

    // Test y coordinate
    let msg = create_message(
        &format!("/track/{}/y", track_id),
        vec![OscType::Float(-0.5)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.cartesian.as_ref().unwrap().y, -0.5);

    // Test z coordinate
    let msg = create_message(
        &format!("/track/{}/z", track_id),
        vec![OscType::Float(0.0)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.cartesian.as_ref().unwrap().z, 0.0);
}

#[tokio::test]
async fn test_polar_coordinates() {
    let server = setup_server();
    let track_id = "1";

    // Test azimuth
    let msg = create_message(
        &format!("/track/{}/azim", track_id),
        vec![OscType::Float(180.0)],
    );
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.polar.as_ref().unwrap().azim, 180.0);

    // Test elevation
    let msg = create_message(
        &format!("/track/{}/elev", track_id),
        vec![OscType::Float(45.0)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.polar.as_ref().unwrap().elev, 45.0);

    // Test distance
    let msg = create_message(
        &format!("/track/{}/dist", track_id),
        vec![OscType::Float(0.5)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.polar.as_ref().unwrap().dist, 0.5);
}

#[tokio::test]
async fn test_audio_properties() {
    let server = setup_server();
    let track_id = "1";

    // Test gain
    let msg = create_message(
        &format!("/track/{}/gain", track_id),
        vec![OscType::Float(-6.0)],
    );
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.gain, -6.0);

    // Test mute
    let msg = create_message(
        &format!("/track/{}/mute", track_id),
        vec![OscType::Int(1)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert!(track.parameters.mute);
}

#[tokio::test]
async fn test_visual_properties() {
    let server = setup_server();
    let track_id = "1";

    // Test color
    let msg = create_message(
        &format!("/track/{}/color", track_id),
        vec![OscType::Int(1)],
    );
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.parameters.color, 1);

    // Test visibility
    let msg = create_message(
        &format!("/track/{}/visible", track_id),
        vec![OscType::Int(0)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert!(!track.parameters.visible);
}

#[tokio::test]
async fn test_animation_control() {
    let server = setup_server();
    let track_id = "1";

    // Test animation start
    let msg = create_message(
        &format!("/track/{}/animation/start", track_id),
        vec![],
    );
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert!(track.animation_state.is_playing);

    // Test animation pause
    let msg = create_message(
        &format!("/track/{}/animation/pause", track_id),
        vec![],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert!(!track.animation_state.is_playing);

    // Test animation reset
    let msg = create_message(
        &format!("/track/{}/animation/reset", track_id),
        vec![],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.animation_state.current_time, 0.0);

    // Test animation speed
    let msg = create_message(
        &format!("/track/{}/animation/speed", track_id),
        vec![OscType::Float(2.0)],
    );
    drop(states);
    server.handle_message(msg).await.unwrap();
    
    let states = server.track_states.lock().await;
    let track = states.get(track_id).unwrap();
    assert_eq!(track.animation_state.speed, 2.0);
}

#[tokio::test]
async fn test_error_handling() {
    let server = setup_server();
    let track_id = "1";

    // Test invalid message format
    let msg = create_message(
        &format!("/track/{}/invalid", track_id),
        vec![],
    );
    assert!(server.handle_message(msg).await.is_err());

    // Test invalid coordinate value
    let msg = create_message(
        &format!("/track/{}/x", track_id),
        vec![OscType::Float(2.0)],
    );
    assert!(server.handle_message(msg).await.is_err());

    // Test missing arguments
    let msg = create_message(
        &format!("/track/{}/gain", track_id),
        vec![],
    );
    assert!(server.handle_message(msg).await.is_err());
}
