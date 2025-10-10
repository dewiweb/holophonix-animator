import { useCallback } from 'react'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'
import { logger } from '@/utils/logger'

/**
 * Custom hook for animation operations
 * Abstracts animation store logic and provides a clean API
 */
export const useAnimation = (trackId?: string) => {
  const {
    isPlaying,
    globalTime,
    playbackSpeed,
    playAnimation,
    pauseAnimation,
    stopAnimation,
    seekTo,
  } = useAnimationStore()

  const { tracks, updateTrack } = useProjectStore()
  const track = trackId ? tracks.find(t => t.id === trackId) : null

  const play = useCallback(
    (animationId?: string) => {
      if (!trackId) {
        logger.warn('Cannot play animation: no track ID provided', undefined, 'Animation')
        return
      }

      const targetAnimationId = animationId || track?.animationState?.animation?.id
      if (!targetAnimationId) {
        logger.warn('Cannot play animation: no animation ID', undefined, 'Animation')
        return
      }

      logger.animation('Playing animation', { trackId, animationId: targetAnimationId })
      playAnimation(targetAnimationId, [trackId])
    },
    [trackId, track, playAnimation]
  )

  const pause = useCallback(() => {
    logger.animation('Pausing animation', { trackId })
    pauseAnimation()
  }, [pauseAnimation, trackId])

  const stop = useCallback(() => {
    logger.animation('Stopping animation', { trackId })
    stopAnimation()
  }, [stopAnimation, trackId])

  const seek = useCallback(
    (time: number) => {
      if (time < 0) {
        logger.warn('Cannot seek to negative time', { time }, 'Animation')
        return
      }
      seekTo(time)
    },
    [seekTo]
  )

  return {
    // State
    isPlaying,
    globalTime,
    playbackSpeed,
    track,
    animation: track?.animationState?.animation || null,
    
    // Actions
    play,
    pause,
    stop,
    seek,
  }
}
