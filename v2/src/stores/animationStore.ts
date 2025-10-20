import { create } from 'zustand'
import { Animation, AnimationState, Position } from '@/types'
import { useProjectStore } from './projectStore'
import { useOSCStore } from './oscStore'
import { useSettingsStore } from './settingsStore'
import { calculatePosition } from '@/utils/animations'
import { oscBatchManager } from '@/utils/oscBatchManager'
import { oscInputManager } from '@/utils/oscInputManager'

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

  playAnimation: (animationId: string, trackIds: string[] = []) => {
    console.log('🎬 Animation engine: Starting playback', { animationId, trackIds })
    set({ 
      isPlaying: true,
      globalTime: 0,
      currentAnimationId: animationId,
      currentTrackIds: trackIds,
      loopCount: 0,  // Reset loop count on new playback
      isReversed: false  // Start in forward direction
    })
    
    // Store initial positions and update tracks' animationState.isPlaying in project store
    if (trackIds.length > 0) {
      const projectStore = useProjectStore.getState()
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find(t => t.id === trackId)
        if (track) {
          // Only set initialPosition if it doesn't exist (first play)
          // Preserve it on resume to maintain original start position
          const shouldSetInitialPos = !track.initialPosition
          
          if (shouldSetInitialPos) {
            console.log('📍 Storing initial position for', track.name, ':', track.position)
          }
          
          projectStore.updateTrack(trackId, {
            ...(shouldSetInitialPos ? { initialPosition: { ...track.position } } : {}),
            animationState: track.animationState ? {
              ...track.animationState,
              isPlaying: true
              // Preserve currentTime for phase offset - don't reset it
            } : null
          })
        }
      })
    }
    
    // Start the engine if not running
    if (!get().isEngineRunning) {
      get().startEngine()
    }
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
    
    // CRITICAL: Clear any pending OSC messages immediately
    oscBatchManager.clearBatch()
    console.log('🧹 Cleared pending OSC batch on stop')
    
    // CRITICAL: Clear animating tracks - listen to incoming positions again
    oscInputManager.clearAnimatingTracks()
    console.log('🎬 Stopped animation, now listening to incoming track positions from Holophonix')
    
    set({
      isPlaying: false,
      globalTime: 0,
      loopCount: 0,
      isReversed: false,
      isEngineRunning: false,  // Stop the engine to prevent wasteful calculations
    })
    
    // Return all tracks to initial positions with smooth interpolation
    if (state.currentTrackIds.length > 0) {
      const projectStore = useProjectStore.getState()
      const oscStore = useOSCStore.getState()
      const settingsStore = useSettingsStore.getState()
      const returnDuration = 1000 // ms
      const startTime = Date.now()
      
      // Store initial state for all tracks
      const trackStates = state.currentTrackIds.map(trackId => {
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
      
      console.log(`🔙 Returning ${trackStates.length} tracks to initial positions`)
      
      let lastInterpolationSendTime = 0
      const interpolateBack = () => {
        const elapsed = Date.now() - startTime
        const currentTime = Date.now()
        const t = Math.min(elapsed / returnDuration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // Smooth easing (ease-out cubic)
        
        console.log(`🔄 AnimEngine: Processing ${trackStates.length} tracks with animations`)
        
        // Update all track positions
        trackStates.forEach(({ track, initialPos, currentPos }) => {
          console.log(`  ➡️ Track ${track.name}: animation=${track.animationState?.animation?.type}, id=${track.animationState?.animation?.id}`)
          const newPos = {
            x: currentPos.x + (initialPos.x - currentPos.x) * eased,
            y: currentPos.y + (initialPos.y - currentPos.y) * eased,
            z: currentPos.z + (initialPos.z - currentPos.z) * eased
          }
          
          projectStore.updateTrack(track.id, { position: newPos })
          
          // Add to batch if throttle interval passed
          const throttleRate = settingsStore.osc?.messageThrottleRate || 50
          if (track.holophonixIndex && (currentTime - lastInterpolationSendTime) >= throttleRate) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            oscBatchManager.addMessage(track.holophonixIndex, newPos, coordType)
          }
        })
        
        // Send batch if throttle interval passed
        const throttleRate = settingsStore.osc?.messageThrottleRate || 50
        if ((currentTime - lastInterpolationSendTime) >= throttleRate) {
          oscBatchManager.flushBatch()
          lastInterpolationSendTime = currentTime
        }
        
        // Continue or finish
        if (t < 1) {
          setTimeout(interpolateBack, 16) // ~60 FPS, continues when minimized
        } else {
          console.log('✅ All tracks returned to initial positions')
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
        }
      }
      
      setTimeout(interpolateBack, 16) // ~60 FPS, continues when minimized
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

    console.log('🚀 Animation engine: Starting')
    set({ isEngineRunning: true })

    // Initialize OSC batch manager callback
    const oscStore = useOSCStore.getState()
    oscBatchManager.setSendCallback(async (batch) => {
      await oscStore.sendBatch(batch)
    })

    let lastTimestamp = Date.now()
    let lastOSCSendTime = 0
    let cleanupListener: (() => void) | null = null

    const targetFPS = 60
    const frameInterval = 1000 / targetFPS // ~16.67ms for 60 FPS
    
    // Check if we're in Electron (use main process timer) or browser (fallback to setInterval)
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    
    if (hasElectronAPI) {
      console.log(`⚙️ Animation engine using MAIN PROCESS timer at ${targetFPS} FPS (never throttled!)`)
    } else {
      console.log(`⚙️ Animation engine using setInterval at ${targetFPS} FPS (browser mode)`)
    }

    const animate = (tickData?: { timestamp: number; deltaTime: number }) => {
      if (!get().isEngineRunning) {
        return
      }

      const state = get()
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
        
        // Check if we should send OSC this frame (time-based throttling)
        const oscThrottleInterval = settingsStore.osc?.messageThrottleRate || 50 // ms
        const shouldSendOSC = (timestamp - lastOSCSendTime) >= oscThrottleInterval
        const useBatching = settingsStore.osc?.useBatching !== false // Default to true
        
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
          
          // Debug logging (only first few frames)
          if (state.frameCount < 5 && phaseOffset > 0) {
            console.log(`⏱️ Track ${track.name}: globalTime=${newGlobalTime.toFixed(2)}s, phaseOffset=${phaseOffset.toFixed(2)}s, rawTrackTime=${rawTrackTime.toFixed(2)}s`)
          }
          
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
            position = {
              x: position.x + offset.x,
              y: position.y + offset.y,
              z: position.z + offset.z
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
          
          // Add to OSC batch if track has holophonix index and throttle interval passed
          if (track.holophonixIndex && shouldSendOSC) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            
            if (useBatching) {
              // Add to batch for efficient sending
              oscBatchManager.addMessage(track.holophonixIndex, position, coordType)
            } else {
              // Legacy mode: send individual messages
              const oscStore = useOSCStore.getState()
              oscStore.sendMessage(`/track/${track.holophonixIndex}/${coordType}`, [position.x, position.y, position.z])
            }
          }
        })
        
        // Flush OSC batch if throttle interval passed
        if (shouldSendOSC && useBatching) {
          oscBatchManager.flushBatch()
          lastOSCSendTime = timestamp
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
          console.log('⏹️ Animation complete at', newGlobalTime.toFixed(2), 'seconds (duration:', animation.duration, ')')
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
      console.log(`✅ Animation engine started with MAIN PROCESS timer (${frameInterval.toFixed(2)}ms)`)
    } else {
      // Fallback to setInterval for browser mode
      const animationInterval = setInterval(() => animate(), frameInterval)
      cleanupListener = () => clearInterval(animationInterval)
      console.log(`✅ Animation engine started with setInterval (${frameInterval.toFixed(2)}ms)`)
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
      console.log('🛑 Animation engine: Stopped (main process timer)')
    } else {
      console.log('🛑 Animation engine: Stopped (setInterval)')
    }
    
    // Cleanup listener
    if (state._cleanupTimer) {
      state._cleanupTimer()
      state._cleanupTimer = null
    }
  },
}))
