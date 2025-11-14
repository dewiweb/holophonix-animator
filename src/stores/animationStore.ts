import { create } from 'zustand'
import { Animation, AnimationState, Position, AnimationType } from '@/types'
import { useProjectStore } from './projectStore'
import { useSettingsStore } from './settingsStore'
import { modelRuntime } from '@/models/runtime'
import { type CalculationContext } from '@/models/types'
import { oscBatchManager } from '@/utils/osc/batchManager'
import { modelRegistry } from '@/models/registry'
import { oscInputManager } from '@/utils/osc/inputManager'
import { oscMessageOptimizer, type TrackPositionUpdate } from '@/utils/osc/messageOptimizer'
import { applyTransform, getTrackTime } from '@/utils/transformApplication'
import { 
  calculateAnimationTime,
  createTimingState,
  pauseTimingState,
  resumeTimingState,
  resetTimingState,
  type AnimationTimingState
} from '@/utils/animationTiming'

// CRITICAL: Persistent state storage for stateful models (pendulum, spring, etc.)
// Each animation gets its own state Map that persists across frames
const animationStateStorage = new Map<string, Map<string, any>>()

/**
 * Get or create persistent state Map for an animation
 */
function getAnimationState(animationId: string): Map<string, any> {
  if (!animationStateStorage.has(animationId)) {
    animationStateStorage.set(animationId, new Map())
  }
  return animationStateStorage.get(animationId)!
}

/**
 * Clear state for stopped animation
 */
function clearAnimationState(animationId: string): void {
  animationStateStorage.delete(animationId)
}

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
  returnAllToInitial: (durationMs?: number) => Promise<void>  // Return all tracks to initial positions (async for OSC setup)
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
    
    const playingAnimations = new Map(get().playingAnimations)
    
    // Check if this animation is already playing
    const existingAnimation = playingAnimations.get(animationId)
    if (existingAnimation) {
      // If paused, resume it using timing engine
      if (existingAnimation.timingState.isPaused) {
        
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
        return
      }
    }
    
    // NEW ANIMATION START: Check for fade-in subanimation
    
    const projectStore = useProjectStore.getState()
    const baseAnimation = projectStore.animations.find(a => a.id === animationId)
    
    // Check if animation has fade-in subanimation configured
    const hasFadeIn = baseAnimation?.fadeIn?.enabled && baseAnimation?.fadeIn?.autoTrigger
    
    if (hasFadeIn && baseAnimation) {
      
      // Collect tracks to ease from current position to animation start position
      const tracksToEase: Array<{trackId: string, from: Position, to: Position}> = []
      
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (!track) return
        
        // Store track's current position as initialPosition (for fade-out later)
        if (!track.initialPosition) {
          projectStore.updateTrack(trackId, {
            initialPosition: { ...track.position }
          })
        }
        
        // Calculate the animation's starting position at t=0
        // Use per-track animation if available (relative mode), otherwise base animation
        const animation = track.animationState?.animation || baseAnimation
        
        // Build calculation context for t=0
        const context: CalculationContext = {
          trackId,
          time: 0,
          duration: animation.duration,
          deltaTime: 0,
          frameCount: 0,
          state: getAnimationState(animation.id),
        }
        
        // Calculate base position at t=0
        const basePositionAtStart = modelRuntime.calculatePosition(animation, 0, 0, context)
        
        // Apply transform to get final start position (handles multi-track offsets, etc.)
        const animationStartPos = applyTransform(basePositionAtStart, trackId, animation, 0, trackIds)
        
        // Check if current position differs from animation start
        const posChanged = 
          Math.abs(track.position.x - animationStartPos.x) > 0.001 ||
          Math.abs(track.position.y - animationStartPos.y) > 0.001 ||
          Math.abs(track.position.z - animationStartPos.z) > 0.001
        
        if (posChanged) {
          tracksToEase.push({
            trackId,
            from: { ...track.position },
            to: { ...animationStartPos }
          })
        }
      })
      
      // Execute fade-in subanimation if needed
      if (tracksToEase.length > 0) {
        const fadeInDurationMs = baseAnimation.fadeIn!.duration * 1000
        
        get()._easeToPositions(tracksToEase, fadeInDurationMs, () => {
          // After fade-in completes: Start main animation
          
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
      }
    } else {
      
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
      const playingAnimation = playingAnimations.get(animationId)
      if (playingAnimation) {
        // Get base animation to check for fade-out config
        const baseAnimation = projectStore.animations.find(a => a.id === animationId)
        const hasFadeOut = baseAnimation?.fadeOut?.enabled && baseAnimation?.fadeOut?.autoTrigger
        
        if (hasFadeOut && baseAnimation) {
          
          // Collect tracks to return to initial position
          const tracksToReturn: Array<{trackId: string, from: Position, to: Position}> = []
          
          playingAnimation.trackIds.forEach(trackId => {
            const track = projectStore.tracks.find(t => t.id === trackId)
            if (track && track.initialPosition) {
              // Check if position differs from initial
              const posChanged = 
                Math.abs(track.position.x - track.initialPosition.x) > 0.001 ||
                Math.abs(track.position.y - track.initialPosition.y) > 0.001 ||
                Math.abs(track.position.z - track.initialPosition.z) > 0.001
              
              if (posChanged) {
                tracksToReturn.push({
                  trackId,
                  from: { ...track.position },
                  to: { ...track.initialPosition }
                })
              }
            }
          })
          
          // Execute fade-out if needed
          if (tracksToReturn.length > 0) {
            const fadeOutDurationMs = baseAnimation.fadeOut!.duration * 1000
            
            // Remove from playing animations first
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
            
            // Clear persistent state after removing from map
            clearAnimationState(animationId)
            
            // Execute fade-out with callback to stop engine AFTER fade-out completes
            get()._easeToPositions(tracksToReturn, fadeOutDurationMs, () => {
              // Stop engine only if no other animations are playing
              if (get().playingAnimations.size === 0) {
                get().stopEngine()
              }
            })
            return // Wait for fade-out to complete
          } else {
            // No fade-out needed - stop immediately
            playingAnimations.delete(animationId)
            clearAnimationState(animationId)  // Clear persistent state
            const stillPlaying = playingAnimations.size > 0
            
            set({ 
              playingAnimations,
              isPlaying: stillPlaying,
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
          
          // Remove from playing animations
          playingAnimations.delete(animationId)
          clearAnimationState(animationId)  // Clear persistent state
          const stillPlaying = playingAnimations.size > 0
          
          set({ 
            playingAnimations,
            isPlaying: stillPlaying,
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
      }
    } else {
      // Stop all animations
      
      // Check each animation's fade-out config and collect unique tracks
      const tracksToReturn: Array<{trackId: string, from: Position, to: Position}> = []
      const processedTracks = new Set<string>()
      
      state.playingAnimations.forEach((playingAnimation, animId) => {
        const baseAnimation = projectStore.animations.find(a => a.id === animId)
        const hasFadeOut = baseAnimation?.fadeOut?.enabled && baseAnimation?.fadeOut?.autoTrigger
        
        if (hasFadeOut) {
          console.log(`  🎭 Animation "${baseAnimation?.name}" has fade-out configured`)
        }
        
        playingAnimation.trackIds.forEach(trackId => {
          // Skip if already processed (track could be in multiple animations)
          if (processedTracks.has(trackId)) return
          processedTracks.add(trackId)
          
          const track = projectStore.tracks.find(t => t.id === trackId)
          if (track && track.initialPosition && hasFadeOut) {
            const posChanged = 
              Math.abs(track.position.x - track.initialPosition.x) > 0.001 ||
              Math.abs(track.position.y - track.initialPosition.y) > 0.001 ||
              Math.abs(track.position.z - track.initialPosition.z) > 0.001
            
            if (posChanged) {
              tracksToReturn.push({
                trackId,
                from: { ...track.position },
                to: { ...track.initialPosition }
              })
            }
          }
        })
      })
      
      // Clear all playing animations first
      // Clear persistent state for all stopped animations
      state.playingAnimations.forEach((playingAnimation, animId) => {
        clearAnimationState(animId)
      })
      
      set({ 
        playingAnimations: new Map(),
        isPlaying: false,
        currentAnimationId: null,
        currentTrackIds: [],
        globalTime: 0,
        loopCount: 0,
        isReversed: false
      })
      
      // Execute fade-out if any tracks need returning
      if (tracksToReturn.length > 0) {
        // Use default fade-out duration when multiple animations (can be improved later)
        get()._easeToPositions(tracksToReturn, 500, () => {
          get().stopEngine()
          oscBatchManager.clearBatch()
          oscInputManager.clearAnimatingTracks()
        })
      } else {
        // No fade-out needed - stop immediately
        get().stopEngine()
        oscBatchManager.clearBatch()
        oscInputManager.clearAnimatingTracks()
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

  /**
   * Return all tracks to their initial positions
   * Useful as a safety/reset function to avoid user errors
   */
  returnAllToInitial: async (durationMs: number = 500) => {
    // Ensure durationMs is a valid number (prevent React event objects from breaking this)
    const duration = typeof durationMs === 'number' && !isNaN(durationMs) ? durationMs : 500
    
    const projectStore = useProjectStore.getState()
    
    // Collect all tracks that have initialPosition and are not at it
    const tracksToReturn: Array<{trackId: string, from: Position, to: Position}> = []
    
    projectStore.tracks.forEach(track => {
      if (track.initialPosition) {
        // Check if position differs from initial
        const posChanged = 
          Math.abs(track.position.x - track.initialPosition.x) > 0.001 ||
          Math.abs(track.position.y - track.initialPosition.y) > 0.001 ||
          Math.abs(track.position.z - track.initialPosition.z) > 0.001
        
        if (posChanged) {
          tracksToReturn.push({
            trackId: track.id,
            from: { ...track.position },
            to: { ...track.initialPosition }
          })
        }
      }
    })
    
    if (tracksToReturn.length > 0) {
      console.log(`🏠 Home button: Returning ${tracksToReturn.length} tracks to initial positions`)
      
      // Stop any playing animations first
      get().stopAnimation()
      
      // CRITICAL: Initialize OSC batch manager callback to ensure messages are sent
      // Even when engine is not running, we need to send OSC during manual home transition
      oscBatchManager.setSendCallback(async (batch) => {
        console.log(`📤 Home transition: Callback triggered with ${batch.messages.length} messages`)
        
        const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
        const activeConn = oscStore.getActiveConnection()
        
        console.log(`   OSC Connection: ${activeConn ? `${activeConn.host}:${activeConn.port} (connected: ${activeConn.isConnected})` : 'NONE'}`)
        
        if (!activeConn?.isConnected) {
          console.error('   ❌ Cannot send - no active OSC connection!')
          return
        }
        
        console.log(`   Sending batch...`)
        await oscStore.sendBatch(batch)
        console.log(`   ✅ Batch sent successfully`)
      })
      
      // Log track info
      tracksToReturn.forEach(({trackId}) => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        console.log(`  Track: ${track?.name} (holophonixIndex: ${track?.holophonixIndex})`)
      })
      
      // Smooth transition to initial positions (use validated duration)
      get()._easeToPositions(tracksToReturn, duration)
    }
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
    let oscIntervalId: number | null = null

    // CRITICAL FIX: Separate OSC update loop from rendering
    // This prevents 3D rendering from blocking OSC message sending
    // Use setInterval for guaranteed consistent rate independent of rendering
    const TARGET_OSC_FPS = 30 // 30 updates per second for smooth OSC
    const OSC_INTERVAL = 1000 / TARGET_OSC_FPS
    
    const updateOSC = () => {
      const state = get()
      
      // Check if engine should continue running
      if (!state.isEngineRunning || state.playingAnimations.size === 0) {
        return
      }

      const timestamp = Date.now()
      const projectStore = useProjectStore.getState()

      // Process each playing animation for OSC updates
      state.playingAnimations.forEach((playingAnimation, animationId) => {
        const baseAnimation = projectStore.animations.find(a => a.id === playingAnimation.animationId)
        if (!baseAnimation) return
        
        // Calculate animation time
        const timingResult = calculateAnimationTime(
          timestamp,
          baseAnimation,
          playingAnimation.timingState
        )
        
        // Skip if paused or should stop
        if (timingResult.newState.isPaused) return
        if (timingResult.shouldStop) return
        
        // Process each track for OSC messages
        playingAnimation.trackIds.forEach(trackId => {
          const track = projectStore.tracks.find(t => t.id === trackId)
          if (!track) return
          
          // Check mute/solo states
          const hasSoloTracks = projectStore.tracks.some(t => t.isSolo)
          if (track.isMuted || (hasSoloTracks && !track.isSolo)) {
            return
          }

          const trackAnimation = track.animationState?.animation
          const animation = trackAnimation || baseAnimation
          const trackTime = getTrackTime(trackId, timingResult.animationTime, animation)
          
          const context: CalculationContext = {
            trackId,
            time: trackTime,
            duration: animation.duration,
            deltaTime: OSC_INTERVAL / 1000,
            frameCount: state.frameCount,
            state: getAnimationState(animation.id),
          }
          
          // Calculate position for OSC
          const basePosition = modelRuntime.calculatePosition(animation, trackTime, 0, context)
          const position = applyTransform(basePosition, trackId, animation, trackTime, playingAnimation.trackIds)

          // Send OSC message
          if (track.holophonixIndex !== undefined && track.holophonixIndex !== null) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
          }
        })
      })

      // Flush OSC batch
      oscBatchManager.flushBatch()
    }

    // Start OSC update loop with setInterval (not affected by rendering)
    oscIntervalId = window.setInterval(updateOSC, OSC_INTERVAL)

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

      // Process each playing animation for UI updates
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
        }
        
        // Process each track for UI updates (positions visible in 3D)
        playingAnimation.trackIds.forEach(trackId => {
          const track = projectStore.tracks.find(t => t.id === trackId)
          if (!track) return
          
          // CRITICAL: In relative mode, each track has its own animation with per-track parameters
          // Use track.animationState.animation if available (has per-track params), otherwise use base
          const trackAnimation = track.animationState?.animation
          const animation = trackAnimation || baseAnimation
          
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
            state: getAnimationState(animation.id),  // Persistent state for stateful models (pendulum, spring, etc.)
          }
          
          // 3. Calculate base position (model returns position in absolute coordinates)
          const basePosition = modelRuntime.calculatePosition(animation, trackTime, 0, context)
          
          // 4. Apply transform (SINGLE unified application point)
          // Pass activeTrackIds for runtime filtering (LTP track subset support)
          const position = applyTransform(basePosition, trackId, animation, trackTime, playingAnimation.trackIds)

          // Update track position for UI/3D rendering
          projectStore.updateTrack(trackId, { position })
          
          // Note: OSC messages are now sent by separate updateOSC loop above
        })
      })

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

    // Store cleanup functions
    ;(get() as any)._animationFrameId = animationFrameId
    ;(get() as any)._oscIntervalId = oscIntervalId
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

    // Cancel OSC interval timer
    if ((state as any)._oscIntervalId) {
      window.clearInterval((state as any)._oscIntervalId)
      ;(state as any)._oscIntervalId = null
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
    let frameCount = 0
    let animationFrameId: number | null = null
    
    // Easing function (ease-out cubic)
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }
    
    const easeFrame = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutCubic(progress)
      frameCount++
      
      let messagesAdded = 0
      
      // Update each track position
      tracks.forEach(({ trackId, from, to }) => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (!track) {
          console.log(`⚠️ Track ${trackId} not found in projectStore`)
          return
        }
        
        const position: Position = {
          x: from.x + (to.x - from.x) * easedProgress,
          y: from.y + (to.y - from.y) * easedProgress,
          z: from.z + (to.z - from.z) * easedProgress
        }
        
        projectStore.updateTrack(trackId, { position })
        
        // Send OSC message
        if (track.holophonixIndex !== undefined && track.holophonixIndex !== null) {
          const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
          oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
          messagesAdded++
        } else {
          console.log(`⚠️ Track ${track.name} has no holophonixIndex`)
        }
      })
      
      // Debug log every 10 frames
      if (frameCount % 10 === 0 || frameCount === 1) {
        console.log(`🔄 Easing frame ${frameCount}: progress ${(progress * 100).toFixed(1)}%, ${messagesAdded} messages added`)
      }
      
      // CRITICAL: Flush OSC batch to actually send messages during fade-in/fade-out
      oscBatchManager.flushBatch()
      
      // Continue animation or finish
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(easeFrame)
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
              // DON'T clear animation field - preserve per-track animations!
              // animation: null  // ❌ This was destroying per-track animations
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
    console.log(`🎬 Starting easing animation for ${tracks.length} tracks over ${durationMs}ms`)
    animationFrameId = requestAnimationFrame(easeFrame)
  },
}))
