import { create } from 'zustand'
import { Animation, AnimationState, Position, AnimationType } from '@/types'
import { useProjectStore } from './projectStore'
import { useOSCStore } from './oscStore'
import { useSettingsStore } from './settingsStore'
import { calculatePosition } from '@/utils/animations'
import { oscBatchManager } from '@/utils/oscBatchManager'
import { oscInputManager } from '@/utils/oscInputManager'
import { oscMessageOptimizer, type TrackPositionUpdate } from '@/utils/oscMessageOptimizer'

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
  // Only rotate for rotational animations
  const rotationalTypes: AnimationType[] = ['circular', 'spiral', 'orbit', 'circular-scan', 'rose-curve', 'epicycloid']
  
  if (!rotationalTypes.includes(animationType)) {
    // Non-rotational animations: offset stays fixed
    return offset
  }
  
  // Calculate rotation angle based on animation type
  let rotationAngle = 0
  
  if (animationType === 'circular' || animationType === 'circular-scan') {
    const startAngle = (Number(params?.startAngle) || 0) * (Math.PI / 180)
    const endAngle = (Number(params?.endAngle) || 360) * (Math.PI / 180)
    const t = Math.min(time / (duration || 1), 1)
    rotationAngle = startAngle + (endAngle - startAngle) * t
  } else if (animationType === 'spiral') {
    const rotations = Number(params?.rotations) || 3
    const t = Math.min(time / (duration || 1), 1)
    rotationAngle = t * rotations * 2 * Math.PI
  } else if (animationType === 'orbit') {
    const speed = Number(params?.speed) || 1
    rotationAngle = (time / duration) * speed * 2 * Math.PI
  }
  
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
  } else if (plane === 'yz') {
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)
    return {
      x: offset.x,
      y: offset.y * cos - offset.z * sin,
      z: offset.y * sin + offset.z * cos
    }
  }
  
  return offset
}

interface AnimationEngineState {
  // Animation playback state
  isPlaying: boolean
  globalTime: number
  playbackSpeed: number
  currentAnimationId: string | null
  currentTrackIds: string[]  // Changed from singular to array for multi-track support

  // Animation management
  playAnimation: (animationId: string, trackIds?: string[]) => void  // Support multiple tracks
  pauseAnimation: () => void
  stopAnimation: () => void
  seekTo: (time: number) => void
  goToStart: (durationMs?: number, trackIds?: string[]) => void
  _startPlayback: (animationId: string, trackIds: string[]) => void

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
    // Queue a go-to-start transition, then start playback automatically
    set({ pendingPlay: { animationId, trackIds } })
    // Use a short easing; configurable if needed later
    get().goToStart(400, trackIds)
  },

  _startPlayback: (animationId: string, trackIds: string[] = []) => {
    set({ 
      isPlaying: true,
      globalTime: 0,
      currentAnimationId: animationId,
      currentTrackIds: trackIds,
      loopCount: 0,
      isReversed: false
    })

    // Configure OSC optimizer
    const projectStore = useProjectStore.getState()
    oscMessageOptimizer.updateSettings({
      enableIncrementalUpdates: true,
      enablePatternMatching: true,
      autoSelectCoordinateSystem: true,
      incrementalThreshold: 0.5,
      singleAxisThreshold: 0.9,
      forceCoordinateSystem: undefined
    })
    oscMessageOptimizer.setTotalTracks(projectStore.tracks.length)
    oscMessageOptimizer.reset()

    // Store initial positions and mark tracks as playing
    if (trackIds.length > 0) {
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track) {
          const shouldSetInitialPos = !track.initialPosition
          projectStore.updateTrack(trackId, {
            ...(shouldSetInitialPos ? { initialPosition: { ...track.position } } : {}),
            animationState: track.animationState ? { ...track.animationState, isPlaying: true } : null
          })
        }
      })
    }

    if (!get().isEngineRunning) {
      get().startEngine()
    }
  },

  goToStart: (durationMs?: number, trackIdsParam?: string[]) => {
    const state = get()
    // Pause playback during transition
    if (state.isPlaying) {
      get().pauseAnimation()
    }

    const projectStore = useProjectStore.getState()
    const settingsStore = useSettingsStore.getState()
    const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'

    // Ensure OSC batch manager has a send callback even when engine is not running (pre-roll easing)
    const oscStoreForGoToStart = useOSCStore.getState()
    oscBatchManager.setSendCallback(async (batch) => {
      oscStoreForGoToStart.sendBatchAsync(batch)
    })

    const targetTrackIds = (trackIdsParam && trackIdsParam.length > 0) ? [...trackIdsParam] : [...state.currentTrackIds]
    if (targetTrackIds.length === 0) {
      // No targets to ease; if a play is pending, start immediately
      const pending = get().pendingPlay
      if (pending) {
        get()._startPlayback(pending.animationId, pending.trackIds)
      }
      return
    }

    // Cancel any ongoing go-to-start interpolation
    if (state.goToStartInterpolationId !== null) {
      clearTimeout(state.goToStartInterpolationId)
    }

    const duration = typeof durationMs === 'number' && durationMs > 0 ? durationMs : 1000 // ms
    const startTime = Date.now()

    // Build targets at t=0 per track using same offset logic as engine
    const trackTargets = targetTrackIds.map(trackId => {
      const track = projectStore.tracks.find(t => t.id === trackId)
      if (!track || !track.animationState?.animation) return null
      const animation = track.animationState.animation
      const enhancedAnimation = animation.type === 'custom' && track.initialPosition
        ? {
            ...animation,
            parameters: {
              ...animation.parameters,
              initialPosition: track.initialPosition
            }
          }
        : animation

      let position = calculatePosition(enhancedAnimation, 0, 0)
      const params = enhancedAnimation.parameters as any

      if (params._isobarycenter && params._trackOffset) {
        const offset = params._trackOffset
        const rotatedOffset = rotateOffsetForAnimation(
          offset,
          enhancedAnimation.type,
          params,
          0,
          enhancedAnimation.duration
        )
        position = { x: position.x + rotatedOffset.x, y: position.y + rotatedOffset.y, z: position.z + rotatedOffset.z }
      }

      if (params._centeredPoint && params._trackOffset) {
        const offset = params._trackOffset
        const rotatedOffset = rotateOffsetForAnimation(
          offset,
          enhancedAnimation.type,
          params,
          0,
          enhancedAnimation.duration
        )
        position = { x: position.x + rotatedOffset.x, y: position.y + rotatedOffset.y, z: position.z + rotatedOffset.z }
      }

      return { track, target: position }
    }).filter(Boolean) as Array<{ track: any; target: Position }>

    if (trackTargets.length === 0) return

    set({ isGoingToStart: true })

    let lastFlush = 0
    const step = () => {
      const now = Date.now()
      const t = Math.min((now - startTime) / duration, 1)
      const eased = t * (2 - t)

      trackTargets.forEach(({ track, target }) => {
        const current = track.position
        const newPos = {
          x: current.x + (target.x - current.x) * eased,
          y: current.y + (target.y - current.y) * eased,
          z: current.z + (target.z - current.z) * eased
        }
        projectStore.updateTrack(track.id, { position: newPos })
        if (track.holophonixIndex) {
          oscBatchManager.addMessage(track.holophonixIndex, newPos, coordType)
        }
      })

      const currentTime = Date.now()
      if (currentTime - lastFlush >= 33) {
        oscBatchManager.flushBatch()
        lastFlush = currentTime
      }

      if (t < 1 && get().isGoingToStart) {
        const id = setTimeout(step, 16) as unknown as number
        set({ goToStartInterpolationId: id })
      } else {
        // Final flush and clear state
        oscBatchManager.flushBatch()
        const pending = get().pendingPlay
        set({ goToStartInterpolationId: null, isGoingToStart: false, pendingPlay: null })
        if (pending) {
          get()._startPlayback(pending.animationId, pending.trackIds)
        }
      }
    }

    step()
  },

  pauseAnimation: () => {
    const state = get()
    set({ isPlaying: false })
    
    // Update all tracks' animationState.isPlaying in project store
    if (state.currentTrackIds.length > 0) {
      const projectStore = useProjectStore.getState()
      state.currentTrackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track?.animationState) {
          projectStore.updateTrack(trackId, {
            animationState: {
              ...track.animationState,
              isPlaying: false
            }
          })
        }
      })
    }
  },

  stopAnimation: () => {
    const state = get()
    
    // CRITICAL: Capture currentTrackIds BEFORE clearing state
    const trackIdsToReturn = [...state.currentTrackIds]
    
    // CRITICAL: Cancel any ongoing return-to-initial interpolation
    if (state.returnInterpolationId !== null) {
      clearTimeout(state.returnInterpolationId)
    }
    
    // CRITICAL: Stop the engine FIRST to prevent more frames
    get().stopEngine()
    
    // CRITICAL: Clear any pending OSC messages immediately
    oscBatchManager.clearBatch()
    
    // CRITICAL: Clear OSC socket buffer to prevent desync
    // Buffered messages would continue sending to device after UI stops
    const oscStore = useOSCStore.getState()
    const activeConnection = oscStore.getActiveConnection()
    if (activeConnection?.isConnected) {
      const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
      if (hasElectronAPI && (window as any).electronAPI.oscClearDeviceBuffer) {
        // Fire-and-forget: clear the buffer without waiting
        ;(window as any).electronAPI.oscClearDeviceBuffer(activeConnection.id).catch(() => {
          console.warn('Could not clear OSC buffer')
        })
      }
    }
    
    // CRITICAL: Clear animating tracks - listen to incoming positions again
    oscInputManager.clearAnimatingTracks()
    
    set({
      isPlaying: false,
      globalTime: 0,
      loopCount: 0,
      isReversed: false,
      isEngineRunning: false,
      returnInterpolationId: null,
      isReturningToInitial: false,
      currentTrackIds: [], // Clear tracks to prevent any further processing
    })
    
    // CRITICAL: Brief delay to ensure all async operations complete/abort
    // This prevents stale animation frames from interfering with return-to-initial
    const cleanupDelay = 50 // ms - enough for async sends to abort
    
    // Return all tracks to initial positions with smooth interpolation
    if (trackIdsToReturn.length > 0) {
      const projectStore = useProjectStore.getState()
      const oscStore = useOSCStore.getState()
      const settingsStore = useSettingsStore.getState()
      const returnDuration = 1000 // ms
      const startTime = Date.now()
      
      // Store initial state for all tracks
      const trackStates = trackIdsToReturn.map(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track) {
          return {
            trackId,
            track,
            initialPos: track.initialPosition || track.position,
            currentPos: { ...track.position }
          }
        }
        return null
      }).filter(Boolean) as Array<{ trackId: string; track: any; initialPos: any; currentPos: any }>
      
      set({ isReturningToInitial: true })
      
      let lastInterpolationSendTime = 0
      const interpolateBack = () => {
        // Check if we should stop interpolation (user called stop again)
        if (!get().isReturningToInitial) {
          return
        }
        
        const elapsed = Date.now() - startTime
        const currentTime = Date.now()
        const t = Math.min(elapsed / returnDuration, 1)
        // Smooth easing with immediate start (ease-out-quad for gentler motion)
        const eased = t * (2 - t)
        
        // Update all track positions and add to OSC batch
        trackStates.forEach(({ track, initialPos, currentPos }) => {
          const newPos = {
            x: currentPos.x + (initialPos.x - currentPos.x) * eased,
            y: currentPos.y + (initialPos.y - currentPos.y) * eased,
            z: currentPos.z + (initialPos.z - currentPos.z) * eased
          }
          
          projectStore.updateTrack(track.id, { position: newPos })
          
          // ALWAYS add to batch - don't throttle adding, only throttle flushing
          if (track.holophonixIndex) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            oscBatchManager.addMessage(track.holophonixIndex, newPos, coordType)
          }
        })
        
        // Flush batch at consistent intervals for smooth interpolation
        const throttleRate = oscBatchManager.getAdaptiveThrottleRate()
        if ((currentTime - lastInterpolationSendTime) >= throttleRate) {
          oscBatchManager.flushBatch()
          lastInterpolationSendTime = currentTime
        }
        
        // Continue or finish
        if (t < 1) {
          const timeoutId = setTimeout(interpolateBack, 16) as unknown as number
          set({ returnInterpolationId: timeoutId })
        } else {
          // Flush any remaining messages
          oscBatchManager.flushBatch()
          
          // Update animation states
          trackStates.forEach(({ trackId, track }) => {
            if (track.animationState) {
              projectStore.updateTrack(trackId, {
                animationState: {
                  ...track.animationState,
                  isPlaying: false
                }
              })
            }
          })
          
          // Clear return state
          set({ returnInterpolationId: null, isReturningToInitial: false })
        }
      }
      
      // Start after cleanup delay to ensure no interference from stale frames
      setTimeout(() => {
        // Double-check we're still supposed to return (user didn't restart)
        if (get().isReturningToInitial) {
          interpolateBack()
        }
      }, cleanupDelay)
    }
  },

  seekTo: (time: number) => {
    set({ globalTime: Math.max(0, time) })
  },

  getTrackPosition: (trackId: string, time?: number): Position | null => {
    const currentTime = time ?? get().globalTime
    // Implementation will compute position based on animation state
    return null
  },

  getAnimationState: (trackId: string): AnimationState | null => {
    // Implementation will return current animation state for track
    return null
  },

  startEngine: () => {
    if (get().isEngineRunning) return

    set({ isEngineRunning: true })

    // Initialize OSC batch manager callback (use async non-blocking version)
    const oscStore = useOSCStore.getState()
    oscBatchManager.setSendCallback(async (batch) => {
      // Use async fire-and-forget for animation performance
      oscStore.sendBatchAsync(batch)
    })

    let lastTimestamp = Date.now()
    let lastSuccessfulFlushTime = 0
    let cleanupListener: (() => void) | null = null
    
    // Track previous positions for incremental OSC updates
    const previousPositions = new Map<string, Position>()
    let isFirstFrame = true  // Flag to send absolute positions on first frame

    const targetFPS = 60
    const frameInterval = 1000 / targetFPS // ~16.67ms for 60 FPS
    
    // Check if we're in Electron (use main process timer) or browser (fallback to setInterval)
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI

    const animate = (tickData?: { timestamp: number; deltaTime: number }) => {
      const state = get()
      
      // CRITICAL: Check FIRST if engine is still running
      if (!state.isEngineRunning || !state.isPlaying) {
        return // Immediately bail if stopped
      }
      // Use tick data from main process if available, otherwise calculate
      const timestamp = tickData?.timestamp || Date.now()
      const deltaTime = tickData?.deltaTime || (timestamp - lastTimestamp)
      lastTimestamp = timestamp
      
      const newFrameCount = state.frameCount + 1
      
      // Calculate time increment (reverse if in ping-pong reverse mode)
      const timeIncrement = (deltaTime / 1000) * state.playbackSpeed
      const direction = state.isReversed ? -1 : 1
      
      const newGlobalTime = state.isPlaying
        ? state.globalTime + (timeIncrement * direction)
        : state.globalTime
      
      // Timing is working correctly - debug logs removed

      // Update frame statistics
      const frameTime = deltaTime
      const newAverageFrameTime = state.averageFrameTime === 0
        ? frameTime
        : (state.averageFrameTime * 0.9) + (frameTime * 0.1)

      // Check playback state BEFORE updating state
      const shouldProcessTracks = state.isPlaying && state.currentTrackIds.length > 0 && state.currentAnimationId
      
      set({
        globalTime: newGlobalTime,
        frameCount: newFrameCount,
        averageFrameTime: newAverageFrameTime,
      })

      // If playing, calculate and send positions for ALL tracks
      if (shouldProcessTracks) {
        const projectStore = useProjectStore.getState()
        const settingsStore = useSettingsStore.getState()
        
        const useBatching = settingsStore.osc?.useBatching !== false // Default to true
        const useOptimizer = false // DISABLED: Optimizer causing slow movement and queue buildup
        
        // Collect track position updates for optimizer
        const trackUpdates: TrackPositionUpdate[] = []
        
        // Process each track
        state.currentTrackIds.forEach(trackId => {
          const track = projectStore.tracks.find(t => t.id === trackId)

          if (!track) {
            console.error('❌ Track not found:', trackId)
            return
          }

          // Check mute/solo states
          const hasSoloTracks = projectStore.tracks.some(t => t.isSolo)
          if (track.isMuted || (hasSoloTracks && !track.isSolo)) {
            // Skip muted tracks or non-solo tracks when solo mode is active
            return
          }

          if (!track.animationState?.animation) {
            console.error('❌ No animation assigned to track:', track.name)
            return
          }
          
          const animation = track.animationState.animation
          
          // For custom animations, inject initial position into parameters
          const enhancedAnimation = animation.type === 'custom' && track.initialPosition
            ? {
                ...animation,
                parameters: {
                  ...animation.parameters,
                  initialPosition: track.initialPosition
                }
              }
            : animation
          
          // Calculate position using the track's specific animation time (for phase-offset support)
          // Subtract offset to delay tracks: Track with offset=5 starts 5 seconds later
          const phaseOffset = track.animationState.currentTime || 0
          let rawTrackTime = Math.max(0, newGlobalTime - phaseOffset)
          
          // Handle loop/ping-pong PER TRACK based on track's own timeline
          // This allows each track to loop independently in phase-offset mode
          let trackTime = rawTrackTime
          let trackLoopCount = 0
          
          if (animation.duration > 0 && rawTrackTime > 0) {
            if (animation.loop && animation.pingPong) {
              // Per-track ping-pong: calculate which loop cycle and direction
              trackLoopCount = Math.floor(rawTrackTime / animation.duration)
              const isTrackReversed = trackLoopCount % 2 === 1
              const timeInCycle = rawTrackTime % animation.duration
              trackTime = isTrackReversed ? animation.duration - timeInCycle : timeInCycle
              
              // Per-track ping-pong working correctly
            } else if (animation.loop) {
              // Per-track normal loop: wrap with modulo
              trackLoopCount = Math.floor(rawTrackTime / animation.duration)
              trackTime = rawTrackTime % animation.duration
              
              // Per-track normal loop working correctly
            } else {
              // No loop: clamp to duration
              trackTime = Math.min(rawTrackTime, animation.duration)
            }
          }
          
          let position = calculatePosition(enhancedAnimation, trackTime, trackLoopCount)
          
          // Handle isobarycenter mode: position is the barycenter, apply track's offset
          const params = enhancedAnimation.parameters as any
          if (params._isobarycenter && params._trackOffset) {
            const offset = params._trackOffset
            
            // For rotational animations, rotate the offset along with the animation
            const rotatedOffset = rotateOffsetForAnimation(
              offset,
              enhancedAnimation.type,
              params,
              trackTime,
              enhancedAnimation.duration
            )
            
            position = {
              x: position.x + rotatedOffset.x,
              y: position.y + rotatedOffset.y,
              z: position.z + rotatedOffset.z
            }
          }
          
          // Handle centered mode: position is around center point, apply track's offset
          if (params._centeredPoint && params._trackOffset) {
            const offset = params._trackOffset
            
            // For rotational animations, rotate the offset along with the animation
            const rotatedOffset = rotateOffsetForAnimation(
              offset,
              enhancedAnimation.type,
              params,
              trackTime,
              enhancedAnimation.duration
            )
            
            position = {
              x: position.x + rotatedOffset.x,
              y: position.y + rotatedOffset.y,
              z: position.z + rotatedOffset.z
            }
          }
          
          // Validate position - check for NaN
          if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.error('❌ Invalid position calculated:', { trackId, position, time: trackTime })
            return
          }
          
          // Update track position in UI immediately (every frame)
          projectStore.updateTrack(track.id, {
            position
            // Note: Do NOT update currentTime here - it should remain as phase offset
            // Updating it creates accumulation since it's added to newGlobalTime
          })
          
          // Collect track position for optimizer
          if (track.holophonixIndex && useOptimizer) {
            // Get previous position from last frame (not initialPosition!)
            const prevPos = previousPositions.get(track.id) || position
            
            trackUpdates.push({
              trackIndex: track.holophonixIndex,
              position,
              previousPosition: prevPos // Use actual previous frame position for delta calculation
            })
            
            // Store current position as previous for next frame
            previousPositions.set(track.id, position)
          } else if (track.holophonixIndex) {
            // Fallback to legacy batch manager
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            
            if (useBatching) {
              oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
            } else {
              // Legacy mode: send individual messages every frame
              const oscStore = useOSCStore.getState()
              oscStore.sendMessage(`/track/${track.holophonixIndex}/${coordType}`, [position.x, position.y, position.z])
            }
          }
        })
        
        // Use optimizer to generate optimized OSC messages
        if (useOptimizer && trackUpdates.length > 0) {
          // Determine multi-track mode from first track's animation
          const firstTrack = projectStore.tracks.find(t => t.id === state.currentTrackIds[0])
          const animation = firstTrack?.animationState?.animation
          const multiTrackMode = (animation?.parameters as any)?._multiTrackMode || 'identical'
          
          // Debug logging removed for performance with multi-track animations
          
          // Generate optimized messages
          const optimizedMessages = oscMessageOptimizer.optimize(
            trackUpdates,
            animation?.type || 'linear',
            multiTrackMode
          )
          
          // Send optimized messages directly (non-blocking for performance)
          const oscStore = useOSCStore.getState()
          optimizedMessages.forEach(msg => {
            oscStore.sendMessageAsync(msg.address, msg.args)
          })
          
          // Optimization stats logging removed for performance
          // Enable manually via browser console if needed: window.enableAnimationDebug = true
          
          isFirstFrame = false  // Clear first frame flag after first send
        }
        
        // Flush batch at controlled rate to prevent drift
        if (useBatching && !useOptimizer) {
          const pendingCount = oscBatchManager.getPendingCount()
          const timeSinceLastFlush = timestamp - lastSuccessfulFlushTime
          
          // Throttle to 30 FPS (33ms) to prevent network congestion
          // 60 FPS was too aggressive, causing jitter and drift
          const shouldFlush = timeSinceLastFlush >= 33 && pendingCount > 0
          
          if (shouldFlush) {
            // Fire-and-forget (don't await to avoid blocking animation loop)
            oscBatchManager.flushBatch().then(flushed => {
              if (flushed) {
                lastSuccessfulFlushTime = Date.now()
              }
            })
          }
        }
        
        // Handle loop/end - check first track's animation for duration
        const firstTrack = projectStore.tracks.find(t => t.id === state.currentTrackIds[0])
        const animation = firstTrack?.animationState?.animation
        
        // Calculate effective duration including phase offsets
        // Find the maximum phase offset across all tracks
        let maxPhaseOffset = 0
        if (animation) {
          state.currentTrackIds.forEach(trackId => {
            const track = projectStore.tracks.find(t => t.id === trackId)
            const phaseOffset = track?.animationState?.currentTime || 0
            maxPhaseOffset = Math.max(maxPhaseOffset, phaseOffset)
          })
        }
        const effectiveDuration = animation ? animation.duration + maxPhaseOffset : 0
        
        // Handle end of animation (only for non-looping animations)
        // Loop/ping-pong is now handled PER TRACK in the position calculation above
        if (animation && !animation.loop && newGlobalTime >= effectiveDuration) {
          set({ isPlaying: false, globalTime: 0, loopCount: 0, isReversed: false, isEngineRunning: false })
        }
      }

      // No need to schedule next frame - timer handles it
    }

    // Start the animation timer
    if (hasElectronAPI) {
      // Use main process timer (never throttled when minimized)
      cleanupListener = (window as any).electronAPI.onAnimationTick(animate);
      (window as any).electronAPI.startAnimationTimer(frameInterval)
    } else {
      // Fallback to setInterval for browser mode
      const animationInterval = setInterval(() => animate(), frameInterval)
      cleanupListener = () => clearInterval(animationInterval)
    }
    
    // Store cleanup function for stopEngine
    (get() as any)._cleanupTimer = cleanupListener
  },

  stopEngine: () => {
    const state = get() as any
    set({ isEngineRunning: false })
    
    // Stop the timer
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    if (hasElectronAPI) {
      (window as any).electronAPI.stopAnimationTimer()
    }
    
    // Cleanup listener
    if (state._cleanupTimer) {
      state._cleanupTimer()
      state._cleanupTimer = null
    }
  },
}))
