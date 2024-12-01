use holophonix_animator_core::{
    animation::{Animation, AnimationConfig, AnimationModel, LinearModel},
    position::Position,
    test_utils::{
        fixtures::{TestPositions, TestAnimations, TestGroups},
        assertions::{PositionAssertions, TimingAssertions},
        mocks::MockOscServer,
    },
    error::AnimatorResult,
};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::test]
async fn test_linear_animation() -> AnimatorResult<()> {
    let animation = TestAnimations::linear_x();
    let start = animation.config().start_position.clone();
    let end = animation.config().end_position.clone();
    
    // Test initial state
    let current = animation.current_position();
    start.assert_approx_eq(&current);
    
    // Test midpoint
    animation.update(Duration::from_millis(500));
    let midpoint = animation.current_position();
    let expected_midpoint = start.interpolate(&end, 0.5);
    midpoint.assert_approx_eq(&expected_midpoint);
    
    // Test end state
    animation.update(Duration::from_millis(500));
    let final_pos = animation.current_position();
    end.assert_approx_eq(&final_pos);
    Ok(())
}

#[tokio::test]
async fn test_animation_looping() -> AnimatorResult<()> {
    let config = AnimationConfig {
        start_position: TestPositions::origin(),
        end_position: TestPositions::unit_x(),
        duration_ms: 1000,
        loop_count: 2,
    };
    
    let animation = Animation::new(
        "test_loop".to_string(),
        Box::new(LinearModel::new()),
        config,
    );
    
    // Complete first loop
    animation.update(Duration::from_millis(1000));
    let pos1 = animation.current_position();
    TestPositions::unit_x().assert_approx_eq(&pos1);
    
    // Should reset to start for second loop
    animation.update(Duration::from_millis(1));
    let pos2 = animation.current_position();
    TestPositions::origin().assert_approx_eq(&pos2);
    Ok(())
}

#[tokio::test]
async fn test_osc_server_integration() -> AnimatorResult<()> {
    let server = MockOscServer::new();
    let animation = TestAnimations::linear_x();
    
    // Send initial position
    animation.send_position(&server).await?;
    
    let messages = server.messages();
    assert_eq!(messages.len(), 1);
    
    let msg = &messages[0];
    assert_eq!(msg.address, "/source/1/xyz");
    
    // Clear messages and update position
    server.clear_messages();
    animation.update(Duration::from_millis(500));
    animation.send_position(&server).await?;
    
    let messages = server.messages();
    assert_eq!(messages.len(), 1);
    Ok(())
}

#[tokio::test]
async fn test_full_animation_pipeline() -> AnimatorResult<()> {
    let ctx = TestContext::with_osc().await?;
    let mock_osc = MockOscServer::new();

    // 1. Initialize animation
    let config = TestAnimations::linear_1s();
    ctx.animation_manager.add_animation("test_track", config.clone()).await?;

    // 2. Start playback
    ctx.animation_manager.play().await?;
    
    // 3. Run animation for 0.5 seconds
    sleep(Duration::from_millis(500)).await;
    
    // 4. Verify position update
    let pos = ctx.state_manager.get_position("test_track").await?;
    let expected_pos = Position::new(0.5, 0.0, 0.0, 0.0, 0.0, 0.0);
    pos.unwrap().assert_near(&expected_pos, 1e-2);

    // 5. Verify OSC messages
    let messages = mock_osc.get_messages().await;
    assert!(!messages.is_empty());

    // 6. Cleanup
    ctx.cleanup().await?;
    Ok(())
}

#[tokio::test]
async fn test_group_animation_sync() -> AnimatorResult<()> {
    let ctx = TestContext::new().await?;

    // Create a group of animations
    let configs = vec![
        TestAnimations::linear_1s(),
        TestAnimations::circular_2s(),
    ];

    // Add animations to group
    for (i, config) in configs.iter().enumerate() {
        ctx.animation_manager.add_to_group("test_group", format!("track_{}", i), config.clone()).await?;
    }

    // Start group playback
    ctx.animation_manager.play_group("test_group").await?;

    // Run for 1 second
    sleep(Duration::from_secs(1)).await;

    // Verify all tracks are synchronized
    for i in 0..2 {
        let pos = ctx.state_manager.get_position(format!("track_{}", i)).await?;
        assert!(pos.is_some());
    }

    ctx.cleanup().await?;
    Ok(())
}

#[tokio::test]
async fn test_error_recovery() -> AnimatorResult<()> {
    let ctx = TestContext::new().await?;

    // 1. Create invalid animation
    let result = ctx.animation_manager
        .add_animation(
            "invalid",
            AnimationConfig::new(
                TestPositions::origin(),
                TestPositions::origin(),
                -1.0,
                "invalid_type".to_string(),
            ),
        )
        .await;

    // 2. Verify error handling
    assert!(result.is_err());

    // 3. Verify system remains stable
    let valid_config = TestAnimations::linear_1s();
    ctx.animation_manager.add_animation("valid", valid_config).await?;
    
    // 4. Verify valid animation works
    ctx.animation_manager.play().await?;
    sleep(Duration::from_millis(100)).await;
    
    let pos = ctx.state_manager.get_position("valid").await?;
    assert!(pos.is_some());

    ctx.cleanup().await?;
    Ok(())
}

#[tokio::test]
async fn test_animation_engine() -> AnimatorResult<()> {
    let ctx = TestContext::new();
    let mut engine = AnimationEngine::new();

    let start = TestPositions::origin();
    let end = TestPositions::unit();

    let config = AnimationConfig {
        animation_type: AnimationType::Linear,
        duration: std::time::Duration::from_secs(1),
        loops: 1,
    };

    engine.add_animation("test", start, end, config).await?;
    engine.start("test").await?;

    // Let the animation run for a bit
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    let position = engine.get_position("test").await?;
    assert!(position.x > start.x && position.x < end.x);

    Ok(())
}

#[tokio::test]
async fn test_animation_group() -> AnimatorResult<()> {
    let ctx = TestContext::new();
    let mut engine = AnimationEngine::new();

    let configs = vec![
        AnimationConfig {
            animation_type: AnimationType::Linear,
            duration: std::time::Duration::from_secs(1),
            loops: 1,
        },
        AnimationConfig {
            animation_type: AnimationType::Linear,
            duration: std::time::Duration::from_secs(2),
            loops: 1,
        },
    ];

    for (i, config) in configs.iter().enumerate() {
        let start = TestPositions::origin();
        let end = TestPositions::unit();
        engine.add_to_group("test_group", format!("track_{}", i), start, end, config.clone()).await?;
    }

    engine.start_group("test_group").await?;

    // Let the animations run for a bit
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    for i in 0..configs.len() {
        let position = engine.get_position(&format!("track_{}", i)).await?;
        assert!(position.x > 0.0 && position.x < 1.0);
    }

    Ok(())
}

#[tokio::test]
async fn test_osc_integration() -> AnimatorResult<()> {
    let ctx = TestContext::with_osc().await?;
    let osc_config = OSCConfig {
        host: "127.0.0.1".to_string(),
        port: 9000,
    };

    let osc_manager = OSCManager::new(osc_config, ctx.animation_manager).await?;
    
    // Send a test message
    let msg = OSCMessage {
        address: "/track/1/xyz".to_string(),
        args: vec![0.5, 0.5, 0.5],
    };

    osc_manager.send_message(msg).await?;

    // Verify the message was received
    let messages = ctx.osc_server.unwrap().get_sent_messages();
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0].address, "/track/1/xyz");

    Ok(())
}
