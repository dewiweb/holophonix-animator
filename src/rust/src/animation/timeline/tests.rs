#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;
    use tokio::time::sleep;

    #[tokio::test]
    async fn test_timeline_creation() {
        let timeline = AnimationTimeline::new(1.0);
        assert!(!timeline.is_playing());
        assert_eq!(timeline.update(), 0.0);
    }

    #[tokio::test]
    async fn test_timeline_playback() {
        let mut timeline = AnimationTimeline::new(1.0);
        
        timeline.play();
        assert!(timeline.is_playing());
        
        sleep(Duration::from_millis(500)).await;
        let progress = timeline.update();
        assert!(progress > 0.0 && progress < 1.0);
        
        timeline.pause();
        assert!(!timeline.is_playing());
        
        let paused_progress = timeline.update();
        assert_eq!(paused_progress, progress);
        
        timeline.stop();
        assert!(!timeline.is_playing());
        assert_eq!(timeline.update(), 0.0);
    }

    #[tokio::test]
    async fn test_timeline_manager() -> AnimatorResult<()> {
        let mut manager = TimelineManager::new();
        
        manager.add_timeline("test".to_string(), 1.0).await?;
        assert!(manager.get_timeline("test").await?.is_some());
        
        manager.play("test").await?;
        let timeline = manager.get_timeline("test").await?.unwrap();
        assert!(timeline.lock().await.is_playing());
        
        manager.pause("test").await?;
        assert!(!timeline.lock().await.is_playing());
        
        manager.stop("test").await?;
        assert!(!timeline.lock().await.is_playing());
        assert_eq!(timeline.lock().await.update(), 0.0);
        
        manager.remove_timeline("test").await?;
        assert!(manager.get_timeline("test").await?.is_none());
        
        Ok(())
    }
}
