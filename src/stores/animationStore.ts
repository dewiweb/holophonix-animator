import { create } from 'zustand'
import { Animation, AnimationState, Position, AnimationType } from '@/types'
import { useProjectStore } from './projectStore'
import { useSettingsStore } from './settingsStore'
import { modelRuntime } from '@/models/runtime'
import { oscBatchManager } from '@/utils/oscBatchManager'
import { modelRegistry } from '@/models/registry'
import { oscInputManager } from '@/utils/oscInputManager'
import { oscMessageOptimizer, type TrackPositionUpdate } from '@/utils/oscMessageOptimizer'
import { applyTransform, getTrackTime } from '@/utils/transformApplication'
import { autoMigrate } from '@/utils/animationMigration'

/**
 * Rotate offset for rotational animations to maintain formation shape
 * For circular/spiral/etc animations, offsets must rotate with the animation
 */
function rotateOffsetForAnimation(
  offset: Position,
  animationType: AnimationType,
  params: any,
  time: number,
  duration: number
): Position {
  // Use model's calculateRotationAngle if available
  const model = modelRegistry.getModel(animationType)
  
  if (!model?.visualization?.calculateRotationAngle) {
    // Non-rotational animations: offset stays fixed
    return offset
  }
  
  // Calculate rotation angle using model method
  const rotationAngle = model.visualization.calculateRotationAngle(time, duration, params)
  
  // Get plane of rotation
  const plane = params?.plane || 'xy'
  
  // Rotate offset in the appropriate plane
  if (plane === 'xy') {
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)
    return {
      x: offset.x * cos - offset.y * sin,
      y: offset.x * sin + offset.y * cos,
      z: offset.z
    }
  } else if (plane === 'xz') {
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)
    return {
      x: offset.x * cos - offset.z * sin,
      y: offset.y,
      z: offset.x * sin + offset.z * cos
    }
  } else { // yz plane
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)
    return {
      x: offset.x,
      y: offset.y * cos - offset.z * sin,
      z: offset.y * sin + offset.z * cos
    }
  }
}

// Track playing animation instances
interface PlayingAnimation {
  animationId: string
  trackIds: string[]
  startTime: number
  loopCount: number
  isReversed: boolean
  isPaused: boolean
  pausedTime?: number  // Time elapsed (in ms) when paused, for proper resume
  pauseTimestamp?: number  // Timestamp when pause was clicked
  lastAnimationTime?: number  // Last calculated animation time (in seconds) - for accurate pause
}

interface AnimationEngineState {
  // Animation playback state
  isPlaying: boolean
  globalTime: number
  playbackSpeed: number
  currentAnimationId: string | null  // Keep for backward compatibility
  currentTrackIds: string[]  // Keep for backward compatibility
  
  // Multiple animation support
  playingAnimations: Map<string, PlayingAnimation>  // Map of animationId to PlayingAnimation

  // Animation management
  playAnimation: (animationId: string, trackIds?: string[]) => void  // Support multiple tracks
  pauseAnimation: (animationId?: string) => void  // Optional animationId to pause specific animation
  stopAnimation: (animationId?: string) => void  // Optional animationId to stop specific animation
  stopAllAnimations: () => void  // Stop all playing animations
  seekTo: (time: number) => void
  goToStart: (durationMs?: number, trackIds?: string[]) => void
  _startPlayback: (animationId: string, trackIds: string[]) => void
  _easeToPositions: (tracks: Array<{trackId: string, from: Position, to: Position}>, durationMs: number) => void

  // Real-time computation
  getTrackPosition: (trackId: string, time?: number) => Position | null
  getAnimationState: (trackId: string) => AnimationState | null

  // Performance monitoring
  frameCount: number
  averageFrameTime: number
  isEngineRunning: boolean

  // Engine control
  startEngine: () => void
  stopEngine: () => void

  // Loop count and direction (for ping-pong)
  loopCount: number
  isReversed: boolean
  
  // Interpolation control
  returnInterpolationId: number | null
  isReturningToInitial: boolean
  goToStartInterpolationId: number | null
  isGoingToStart: boolean
  pendingPlay: { animationId: string; trackIds: string[] } | null
}

export const useAnimationStore = create<AnimationEngineState>((set, get) => ({
  // Initial state
  isPlaying: false,
  globalTime: 0,
  playbackSpeed: 1,
  currentAnimationId: null,
  currentTrackIds: [],
  playingAnimations: new Map(),
  frameCount: 0,
  averageFrameTime: 0,
  isEngineRunning: false,
  loopCount: 0,
  isReversed: false,
  returnInterpolationId: null,
  isReturningToInitial: false,
  goToStartInterpolationId: null,
  isGoingToStart: false,
  pendingPlay: null,

  playAnimation: (animationId: string, trackIds: string[] = []) => {
    console.log('playAnimation called with ID:', animationId, 'tracks:', trackIds)
    
    const playingAnimations = new Map(get().playingAnimations)
    
    // Check if this animation is already playing
    const existingAnimation = playingAnimations.get(animationId)
    if (existingAnimation) {
      // If paused, resume it
      if (existingAnimation.isPaused) {
        console.log('▶️ Resuming paused animation:', animationId, 'from pausedTime:', existingAnimation.pausedTime)
        
        // Safety check: if pausedTime is undefined, it means pause was broken - restart fresh
        if (existingAnimation.pausedTime === undefined) {
          console.warn('⚠️ Paused animation has no pausedTime - removing and restarting fresh')
          playingAnimations.delete(animationId)
          // Will fall through to create new animation below
        } else {
          // Restore timeline position - set startTime so that elapsed time equals pausedTime
          const newStartTime = Date.now() - existingAnimation.pausedTime
          console.log('🔄 Restoring startTime:', newStartTime, '(now -', existingAnimation.pausedTime, 'ms)')
          
          // Create a NEW object to ensure Zustand detects the change
          const updatedAnimation = {
            ...existingAnimation,
            isPaused: false,
            startTime: newStartTime,
            pausedTime: undefined,
            pauseTimestamp: undefined
          }
          playingAnimations.set(animationId, updatedAnimation)
          set({ 
            playingAnimations,
            isPlaying: true,
            currentAnimationId: animationId,
            currentTrackIds: existingAnimation.trackIds
          })
          // Make sure engine is running
          if (!get().isEngineRunning) {
            get().startEngine()
          }
          return
        }
      } else {
        // Already playing and not paused
        console.log('Animation', animationId, 'is already playing')
        return
      }
    }
    
    // Add to playing animations
    playingAnimations.set(animationId, {
      animationId,
      trackIds,
      startTime: Date.now(),
      loopCount: 0,
      isReversed: false,
      isPaused: false,
      pausedTime: undefined,
      pauseTimestamp: undefined,
      lastAnimationTime: undefined
    })
    
    set({ 
      playingAnimations,
      isPlaying: true,
      // Keep backward compatibility
      currentAnimationId: animationId,
      currentTrackIds: trackIds
    })
    
    // Store initial positions for tracks
    const projectStore = useProjectStore.getState()
    trackIds.forEach(trackId => {
      const track = projectStore.tracks.find(t => t.id === trackId)
      if (track && !track.initialPosition) {
        projectStore.updateTrack(trackId, {
          initialPosition: { ...track.position }
        })
      }
    })
    
    // Start the engine if not running
    const state = get()
    if (!state.isEngineRunning) {
      get().startEngine()
    }
  },

  pauseAnimation: (animationId?: string) => {
    if (animationId) {
      // Pause specific animation
      const playingAnimations = new Map(get().playingAnimations)
      const animation = playingAnimations.get(animationId)
      if (animation) {
        const pauseTimestamp = Date.now()
        const elapsedTime = pauseTimestamp - animation.startTime
        
        console.log('⏸️ Pausing animation:', animationId, 'at elapsed time:', elapsedTime, 'ms')
        
        // Create a NEW object to ensure Zustand detects the change
        const updatedAnimation = {
          ...animation,
          isPaused: true,
          pausedTime: elapsedTime,  // Store elapsed time for resume
          pauseTimestamp: pauseTimestamp  // Store when paused
        }
        playingAnimations.set(animationId, updatedAnimation)
        
        console.log('✅ Stored pausedTime:', updatedAnimation.pausedTime, 'ms')
        
        // Check if any animations are still playing (not paused)
        const anyStillPlaying = Array.from(playingAnimations.values()).some(a => !a.isPaused)
        
        set({ 
          playingAnimations,
          isPlaying: anyStillPlaying,
          // Update current animation if this was the current one
          ...(get().currentAnimationId === animationId && !anyStillPlaying ? {
            currentAnimationId: null,
            currentTrackIds: []
          } : {})
        })
      }
    } else {
      // Pause all animations
      const playingAnimations = new Map(get().playingAnimations)
      playingAnimations.forEach((animation, id) => {
        const pauseTimestamp = Date.now()
        const elapsedTime = pauseTimestamp - animation.startTime
        
        // Create NEW object for immutability
        const updatedAnimation = {
          ...animation,
          isPaused: true,
          pausedTime: elapsedTime,
          pauseTimestamp: pauseTimestamp
        }
        playingAnimations.set(id, updatedAnimation)
        
        console.log('⏸️ Pausing animation (all):', id, 'at elapsed time:', elapsedTime, 'ms')
        console.log('✅ Stored pausedTime:', updatedAnimation.pausedTime, 'ms')
      })
      set({ playingAnimations, isPlaying: false })
    }
  },

  stopAnimation: (animationId?: string) => {
    const state = get()
    const projectStore = useProjectStore.getState()
    
    if (animationId) {
      // Stop specific animation
      const playingAnimations = new Map(state.playingAnimations)
      const animation = playingAnimations.get(animationId)
      if (animation) {
        // Collect tracks to return
        const tracksToReturn: Array<{trackId: string, from: Position, to: Position}> = []
        animation.trackIds.forEach(trackId => {
          const track = projectStore.tracks.find(t => t.id === trackId)
          if (track && track.initialPosition) {
            tracksToReturn.push({
              trackId,
              from: { ...track.position },
              to: { ...track.initialPosition }
            })
          }
        })
        
        // Start easing animation to return to initial
        if (tracksToReturn.length > 0) {
          get()._easeToPositions(tracksToReturn, 500) // 500ms ease duration
        }
        
        playingAnimations.delete(animationId)
        
        const stillPlaying = playingAnimations.size > 0
        set({ 
          playingAnimations,
          isPlaying: stillPlaying,
          // Clear backward compatibility fields if this was the current animation
          ...(state.currentAnimationId === animationId ? {
            currentAnimationId: null,
            currentTrackIds: [],
            globalTime: 0
          } : {})
        })
        
        // Stop engine if no more animations
        if (!stillPlaying) {
          get().stopEngine()
        }
      }
    } else {
      // Stop all animations
      const trackIdsToReturn: string[] = []
      state.playingAnimations.forEach((animation) => {
        trackIdsToReturn.push(...animation.trackIds)
      })
      
      // Collect tracks to return
      const tracksToReturn: Array<{trackId: string, from: Position, to: Position}> = []
      trackIdsToReturn.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track && track.initialPosition) {
          tracksToReturn.push({
            trackId,
            from: { ...track.position },
            to: { ...track.initialPosition }
          })
        }
      })
      
      // Clear all playing animations
      set({ 
        playingAnimations: new Map(),
        isPlaying: false,
        currentAnimationId: null,
        currentTrackIds: [],
        globalTime: 0,
        loopCount: 0,
        isReversed: false
      })
      
      // Stop the engine
      get().stopEngine()
      
      // Clear OSC
      oscBatchManager.clearBatch()
      oscInputManager.clearAnimatingTracks()
      
      // Start easing animation to return to initial
      if (tracksToReturn.length > 0) {
        get()._easeToPositions(tracksToReturn, 500) // 500ms ease duration
      }
    }
  },
  
  stopAllAnimations: () => {
    get().stopAnimation()
  },

  _startPlayback: (animationId: string, trackIds: string[] = []) => {
    // Legacy function for compatibility - now just calls playAnimation
    get().playAnimation(animationId, trackIds)
  },

  goToStart: (durationMs: number = 500, trackIds?: string[]) => {
    const projectStore = useProjectStore.getState()
    const targetTracks = trackIds || get().currentTrackIds
    
    // Collect tracks to ease to start
    const tracksToEase: Array<{trackId: string, from: Position, to: Position}> = []
    targetTracks.forEach(trackId => {
      const track = projectStore.tracks.find(t => t.id === trackId)
      if (track && track.initialPosition) {
        tracksToEase.push({
          trackId,
          from: { ...track.position },
          to: { ...track.initialPosition }
        })
      }
    })
    
    // Start easing animation
    if (tracksToEase.length > 0) {
      get()._easeToPositions(tracksToEase, durationMs)
    }
    
    set({ globalTime: 0 })
  },

  seekTo: (time: number) => {
    set({ globalTime: Math.max(0, time) })
  },

  getTrackPosition: (trackId: string, time?: number) => {
    // Implementation would compute position based on animation state
    return null
  },

  getAnimationState: (trackId: string) => {
    // Implementation would return current animation state for track
    return null
  },

  startEngine: () => {
    if (get().isEngineRunning) return

    set({ isEngineRunning: true })

    // Initialize OSC batch manager callback to actually send messages
    oscBatchManager.setSendCallback(async (batch) => {
      // Send batch through OSC store to electron/device
      const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
      await oscStore.sendBatch(batch)
    })

    let lastTimestamp = Date.now()
    let animationFrameId: number | null = null

    const animate = () => {
      const state = get()
      
      // Check if engine should continue running
      if (!state.isEngineRunning || state.playingAnimations.size === 0) {
        return
      }

      const timestamp = Date.now()
      const deltaTime = timestamp - lastTimestamp
      lastTimestamp = timestamp

      const projectStore = useProjectStore.getState()
      const settingsStore = useSettingsStore.getState()
      const useBatching = settingsStore.osc?.useBatching !== false

      // Process each playing animation
      state.playingAnimations.forEach((playingAnimation, animationId) => {
        if (playingAnimation.isPaused) return
        
        const animationTime = (timestamp - playingAnimation.startTime) / 1000
        
        // Get base animation for fallback
        const baseAnimation = projectStore.animations.find(a => a.id === playingAnimation.animationId)
        if (!baseAnimation) return
        
        // Process each track for this animation
        playingAnimation.trackIds.forEach(trackId => {
          const track = projectStore.tracks.find(t => t.id === trackId)
          if (!track) return
          
          // CRITICAL: In relative mode, each track has its own animation with per-track parameters
          // Use track.animationState.animation if available (has per-track params), otherwise use base
          const animation = track.animationState?.animation || baseAnimation

          // Check mute/solo states
          const hasSoloTracks = projectStore.tracks.some(t => t.isSolo)
          if (track.isMuted || (hasSoloTracks && !track.isSolo)) {
            return
          }

          // V3 UNIFIED TRANSFORM APPLICATION
          // 1. Get adjusted time for this track (applies phase offset)
          const trackTime = getTrackTime(trackId, animationTime, animation)
          
          // 2. Build simplified context (no mode-specific fields)
          const context: any = {
            trackId,
            time: trackTime,
            duration: animation.duration,
            deltaTime: deltaTime / 1000,
            frameCount: state.frameCount,
            state: new Map(),  // For stateful models (pendulum, spring, etc.)
            
            // DEPRECATED v2 fields (for backward compatibility only)
            trackIndex: playingAnimation.trackIds.indexOf(trackId),
            totalTracks: playingAnimation.trackIds.length,
            trackPosition: track.position,
            initialPosition: track.initialPosition || track.position,
            realTime: timestamp,
          }
          
          // 3. Calculate base position (model returns position in absolute coordinates)
          const basePosition = modelRuntime.calculatePosition(animation, trackTime, 0, context)
          
          // 4. Apply transform (SINGLE unified application point)
          const position = applyTransform(basePosition, trackId, animation, trackTime)

          // Update track position
          projectStore.updateTrack(trackId, { position })

          // Send OSC message immediately for each track
          // Note: holophonixIndex can be 0 (Track 1), so check for undefined/null explicitly
          if (track.holophonixIndex !== undefined && track.holophonixIndex !== null) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
          }
        })
        
        // Handle animation end (loop or stop)
        if (animationTime >= baseAnimation.duration) {
          if (baseAnimation.loop) {
            // Reset animation for next loop - need to update state properly
            console.log('🔁 Looping animation:', playingAnimation.animationId)
            const updatedPlayingAnimations = new Map(state.playingAnimations)
            const updatedAnimation = {
              ...playingAnimation,
              startTime: timestamp,  // Reset to current time
              loopCount: playingAnimation.loopCount + 1
            }
            updatedPlayingAnimations.set(playingAnimation.animationId, updatedAnimation)
            set({ playingAnimations: updatedPlayingAnimations })
          } else {
            // Stop non-looping animation
            get().stopAnimation(playingAnimation.animationId)
          }
        }
      })

      // Always flush OSC batch at end of frame
      // (oscBatchManager.addMessage accumulates messages, flush sends them)
      oscBatchManager.flushBatch()

      // Update frame statistics
      set({
        frameCount: state.frameCount + 1,
        averageFrameTime: state.averageFrameTime === 0
          ? deltaTime
          : (state.averageFrameTime * 0.9) + (deltaTime * 0.1)
      })

      // Schedule next frame
      animationFrameId = requestAnimationFrame(animate)
    }

    // Start animation loop
    animate()

    // Store cleanup function
    ;(get() as any)._animationFrameId = animationFrameId
  },

  stopEngine: () => {
    const state = get()
    if (!state.isEngineRunning) return

    set({ isEngineRunning: false })

    // Cancel animation frame
    if ((state as any)._animationFrameId) {
      cancelAnimationFrame((state as any)._animationFrameId)
      ;(state as any)._animationFrameId = null
    }

    // Clear OSC
    oscBatchManager.clearBatch()
    oscInputManager.clearAnimatingTracks()
  },
  
  /**
   * PRIVATE: Ease tracks to target positions with smooth interpolation
   */
  _easeToPositions: (tracks: Array<{trackId: string, from: Position, to: Position}>, durationMs: number) => {
    const projectStore = useProjectStore.getState()
    const startTime = performance.now()
    
    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutCubic(progress)
      
      // Update each track position
      tracks.forEach(({ trackId, from, to }) => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (!track) return
        
        const position: Position = {
          x: from.x + (to.x - from.x) * easedProgress,
          y: from.y + (to.y - from.y) * easedProgress,
          z: from.z + (to.z - from.z) * easedProgress
        }
        
        projectStore.updateTrack(trackId, { position })
        
        // Send OSC message
        if (track.holophonixIndex) {
          const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
          oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
        }
      })
      
      // Continue animation or finish
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Set final positions and update animation state
        tracks.forEach(({ trackId, to }) => {
          const track = projectStore.tracks.find(t => t.id === trackId)
          projectStore.updateTrack(trackId, {
            position: to,
            animationState: track?.animationState ? {
              ...track.animationState,
              isPlaying: false,
              currentTime: 0,
              animation: null
            } : undefined
          })
        })
      }
    }
    
    // Start the easing animation
    requestAnimationFrame(animate)
  }
}))
