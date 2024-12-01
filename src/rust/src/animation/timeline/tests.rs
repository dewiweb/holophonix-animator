#[cfg(test)]
mod tests {
    use crate::{
        test_utils::{
            TestContext,
            fixtures::{TestPositions, TestAnimations},
            assertions::{PositionAssertions, TimingAssertions},
            mocks::MockTimeProvider,
        },
        async_test,
    };
    use super::*;

    async_test!(test_timeline_manager_creation, |ctx| async {
        let manager = TimelineManager::new(ctx.state_manager.clone());
        
        assert!(!manager.is_playing);
        assert!(!manager.is_paused);
        assert_eq!(manager.current_time, 0.0);
        Ok(())
    });

    async_test!(test_timeline_state_sync, |ctx| async {
        let mut manager = TimelineManager::new(ctx.state_manager.clone());
        let config = TestAnimations::linear_1s();

        // Start animation and update one frame
        manager.start_animation("test".to_string(), config).await?;
        manager.update(0.016).await?; // One frame at 60fps

        // Verify state is updated
        let pos = ctx.state_manager.get_position("test".to_string()).await?;
        assert!(pos.is_some());

        // Verify position interpolation
        let expected_pos = Position::new(0.016, 0.0, 0.0, 0.0, 0.0, 0.0);
        pos.unwrap().assert_near(&expected_pos, 1e-6);
        Ok(())
    });

    async_test!(test_timeline_animation_control, |ctx| async {
        let mut manager = TimelineManager::new(ctx.state_manager.clone());
        let time_provider = MockTimeProvider::new();

        // Test animation start
        let config = TestAnimations::linear_1s();
        manager.start_animation("test".to_string(), config).await?;
        assert!(manager.is_playing);

        // Test animation pause
        manager.pause_animation("test".to_string()).await?;
        assert!(manager.is_paused);
        
        // Advance time and verify position hasn't changed
        time_provider.advance(0.5).await;
        manager.update(0.5).await?;
        let pos = ctx.state_manager.get_position("test".to_string()).await?;
        pos.unwrap().assert_near(&TestPositions::origin(), 1e-6);

        // Resume and verify animation continues
        manager.resume_animation("test".to_string()).await?;
        assert!(!manager.is_paused);
        Ok(())
    });

    async_test!(test_timeline_cleanup, |ctx| async {
        let mut manager = TimelineManager::new(ctx.state_manager.clone());
        
        // Add multiple animations
        for i in 0..3 {
            let config = TestAnimations::linear_1s();
            manager.start_animation(format!("test_{}", i), config).await?;
        }

        // Verify cleanup
        manager.cleanup().await?;
        assert!(!manager.is_playing);
        assert_eq!(manager.current_time, 0.0);

        // Verify all animations are removed
        for i in 0..3 {
            let pos = ctx.state_manager.get_position(format!("test_{}", i)).await?;
            assert!(pos.is_none());
        }
        Ok(())
    });
}
