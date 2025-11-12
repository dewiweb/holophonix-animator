/**
 * Animation Timing Engine - Test Suite
 * 
 * Comprehensive tests for:
 * - Loop handling
 * - Ping-pong mode
 * - Pause/resume
 * - State management
 * - Edge cases
 */

import { describe, it, expect } from 'vitest'
import {
  calculateAnimationTime,
  createTimingState,
  pauseTimingState,
  resumeTimingState,
  resetTimingState,
  validateAnimation,
  type AnimationTimingState
} from './animationTiming'
import type { Animation } from '../types'

// Helper to create a minimal animation for testing
const createTestAnimation = (overrides: Partial<Animation> = {}): Animation => ({
  id: 'test-anim',
  name: 'Test Animation',
  type: 'linear',
  duration: 10, // 10 seconds
  loop: false,
  pingPong: false,
  parameters: {
    startPosition: { x: 0, y: 0, z: 0 },
    endPosition: { x: 10, y: 0, z: 0 }
  },
  coordinateSystem: {
    type: 'xyz'
  },
  transform: {
    mode: 'absolute',
    tracks: {}
  },
  ...overrides
})

describe('Animation Timing Engine', () => {
  describe('createTimingState', () => {
    it('should create initial timing state with default values', () => {
      const state = createTimingState(1000)
      
      expect(state.startTime).toBe(1000)
      expect(state.loopCount).toBe(0)
      expect(state.isReversed).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.pausedTime).toBeUndefined()
    })
  })

  describe('Non-looping animations', () => {
    it('should calculate time correctly for non-looping animation', () => {
      const animation = createTestAnimation({ loop: false, duration: 10 })
      const state = createTimingState(0)
      
      // At 5 seconds
      const result = calculateAnimationTime(5000, animation, state)
      
      expect(result.animationTime).toBe(5)
      expect(result.progress).toBe(0.5)
      expect(result.loopCount).toBe(0)
      expect(result.isReversed).toBe(false)
      expect(result.shouldLoop).toBe(false)
      expect(result.shouldStop).toBe(false)
    })

    it('should clamp time at duration', () => {
      const animation = createTestAnimation({ loop: false, duration: 10 })
      const state = createTimingState(0)
      
      // At 15 seconds (past duration)
      const result = calculateAnimationTime(15000, animation, state)
      
      expect(result.animationTime).toBe(10)
      expect(result.progress).toBe(1)
      expect(result.shouldStop).toBe(true)
    })

    it('should signal stop at duration', () => {
      const animation = createTestAnimation({ loop: false, duration: 10 })
      const state = createTimingState(0)
      
      // Exactly at duration
      const result = calculateAnimationTime(10000, animation, state)
      
      expect(result.animationTime).toBe(10)
      expect(result.shouldStop).toBe(true)
    })
  })

  describe('Normal loop (no ping-pong)', () => {
    it('should wrap time at duration', () => {
      const animation = createTestAnimation({ loop: true, pingPong: false, duration: 10 })
      const state = createTimingState(0)
      
      // At 12 seconds (1.2 loops)
      const result = calculateAnimationTime(12000, animation, state)
      
      expect(result.animationTime).toBe(2)
      expect(result.progress).toBe(0.2)
      expect(result.loopCount).toBe(1)
      expect(result.isReversed).toBe(false)
    })

    it('should signal loop completion', () => {
      const animation = createTestAnimation({ loop: true, pingPong: false, duration: 10 })
      const state = createTimingState(0)
      
      // First call at 10s
      const result1 = calculateAnimationTime(10000, animation, state)
      expect(result1.shouldLoop).toBe(true)
      expect(result1.loopCount).toBe(1)
      
      // Second call at 20s (after updating state)
      const result2 = calculateAnimationTime(20000, animation, result1.newState)
      expect(result2.shouldLoop).toBe(true)
      expect(result2.loopCount).toBe(2)
    })

    it('should never reverse in normal loop', () => {
      const animation = createTestAnimation({ loop: true, pingPong: false, duration: 10 })
      const state = createTimingState(0)
      
      // Test multiple loops
      for (let time = 0; time <= 50000; time += 5000) {
        const result = calculateAnimationTime(time, animation, state)
        expect(result.isReversed).toBe(false)
      }
    })
  })

  describe('Ping-pong loop', () => {
    it('should play forward on first loop (loop 0)', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // At 5 seconds (middle of first loop)
      const result = calculateAnimationTime(5000, animation, state)
      
      expect(result.animationTime).toBe(5)
      expect(result.loopCount).toBe(0)
      expect(result.isReversed).toBe(false)
    })

    it('should play backward on second loop (loop 1)', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // At 15 seconds (middle of second loop)
      const result = calculateAnimationTime(15000, animation, state)
      
      expect(result.animationTime).toBe(5) // 10 - 5 = 5
      expect(result.loopCount).toBe(1)
      expect(result.isReversed).toBe(true)
    })

    it('should play forward on third loop (loop 2)', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // At 25 seconds (middle of third loop)
      const result = calculateAnimationTime(25000, animation, state)
      
      expect(result.animationTime).toBe(5)
      expect(result.loopCount).toBe(2)
      expect(result.isReversed).toBe(false)
    })

    it('should count down during backward loops', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // Test backward loop timing
      const testCases = [
        { elapsed: 10000, expected: 10 },  // Start of backward
        { elapsed: 11000, expected: 9 },
        { elapsed: 15000, expected: 5 },
        { elapsed: 19000, expected: 1 },
        { elapsed: 20000, expected: 0 },   // End of backward
      ]
      
      testCases.forEach(({ elapsed, expected }) => {
        const result = calculateAnimationTime(elapsed, animation, state)
        expect(result.animationTime).toBeCloseTo(expected, 5)
      })
    })

    it('should alternate direction every loop', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      const testCases = [
        { time: 5000, loopCount: 0, isReversed: false },   // Loop 0: forward
        { time: 15000, loopCount: 1, isReversed: true },   // Loop 1: backward
        { time: 25000, loopCount: 2, isReversed: false },  // Loop 2: forward
        { time: 35000, loopCount: 3, isReversed: true },   // Loop 3: backward
        { time: 45000, loopCount: 4, isReversed: false },  // Loop 4: forward
      ]
      
      testCases.forEach(({ time, loopCount, isReversed }) => {
        const result = calculateAnimationTime(time, animation, state)
        expect(result.loopCount).toBe(loopCount)
        expect(result.isReversed).toBe(isReversed)
      })
    })

    it('should signal loop at direction change', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // At 10s - end of forward, start of backward
      const result1 = calculateAnimationTime(10000, animation, state)
      expect(result1.shouldLoop).toBe(true)
      
      // At 20s - end of backward, start of forward
      const result2 = calculateAnimationTime(20000, animation, state)
      expect(result2.shouldLoop).toBe(true)
    })
  })

  describe('Pause and Resume', () => {
    it('should pause at current time', () => {
      const animation = createTestAnimation({ loop: true, duration: 10 })
      let state = createTimingState(0)
      
      // Play for 3 seconds
      const result1 = calculateAnimationTime(3000, animation, state)
      expect(result1.animationTime).toBe(3)
      
      // Pause
      state = pauseTimingState(state, 3000)
      expect(state.isPaused).toBe(true)
      expect(state.pausedTime).toBe(3000)
      
      // Time passes while paused (5 seconds later)
      const result2 = calculateAnimationTime(8000, animation, state)
      expect(result2.animationTime).toBe(3) // Still at pause point
    })

    it('should resume from paused position', () => {
      const animation = createTestAnimation({ loop: true, duration: 10 })
      let state = createTimingState(0)
      
      // Play for 3 seconds, then pause
      state = pauseTimingState(state, 3000)
      
      // Resume 5 seconds later (at timestamp 8000)
      state = resumeTimingState(state, 8000)
      
      expect(state.isPaused).toBe(false)
      expect(state.pausedTime).toBeUndefined()
      // startTime should be 5000 (so elapsed at 8000 = 3000)
      expect(state.startTime).toBe(5000)
      
      // Verify animation continues from 3s
      const result = calculateAnimationTime(8000, animation, state)
      expect(result.animationTime).toBe(3)
      
      // 2 seconds later (at timestamp 10000)
      const result2 = calculateAnimationTime(10000, animation, state)
      expect(result2.animationTime).toBe(5)
    })

    it('should handle pause during backward ping-pong', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      let state = createTimingState(0)
      
      // Play into backward loop (15s = middle of backward)
      state = pauseTimingState(state, 15000)
      
      const result1 = calculateAnimationTime(15000, animation, state)
      expect(result1.isReversed).toBe(true)
      expect(result1.animationTime).toBe(5)
      
      // Resume and verify still backward
      state = resumeTimingState(state, 20000)
      const result2 = calculateAnimationTime(20000, animation, state)
      expect(result2.animationTime).toBe(5) // Same position
      
      // Continue backward
      const result3 = calculateAnimationTime(22000, animation, state)
      expect(result3.animationTime).toBe(3)
      expect(result3.isReversed).toBe(true)
    })
  })

  describe('resetTimingState', () => {
    it('should create fresh state at current time', () => {
      const state = resetTimingState(5000)
      
      expect(state.startTime).toBe(5000)
      expect(state.loopCount).toBe(0)
      expect(state.isReversed).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.pausedTime).toBeUndefined()
    })

    it('should restart animation from beginning', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      
      // Play to middle of backward loop
      let state = createTimingState(0)
      let result = calculateAnimationTime(15000, animation, state)
      expect(result.loopCount).toBe(1)
      expect(result.isReversed).toBe(true)
      
      // Reset
      state = resetTimingState(15000)
      result = calculateAnimationTime(15000, animation, state)
      
      expect(result.animationTime).toBe(0)
      expect(result.loopCount).toBe(0)
      expect(result.isReversed).toBe(false)
    })
  })

  describe('validateAnimation', () => {
    it('should pass valid animation', () => {
      const animation = createTestAnimation({ loop: true, duration: 10 })
      const errors = validateAnimation(animation)
      expect(errors).toHaveLength(0)
    })

    it('should reject zero duration', () => {
      const animation = createTestAnimation({ duration: 0 })
      const errors = validateAnimation(animation)
      expect(errors).toContain('Duration must be greater than 0')
    })

    it('should reject negative duration', () => {
      const animation = createTestAnimation({ duration: -5 })
      const errors = validateAnimation(animation)
      expect(errors).toContain('Duration must be greater than 0')
    })

    it('should reject ping-pong without loop', () => {
      const animation = createTestAnimation({ loop: false, pingPong: true })
      const errors = validateAnimation(animation)
      expect(errors).toContain('Ping-pong requires loop to be enabled')
    })
  })

  describe('Edge cases', () => {
    it('should handle very small durations', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 0.1 })
      const state = createTimingState(0)
      
      const result = calculateAnimationTime(150, animation, state) // 0.15s
      expect(result.loopCount).toBe(1)
      expect(result.isReversed).toBe(true)
    })

    it('should handle very large time values', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // 1000 seconds = 100 loops
      const result = calculateAnimationTime(1000000, animation, state)
      expect(result.loopCount).toBe(100)
      expect(result.isReversed).toBe(false) // Even loop number
    })

    it('should handle fractional time values', () => {
      const animation = createTestAnimation({ loop: true, duration: 10 })
      const state = createTimingState(0)
      
      const result = calculateAnimationTime(3456, animation, state) // 3.456s
      expect(result.animationTime).toBeCloseTo(3.456, 2)
    })

    it('should handle time exactly at loop boundary', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      const state = createTimingState(0)
      
      // Exactly at 10s (loop boundary)
      const result = calculateAnimationTime(10000, animation, state)
      expect(result.animationTime).toBe(10)
      expect(result.shouldLoop).toBe(true)
    })

    it('should maintain precision across multiple loops', () => {
      const animation = createTestAnimation({ loop: true, pingPong: false, duration: 10 })
      const state = createTimingState(0)
      
      // After many loops, time should still be accurate
      const result = calculateAnimationTime(100000, animation, state)
      expect(result.animationTime).toBe(0) // 100s / 10s = 10 complete loops
      expect(result.loopCount).toBe(10)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle typical ping-pong playback sequence', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      let state = createTimingState(0)
      
      // Timeline of events
      const events = [
        { time: 0, action: 'start', expectedTime: 0, expectedReversed: false },
        { time: 5000, action: 'playing', expectedTime: 5, expectedReversed: false },
        { time: 6000, action: 'pause', expectedTime: 6, expectedReversed: false },
        { time: 11000, action: 'resume', expectedTime: 6, expectedReversed: false },
        { time: 15000, action: 'playing', expectedTime: 10, expectedReversed: false },
        { time: 20000, action: 'playing', expectedTime: 5, expectedReversed: true },
        { time: 25000, action: 'reset', expectedTime: 0, expectedReversed: false },
      ]
      
      events.forEach(({ time, action, expectedTime, expectedReversed }) => {
        if (action === 'pause') {
          state = pauseTimingState(state, time)
        } else if (action === 'resume') {
          state = resumeTimingState(state, time)
        } else if (action === 'reset') {
          state = resetTimingState(time)
        }
        
        const result = calculateAnimationTime(time, animation, state)
        expect(result.animationTime).toBeCloseTo(expectedTime, 1)
        expect(result.isReversed).toBe(expectedReversed)
      })
    })

    it('should handle pause during loop transition', () => {
      const animation = createTestAnimation({ loop: true, pingPong: true, duration: 10 })
      let state = createTimingState(0)
      
      // Pause exactly at loop boundary
      state = pauseTimingState(state, 10000)
      const result1 = calculateAnimationTime(10000, animation, state)
      expect(result1.animationTime).toBe(10)
      
      // Resume - should start backward loop
      state = resumeTimingState(state, 15000)
      const result2 = calculateAnimationTime(16000, animation, state)
      expect(result2.isReversed).toBe(true)
    })
  })
})
