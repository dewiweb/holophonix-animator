import { create } from 'zustand'
import { Animation, AnimationState, Position, AnimationType } from '@/types'
import { useProjectStore } from './projectStore'
import { useSettingsStore } from './settingsStore'
import { modelRuntime } from '@/models/runtime'
import { type CalculationContext } from '@/models/types'
import { oscBatchManager } from '@/utils/oscBatchManager'
import { modelRegistry } from '@/models/registry'
import { oscInputManager } from '@/utils/oscInputManager'
import { oscMessageOptimizer, type TrackPositionUpdate } from '@/utils/oscMessageOptimizer'
import { applyTransform, getTrackTime } from '@/utils/transformApplication'
import { 
  calculateAnimationTime,
  createTimingState,
  pauseTimingState,
  resumeTimingState,
  resetTimingState,
  type AnimationTimingState
} from '@/utils/animationTiming'

// Track playing animation instances
interface PlayingAnimation {
  animationId: string
  trackIds: string[]
  timingState: AnimationTimingState  // v3: Use dedicated timing engine
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
  _easeToPositions: (tracks: Array<{trackId: string, from: Position, to: Position}>, durationMs: number, onComplete?: () => void) => void

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
      // If paused, resume it using timing engine
      if (existingAnimation.timingState.isPaused) {
        console.log('▶️ Resuming paused animation:', animationId)
        
        const resumedState = resumeTimingState(existingAnimation.timingState, Date.now())
        const updatedAnimation: PlayingAnimation = {
          ...existingAnimation,
          timingState: resumedState
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
      } else {
        // Already playing and not paused
        console.log('Animation', animationId, 'is already playing')
        return
      }
    }
    
    // NEW ANIMATION START: Check for fade-in subanimation
    console.log('🎬 Starting new animation - checking for fade-in subanimation')
    
    const projectStore = useProjectStore.getState()
    const baseAnimation = projectStore.animations.find(a => a.id === animationId)
    
    // Check if animation has fade-in subanimation configured
    const hasFadeIn = baseAnimation?.fadeIn?.enabled && baseAnimation?.fadeIn?.autoTrigger
    
    if (hasFadeIn && baseAnimation) {
      console.log(`  🎭 Fade-in subanimation detected: ${baseAnimation.fadeIn!.duration}s ${baseAnimation.fadeIn!.easing}`)
      
      // Collect tracks to ease to initial positions
      const tracksToEase: Array<{trackId: string, from: Position, to: Position}> = []
      
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track) {
          // Store initial position if not set
          if (!track.initialPosition) {
            console.log(`  💾 Storing initial position for track ${track.name || trackId}`)
            projectStore.updateTrack(trackId, {
              initialPosition: { ...track.position }
            })
          }
          
          // Check if fade-in has custom target position
          const targetPos = baseAnimation.fadeIn!.toPosition || track.initialPosition
          
          if (targetPos) {
            // Check if position is different (needs easing)
            const posChanged = 
              Math.abs(track.position.x - targetPos.x) > 0.001 ||
              Math.abs(track.position.y - targetPos.y) > 0.001 ||
              Math.abs(track.position.z - targetPos.z) > 0.001
            
            if (posChanged) {
              console.log(`  📍 ${track.name || trackId}: ${JSON.stringify(track.position)} → ${JSON.stringify(targetPos)}`)
              tracksToEase.push({
                trackId,
                from: { ...track.position },
                to: { ...targetPos }
              })
            }
          }
        }
      })
      
      // Execute fade-in subanimation if needed
      if (tracksToEase.length > 0) {
        console.log(`  🎯 Fade-in: ${tracksToEase.length} tracks, ${baseAnimation.fadeIn!.duration}s`)
        const fadeInDurationMs = baseAnimation.fadeIn!.duration * 1000
        
        get()._easeToPositions(tracksToEase, fadeInDurationMs, () => {
          // After fade-in completes: Start main animation
          console.log('✅ Fade-in complete - starting main animation')
          
          const currentPlayingAnimations = new Map(get().playingAnimations)
          currentPlayingAnimations.set(animationId, {
            animationId,
            trackIds,
            timingState: createTimingState(Date.now())
          })
          
          set({ 
            playingAnimations: currentPlayingAnimations,
            isPlaying: true,
            currentAnimationId: animationId,
            currentTrackIds: trackIds
          })
          
          // Start the engine if not running
          if (!get().isEngineRunning) {
            get().startEngine()
          }
        })
        return // Wait for fade-in to complete
      } else {
        console.log('  ✓ Already at start position - no fade-in needed')
      }
    } else {
      console.log('  ℹ️ No fade-in subanimation configured')
      
      // Store initial positions for tracks that don't have them
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track && !track.initialPosition) {
          projectStore.updateTrack(trackId, {
            initialPosition: { ...track.position }
          })
        }
      })
    }
    
    // Start immediately (no fade-in or already at position)
    playingAnimations.set(animationId, {
      animationId,
      trackIds,
      timingState: createTimingState(Date.now())
    })
    
    set({ 
      playingAnimations,
      isPlaying: true,
      currentAnimationId: animationId,
      currentTrackIds: trackIds
    })
    
    if (!get().isEngineRunning) {
      get().startEngine()
    }
  },

  pauseAnimation: (animationId?: string) => {
    const currentTime = Date.now()
    
    if (animationId) {
      // Pause specific animation using timing engine
      const playingAnimations = new Map(get().playingAnimations)
      const animation = playingAnimations.get(animationId)
      if (animation) {
        console.log('⏸️ Pausing animation:', animationId)
        
        const pausedState = pauseTimingState(animation.timingState, currentTime)
        const updatedAnimation: PlayingAnimation = {
          ...animation,
          timingState: pausedState
        }
        playingAnimations.set(animationId, updatedAnimation)
        
        // Check if any animations are still playing (not paused)
        const anyStillPlaying = Array.from(playingAnimations.values()).some(a => !a.timingState.isPaused)
        
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
      // Pause all animations using timing engine
      const playingAnimations = new Map(get().playingAnimations)
      playingAnimations.forEach((animation, id) => {
        console.log('⏸️ Pausing animation (all):', id)
        
        const pausedState = pauseTimingState(animation.timingState, currentTime)
        const updatedAnimation: PlayingAnimation = {
          ...animation,
          timingState: pausedState
        }
        playingAnimations.set(id, updatedAnimation)
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
    const state = get()
    const projectStore = useProjectStore.getState()
    
    // Determine which tracks to reset
    let targetTracks: string[] = []
    let affectedAnimationIds: string[] = []
    
    if (trackIds) {
      // Use provided track IDs
      targetTracks = trackIds
    } else {
      // Get tracks from ALL active playing animations
      state.playingAnimations.forEach((playingAnimation) => {
        targetTracks.push(...playingAnimation.trackIds)
      })
    }
    
    // Remove duplicates
    targetTracks = [...new Set(targetTracks)]
    
    if (targetTracks.length === 0) {
      console.warn('goToStart: No tracks to reset')
      return
    }
    
    console.log('🔄 goToStart for tracks:', targetTracks)
    
    // Collect tracks to ease to start position
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
    
    // IMPORTANT: Pause animations that use these tracks during easing
    // This prevents the animation loop from overriding easing positions
    const updatedPlayingAnimations = new Map(state.playingAnimations)
    const currentTime = Date.now()
    
    updatedPlayingAnimations.forEach((playingAnimation, animationId) => {
      // Check if this animation uses any of the target tracks
      const hasTargetTrack = playingAnimation.trackIds.some(id => targetTracks.includes(id))
      if (hasTargetTrack) {
        console.log('  ⏸️ Pausing animation during goToStart:', animationId)
        affectedAnimationIds.push(animationId)
        
        // Pause and reset timing state
        updatedPlayingAnimations.set(animationId, {
          ...playingAnimation,
          timingState: {
            ...resetTimingState(currentTime),
            isPaused: true,  // Pause during easing
            pausedTime: 0    // Start from 0 when resumed
          }
        })
      }
    })
    
    set({ 
      playingAnimations: updatedPlayingAnimations,
      globalTime: 0  // Keep for backward compat
    })
    
    // Start easing animation to move tracks smoothly to start
    if (tracksToEase.length > 0 && durationMs > 0) {
      get()._easeToPositions(tracksToEase, durationMs, () => {
        // Callback after easing completes: Resume paused animations
        console.log('  ▶️ Resuming animations after goToStart easing')
        const finalAnimations = new Map(get().playingAnimations)
        affectedAnimationIds.forEach(animId => {
          const anim = finalAnimations.get(animId)
          if (anim && anim.timingState.isPaused) {
            finalAnimations.set(animId, {
              ...anim,
              timingState: resumeTimingState(anim.timingState, Date.now())
            })
          }
        })
        set({ playingAnimations: finalAnimations })
      })
    } else if (tracksToEase.length > 0) {
      // Instant move (no easing) - resume immediately
      tracksToEase.forEach(({ trackId, to }) => {
        projectStore.updateTrack(trackId, { position: to })
      })
      
      // Resume animations immediately
      const finalAnimations = new Map(get().playingAnimations)
      affectedAnimationIds.forEach(animId => {
        const anim = finalAnimations.get(animId)
        if (anim && anim.timingState.isPaused) {
          finalAnimations.set(animId, {
            ...anim,
            timingState: resumeTimingState(anim.timingState, Date.now())
          })
        }
      })
      set({ playingAnimations: finalAnimations })
    }
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
        // Get base animation
        const baseAnimation = projectStore.animations.find(a => a.id === playingAnimation.animationId)
        if (!baseAnimation) return
        
        // UNIFIED TIMING ENGINE - Calculate animation time with ping-pong support
        const timingResult = calculateAnimationTime(
          timestamp,
          baseAnimation,
          playingAnimation.timingState
        )
        
        // Skip if paused or should stop
        if (timingResult.newState.isPaused) return
        if (timingResult.shouldStop) {
          get().stopAnimation(playingAnimation.animationId)
          return
        }
        
        // Update timing state if it changed (loop increment, direction change)
        if (timingResult.shouldLoop || timingResult.isReversed !== playingAnimation.timingState.isReversed) {
          const updatedPlayingAnimations = new Map(state.playingAnimations)
          updatedPlayingAnimations.set(playingAnimation.animationId, {
            ...playingAnimation,
            timingState: timingResult.newState
          })
          set({ playingAnimations: updatedPlayingAnimations })
          
          if (timingResult.shouldLoop) {
            console.log(`🔁 Loop ${timingResult.loopCount}: ${timingResult.isReversed ? '⬅️ Backward' : '➡️ Forward'}`)
          }
        }
        
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
          // Use timing engine's calculated time (handles ping-pong)
          const trackTime = getTrackTime(trackId, timingResult.animationTime, animation)
          
          // 2. Build v3 context (clean and simple)
          const context: CalculationContext = {
            trackId,
            time: trackTime,
            duration: animation.duration,
            deltaTime: deltaTime / 1000,
            frameCount: state.frameCount,
            state: new Map(),  // For stateful models (pendulum, spring, etc.)
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
  _easeToPositions: (tracks: Array<{trackId: string, from: Position, to: Position}>, durationMs: number, onComplete?: () => void) => {
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
        
        // Call completion callback if provided
        if (onComplete) {
          onComplete()
        }
      }
    }
    
    // Start the easing animation
    requestAnimationFrame(animate)
  }
}))
