/**
 * Main Process Animation Engine
 * Runs independently of renderer, never throttled by Chromium
 * Plain JavaScript for direct loading in Electron main process
 */

/**
 * Main Process Animation Engine
 * Isolated from renderer, never throttled
 */
class MainAnimationEngine {
  constructor() {
    this.playingAnimations = new Map()
    this.config = {
      coordinateSystem: 'xyz',
      playbackSpeed: 1.0,
      oscUpdateRate: 30
    }
    this.isRunning = false
    this.timerId = null
    
    // Callbacks
    this.onPositionUpdate = null
    this.onOSCBatch = null
    this.onAnimationStopped = null
    this.onPositionCalculationRequest = null
    
    console.log('🎬 Main Process Animation Engine initialized')
  }
  
  /**
   * Set configuration
   */
  setConfig(config) {
    this.config = { ...this.config, ...config }
    console.log('⚙️ Engine config updated:', this.config)
  }
  
  /**
   * Register callbacks
   */
  setCallbacks(callbacks) {
    this.onPositionUpdate = callbacks.onPositionUpdate
    this.onOSCBatch = callbacks.onOSCBatch
    this.onAnimationStopped = callbacks.onAnimationStopped
    this.onPositionCalculationRequest = callbacks.onPositionCalculationRequest
  }
  
  /**
   * Start playing an animation
   */
  playAnimation(snapshot) {
    console.log(`▶️  Main engine: Playing animation ${snapshot.animationId}`)
    
    this.playingAnimations.set(snapshot.animationId, snapshot)
    
    if (!this.isRunning) {
      this.startEngine()
    }
  }
  
  /**
   * Pause an animation
   */
  pauseAnimation(animationId, currentTime) {
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
  resumeAnimation(animationId, currentTime) {
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
  stopAnimation(animationId) {
    console.log(`🛑 Main engine stopAnimation called: ${animationId}, currently playing: ${this.playingAnimations.size}`)
    this.playingAnimations.delete(animationId)
    console.log(`⏹️  Main engine: Stopped animation ${animationId}, now playing: ${this.playingAnimations.size}`)
    
    if (this.playingAnimations.size === 0) {
      this.stopEngine()
    }
  }
  
  /**
   * Stop all animations
   */
  stopAll() {
    console.log(`🛑 Main engine stopAll called, currently playing: ${this.playingAnimations.size}`)
    this.playingAnimations.clear()
    console.log('⏹️  Main engine: Stopped all animations, now playing: 0')
    this.stopEngine()
  }
  
  /**
   * Start the engine timer
   */
  startEngine() {
    if (this.isRunning) return
    
    this.isRunning = true
    const interval = 1000 / this.config.oscUpdateRate
    
    console.log(`🚀 Main engine started: ${this.config.oscUpdateRate} FPS (${interval.toFixed(1)}ms interval)`)
    console.log(`✅ CRITICAL: Engine runs in MAIN PROCESS - NEVER THROTTLED by OS`)
    
    this.timerId = setInterval(() => {
      this.update()
    }, interval)
  }
  
  /**
   * Stop the engine timer
   */
  stopEngine() {
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
   * Requests position calculations from renderer and immediately sends via OSC
   */
  update() {
    const timestamp = Date.now()
    
    // Collect calculation requests for all playing animations
    const requests = []
    
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
      
      // Request position calculation from renderer
      const trackIds = Array.from(tracks.values()).map(t => t.trackId)
      requests.push({
        animationId,
        time: animationTime,
        trackIds,
        shouldStop
      })
    })
    
    // Send all requests to renderer for calculation
    if (requests.length > 0 && this.onPositionCalculationRequest) {
      this.onPositionCalculationRequest(requests)
    }
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
const mainAnimationEngine = new MainAnimationEngine()

// CommonJS export for Electron main process
module.exports = { mainAnimationEngine }
