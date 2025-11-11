/**
 * Animation Timing Engine
 * 
 * Centralizes all animation timing logic including:
 * - Loop handling
 * - Ping-pong (forward/backward) mode
 * - Time calculation with phase offsets
 * - Animation lifecycle state transitions
 * 
 * This is the SINGLE source of truth for animation timing.
 */

import type { Animation } from '@/types'

/**
 * Animation timing state for a single animation instance
 */
export interface AnimationTimingState {
  startTime: number           // When animation started (timestamp in ms)
  pausedTime?: number         // Elapsed time when paused (ms)
  loopCount: number           // Current loop iteration (0 = first playback)
  isReversed: boolean         // True if playing backward (ping-pong mode)
  isPaused: boolean           // True if currently paused
  lastAnimationTime?: number  // Last calculated animation time (seconds)
}

/**
 * Result of timing calculation
 */
export interface TimingResult {
  animationTime: number       // Actual time to pass to model (seconds, accounts for ping-pong)
  progress: number            // 0-1 progress through current cycle
  loopCount: number           // Current loop iteration
  isReversed: boolean         // Current direction
  shouldLoop: boolean         // True if animation should loop now
  shouldStop: boolean         // True if animation should stop now
  newState: AnimationTimingState  // Updated state
}

/**
 * Calculate animation time and handle loop/ping-pong logic
 * 
 * This is the CORE timing function - all animation timing flows through here.
 * 
 * @param currentTime - Current timestamp (milliseconds)
 * @param animation - Animation configuration
 * @param state - Current timing state
 * @returns Timing result with calculated time and state transitions
 */
export function calculateAnimationTime(
  currentTime: number,
  animation: Animation,
  state: AnimationTimingState
): TimingResult {
  // If paused, use stored pausedTime
  if (state.isPaused && state.pausedTime !== undefined) {
    const animationTime = state.pausedTime / 1000  // Convert ms to seconds
    return {
      animationTime,
      progress: Math.min(animationTime / animation.duration, 1),
      loopCount: state.loopCount,
      isReversed: state.isReversed,
      shouldLoop: false,
      shouldStop: false,
      newState: state  // No state change when paused
    }
  }
  
  // Calculate elapsed time in seconds
  const elapsedMs = currentTime - state.startTime
  const elapsedSeconds = elapsedMs / 1000
  
  // Handle non-looping animations
  if (!animation.loop) {
    const clampedTime = Math.min(elapsedSeconds, animation.duration)
    const shouldStop = elapsedSeconds >= animation.duration
    
    return {
      animationTime: clampedTime,
      progress: clampedTime / animation.duration,
      loopCount: 0,
      isReversed: false,
      shouldLoop: false,
      shouldStop,
      newState: state
    }
  }
  
  // ===== LOOPING ANIMATION =====
  
  // Calculate which loop iteration we're in
  const totalLoops = Math.floor(elapsedSeconds / animation.duration)
  const timeInCurrentLoop = elapsedSeconds % animation.duration
  
  // Determine if we just completed a loop
  const justCompletedLoop = totalLoops > state.loopCount
  
  // ===== PING-PONG MODE =====
  if (animation.pingPong) {
    // In ping-pong mode, alternate direction every loop
    // Loop 0: forward (isReversed = false)
    // Loop 1: backward (isReversed = true)
    // Loop 2: forward (isReversed = false)
    // etc.
    const shouldBeReversed = totalLoops % 2 === 1
    
    // Calculate animation time based on direction
    let animationTime: number
    if (shouldBeReversed) {
      // Backward: time counts down from duration to 0
      animationTime = animation.duration - timeInCurrentLoop
    } else {
      // Forward: time counts up from 0 to duration
      animationTime = timeInCurrentLoop
    }
    
    // Ensure time stays in valid range
    animationTime = Math.max(0, Math.min(animationTime, animation.duration))
    
    return {
      animationTime,
      progress: timeInCurrentLoop / animation.duration,
      loopCount: totalLoops,
      isReversed: shouldBeReversed,
      shouldLoop: justCompletedLoop,
      shouldStop: false,
      newState: {
        ...state,
        loopCount: totalLoops,
        isReversed: shouldBeReversed,
        lastAnimationTime: animationTime
      }
    }
  }
  
  // ===== NORMAL LOOP MODE =====
  // Simply wrap time back to start
  const animationTime = timeInCurrentLoop
  
  return {
    animationTime,
    progress: animationTime / animation.duration,
    loopCount: totalLoops,
    isReversed: false,
    shouldLoop: justCompletedLoop,
    shouldStop: false,
    newState: {
      ...state,
      loopCount: totalLoops,
      isReversed: false,
      lastAnimationTime: animationTime
    }
  }
}

/**
 * Create initial timing state for a new animation
 */
export function createTimingState(startTime: number = Date.now()): AnimationTimingState {
  return {
    startTime,
    loopCount: 0,
    isReversed: false,
    isPaused: false,
    pausedTime: undefined,
    lastAnimationTime: undefined
  }
}

/**
 * Pause animation and store current time
 */
export function pauseTimingState(
  state: AnimationTimingState,
  currentTime: number
): AnimationTimingState {
  const elapsedTime = currentTime - state.startTime
  
  return {
    ...state,
    isPaused: true,
    pausedTime: elapsedTime
  }
}

/**
 * Resume animation from paused state
 */
export function resumeTimingState(
  state: AnimationTimingState,
  currentTime: number
): AnimationTimingState {
  if (!state.isPaused || state.pausedTime === undefined) {
    return state
  }
  
  // Calculate new startTime so elapsed time equals pausedTime
  const newStartTime = currentTime - state.pausedTime
  
  return {
    ...state,
    isPaused: false,
    startTime: newStartTime,
    pausedTime: undefined
  }
}

/**
 * Reset animation to start (for goToStart functionality)
 */
export function resetTimingState(currentTime: number = Date.now()): AnimationTimingState {
  return createTimingState(currentTime)
}

/**
 * Get human-readable debug info for timing state
 */
export function getTimingDebugInfo(
  animation: Animation,
  state: AnimationTimingState,
  currentTime: number
): string {
  const result = calculateAnimationTime(currentTime, animation, state)
  
  const lines = [
    `Animation: ${animation.name}`,
    `Duration: ${animation.duration}s`,
    `Loop: ${animation.loop ? (animation.pingPong ? 'Ping-Pong' : 'Normal') : 'None'}`,
    `---`,
    `Animation Time: ${result.animationTime.toFixed(2)}s`,
    `Progress: ${(result.progress * 100).toFixed(1)}%`,
    `Loop Count: ${result.loopCount}`,
    `Direction: ${result.isReversed ? 'Backward ⬅️' : 'Forward ➡️'}`,
    `Paused: ${state.isPaused ? 'Yes ⏸️' : 'No ▶️'}`,
  ]
  
  if (state.isPaused && state.pausedTime !== undefined) {
    lines.push(`Paused At: ${(state.pausedTime / 1000).toFixed(2)}s`)
  }
  
  return lines.join('\n')
}

/**
 * Validate animation timing configuration
 */
export function validateAnimation(animation: Animation): string[] {
  const errors: string[] = []
  
  if (animation.duration <= 0) {
    errors.push('Duration must be greater than 0')
  }
  
  if (animation.pingPong && !animation.loop) {
    errors.push('Ping-pong requires loop to be enabled')
  }
  
  return errors
}
