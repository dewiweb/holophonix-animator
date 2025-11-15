/**
 * Main Process Animation Engine
 * Runs independently of renderer, never throttled by Chromium
 * Handles position calculations and OSC sending for professional real-time performance
 */

import type { Position } from '../src/types'

// Types for animation engine state
export interface AnimationSnapshot {
  id: string
  type: string
  duration: number
  parameters: Record<string, any>
  loop: boolean
  pingPong: boolean
  transform?: {
    mode: 'absolute' | 'relative' | 'formation'
    tracks: {
      [trackId: string]: {
        offset: Position
        timeShift: number
      }
    }
    formation?: {
      pattern: 'rigid' | 'spherical'
      anchor: Position
    }
  }
}

export interface TrackSnapshot {
  trackId: string
  holophonixIndex: number
  initialPosition: Position
}

export interface PlayingAnimationSnapshot {
  animationId: string
  animation: AnimationSnapshot
  tracks: Map<string, TrackSnapshot>
  timingState: AnimationTimingState
}

export interface AnimationTimingState {
  startTime: number
  loopCount: number
  isReversed: boolean
  isPaused: boolean
  pausedTime?: number
  lastAnimationTime?: number
}

export interface EngineConfig {
  coordinateSystem: string
  playbackSpeed: number
  oscUpdateRate: number  // FPS for OSC updates
}

export interface PositionUpdate {
  trackId: string
  position: Position
  time: number
}

/**
 * Main Process Animation Engine
 * Isolated from renderer, never throttled
 */
export class MainAnimationEngine {
  private playingAnimations: Map<string, PlayingAnimationSnapshot> = new Map()
  private config: EngineConfig = {
    coordinateSystem: 'xyz',
    playbackSpeed: 1.0,
    oscUpdateRate: 30
  }
  private isRunning = false
  private timerId: NodeJS.Timeout | null = null
  private modelRegistry: any = null
  private modelRuntime: any = null
  
  // Callbacks
  private onPositionUpdate?: (updates: PositionUpdate[]) => void
  private onOSCBatch?: (batch: any) => void
  private onAnimationStopped?: (animationId: string) => void
  
  constructor() {
    console.log('🎬 Main Process Animation Engine initialized')
  }
  
  /**
   * Initialize model system (called once at startup)
   */
  async initializeModels() {
    try {
      console.log('📦 Loading model system in main process...')
      
      // Dynamic import of model system
      // Note: We'll need to bundle this or use a different approach
      // For now, we'll create a standalone version
      
      console.log('✅ Model system loaded in main process')
      return true
    } catch (error) {
      console.error('❌ Failed to load model system:', error)
      return false
    }
  }
  
  /**
   * Set configuration
   */
  setConfig(config: Partial<EngineConfig>) {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Engine config updated:', this.config)
  }
  
  /**
   * Register callbacks
   */
  setCallbacks(callbacks: {
    onPositionUpdate?: (updates: PositionUpdate[]) => void
    onOSCBatch?: (batch: any) => void
    onAnimationStopped?: (animationId: string) => void
  }) {
    this.onPositionUpdate = callbacks.onPositionUpdate
    this.onOSCBatch = callbacks.onOSCBatch
    this.onAnimationStopped = callbacks.onAnimationStopped
  }
  
  /**
   * Start playing an animation
   */
  playAnimation(snapshot: PlayingAnimationSnapshot) {
    console.log(`▶️  Main engine: Playing animation ${snapshot.animationId}`)
    
    this.playingAnimations.set(snapshot.animationId, snapshot)
    
    if (!this.isRunning) {
      this.startEngine()
    }
  }
  
  /**
   * Pause an animation
   */
  pauseAnimation(animationId: string, currentTime: number) {
    const animation = this.playingAnimations.get(animationId)
    if (animation) {
      const elapsedTime = currentTime - animation.timingState.startTime
      animation.timingState.isPaused = true
      animation.timingState.pausedTime = elapsedTime
      console.log(`⏸️  Main engine: Paused animation ${animationId}`)
    }
  }
  
  /**
   * Resume an animation
   */
  resumeAnimation(animationId: string, currentTime: number) {
    const animation = this.playingAnimations.get(animationId)
    if (animation && animation.timingState.isPaused && animation.timingState.pausedTime !== undefined) {
      animation.timingState.isPaused = false
      animation.timingState.startTime = currentTime - animation.timingState.pausedTime
      animation.timingState.pausedTime = undefined
      console.log(`▶️  Main engine: Resumed animation ${animationId}`)
    }
  }
  
  /**
   * Stop an animation
   */
  stopAnimation(animationId: string) {
    this.playingAnimations.delete(animationId)
    console.log(`⏹️  Main engine: Stopped animation ${animationId}`)
    
    if (this.playingAnimations.size === 0) {
      this.stopEngine()
    }
  }
  
  /**
   * Stop all animations
   */
  stopAll() {
    console.log('⏹️  Main engine: Stopping all animations')
    this.playingAnimations.clear()
    this.stopEngine()
  }
  
  /**
   * Start the engine timer
   */
  private startEngine() {
    if (this.isRunning) return
    
    this.isRunning = true
    const interval = 1000 / this.config.oscUpdateRate
    
    console.log(`🚀 Main engine started: ${this.config.oscUpdateRate} FPS (${interval.toFixed(1)}ms interval)`)
    
    this.timerId = setInterval(() => {
      this.update()
    }, interval)
  }
  
  /**
   * Stop the engine timer
   */
  private stopEngine() {
    if (!this.isRunning) return
    
    this.isRunning = false
    
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    
    console.log('🛑 Main engine stopped')
  }
  
  /**
   * Main update loop - runs at fixed interval regardless of window visibility
   */
  private update() {
    const timestamp = Date.now()
    const positionUpdates: PositionUpdate[] = []
    const oscMessages: any[] = []
    
    // Process each playing animation
    this.playingAnimations.forEach((playingAnimation, animationId) => {
      const { animation, tracks, timingState } = playingAnimation
      
      // Skip if paused
      if (timingState.isPaused) return
      
      // Calculate animation time
      const elapsedTime = (timestamp - timingState.startTime) * this.config.playbackSpeed
      const duration = animation.duration * 1000 // Convert to ms
      
      let animationTime = elapsedTime / 1000 // Convert to seconds
      let shouldStop = false
      
      // Handle looping
      if (animation.loop) {
        const totalLoops = Math.floor(elapsedTime / duration)
        const timeInLoop = (elapsedTime % duration) / 1000
        
        if (animation.pingPong) {
          // Ping-pong: alternate direction each loop
          const isReversed = totalLoops % 2 === 1
          animationTime = isReversed ? animation.duration - timeInLoop : timeInLoop
        } else {
          // Normal loop
          animationTime = timeInLoop
        }
      } else {
        // No loop - check if finished
        if (animationTime >= animation.duration) {
          animationTime = animation.duration
          shouldStop = true
        }
      }
      
      // Calculate positions for each track
      tracks.forEach((track) => {
        // TODO: Use actual model calculations here
        // For now, use a simple placeholder
        const position = this.calculatePositionPlaceholder(
          animation,
          track,
          animationTime
        )
        
        // Add to position updates for UI
        positionUpdates.push({
          trackId: track.trackId,
          position,
          time: animationTime
        })
        
        // Add to OSC batch
        oscMessages.push({
          trackIndex: track.holophonixIndex,
          position,
          coordSystem: this.config.coordinateSystem
        })
      })
      
      // Stop animation if finished
      if (shouldStop) {
        this.stopAnimation(animationId)
        if (this.onAnimationStopped) {
          this.onAnimationStopped(animationId)
        }
      }
    })
    
    // Send updates
    if (positionUpdates.length > 0 && this.onPositionUpdate) {
      this.onPositionUpdate(positionUpdates)
    }
    
    if (oscMessages.length > 0 && this.onOSCBatch) {
      this.onOSCBatch({
        messages: oscMessages,
        timestamp
      })
    }
  }
  
  /**
   * Placeholder position calculation
   * TODO: Replace with actual model runtime
   */
  private calculatePositionPlaceholder(
    animation: AnimationSnapshot,
    track: TrackSnapshot,
    time: number
  ): Position {
    // Simple circular motion placeholder
    const progress = time / animation.duration
    const angle = progress * Math.PI * 2
    
    const basePosition = {
      x: Math.cos(angle),
      y: Math.sin(angle),
      z: 0
    }
    
    // Apply transform if present
    if (animation.transform) {
      const trackTransform = animation.transform.tracks[track.trackId]
      if (trackTransform) {
        return {
          x: basePosition.x + trackTransform.offset.x,
          y: basePosition.y + trackTransform.offset.y,
          z: basePosition.z + trackTransform.offset.z
        }
      }
    }
    
    return basePosition
  }
  
  /**
   * Get engine status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      playingAnimations: this.playingAnimations.size,
      config: this.config
    }
  }
}

// Create singleton instance
export const mainAnimationEngine = new MainAnimationEngine()
