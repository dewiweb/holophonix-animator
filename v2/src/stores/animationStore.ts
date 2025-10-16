import { create } from 'zustand'
import { Animation, AnimationState, Position } from '@/types'
import { useProjectStore } from './projectStore'
import { useOSCStore } from './oscStore'
import { useSettingsStore } from './settingsStore'
import { calculatePosition } from '@/utils/animations'

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
      
      let interpolationFrameCount = 0
      const interpolateBack = () => {
        const elapsed = Date.now() - startTime
        const t = Math.min(elapsed / returnDuration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // Smooth easing (ease-out cubic)
        
        interpolationFrameCount++
        
        console.log(`🔄 AnimEngine: Processing ${trackStates.length} tracks with animations`)
        trackStates.forEach(({ track, initialPos, currentPos }) => {
          console.log(`  ➡️ Track ${track.name}: animation=${track.animation?.type}, id=${track.animation?.id}`)
          const newPos = {
            x: currentPos.x + (initialPos.x - currentPos.x) * eased,
            y: currentPos.y + (initialPos.y - currentPos.y) * eased,
            z: currentPos.z + (initialPos.z - currentPos.z) * eased
          }
          
          projectStore.updateTrack(track.id, { position: newPos })
          
          // Throttle OSC messages during interpolation to prevent flooding
          const settingsStore = useSettingsStore.getState()
          const throttleRate = settingsStore.osc?.messageThrottleRate || 1 // Fallback to 1 if undefined
          if (track.holophonixIndex && interpolationFrameCount % throttleRate === 0) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            oscStore.sendMessage(`/track/${track.holophonixIndex}/${coordType}`, [newPos.x, newPos.y, newPos.z])
          }
        })
        
        // Continue or finish
        if (t < 1) {
          requestAnimationFrame(interpolateBack)
        } else {
          console.log('✅ All tracks returned to initial positions')
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
      
      requestAnimationFrame(interpolateBack)
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

    let lastTimestamp = 0
    let lastOSCTime = 0

    const animate = (timestamp: number) => {
      if (!get().isEngineRunning) return

      const state = get()
      const deltaTime = lastTimestamp ? timestamp - lastTimestamp : 16.67
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
        const oscStore = useOSCStore.getState()
        
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
          
          const position = calculatePosition(enhancedAnimation, trackTime, trackLoopCount)
          
          // Validate position - check for NaN
          if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.error('❌ Invalid position calculated:', { trackId, position, time: trackTime })
            return
          }
          
          // Update track position
          projectStore.updateTrack(track.id, {
            position
            // Note: Do NOT update currentTime here - it should remain as phase offset
            // Updating it creates accumulation since it's added to newGlobalTime
          })
          
          // Send OSC message for this track (throttled based on settings)
          const settingsStore = useSettingsStore.getState()
          const throttleRate = settingsStore.osc?.messageThrottleRate || 1 // Fallback to 1 if undefined
          if (track.holophonixIndex && state.frameCount % throttleRate === 0) {
            const coordType = projectStore.currentProject?.coordinateSystem.type || 'xyz'
            console.log(`📤 Sending OSC: /track/${track.holophonixIndex}/${coordType}`, [position.x, position.y, position.z])
            oscStore.sendMessage(`/track/${track.holophonixIndex}/${coordType}`, [position.x, position.y, position.z])
          } else if (track.holophonixIndex && state.frameCount % throttleRate !== 0) {
            console.log(`⏭️ Skipping OSC send (throttle: ${throttleRate}, frame: ${state.frameCount})`)
          } else if (!track.holophonixIndex) {
            console.warn(`❌ Track ${track.name} missing holophonixIndex - cannot send OSC`)
          }
        })
        
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

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  },

  stopEngine: () => {
    set({ isEngineRunning: false })
  },
}))
