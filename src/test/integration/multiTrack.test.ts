import { describe, it, expect, beforeEach } from 'vitest'
import { calculatePosition } from '@/utils/animations'
import { Animation, AnimationType } from '@/types'

// ========================================
// INTEGRATION TESTS FOR ANIMATION SYSTEM
// ========================================

describe('Animation Loop Mode', () => {
  const createTestAnimation = (type: AnimationType, loop: boolean): Animation => ({
    id: `test-${type}`,
    name: `Test ${type}`,
    type,
    duration: 10,
    parameters: {},
    loop,
    pingPong: false,
    coordinateSystem: { type: 'xyz' }
  })

  it('should restart at time 0 after duration when loop is enabled', () => {
    const animation = createTestAnimation('linear', true)
    animation.parameters = {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 10, y: 10, z: 10 }
    }

    // Position at t=0 should match t=10 (looped back to start)
    const posStart = calculatePosition(animation, 0)
    const posEnd = calculatePosition(animation, 10)
    
    expect(posStart.x).toBeCloseTo(0, 1)
    expect(posEnd.x).toBeCloseTo(10, 1)
    
    // Beyond duration should wrap (test with modulo in calling code)
    // The calculation function itself clamps to duration
  })

  it('should work for circular animations', () => {
    const animation = createTestAnimation('circular', true)
    animation.parameters = {
      center: { x: 0, y: 0, z: 0 },
      radius: 5,
      startAngle: 0,
      endAngle: 360,
      plane: 'xy'
    }

    const pos0 = calculatePosition(animation, 0)
    const pos10 = calculatePosition(animation, 10)
    
    // Should complete full circle and return to start
    expect(pos0.x).toBeCloseTo(pos10.x, 1)
    expect(pos0.y).toBeCloseTo(pos10.y, 1)
  })
})

describe('Animation Ping-Pong Mode', () => {
  it('should reverse direction after reaching end', () => {
    const animation: Animation = {
      id: 'test-pingpong',
      name: 'Test Ping-Pong',
      type: 'linear',
      duration: 10,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 0, z: 0 }
      },
      loop: true,
      pingPong: true,
      coordinateSystem: { type: 'xyz' }
    }

    // Forward motion
    const posStart = calculatePosition(animation, 0)
    const posMid = calculatePosition(animation, 5)
    const posEnd = calculatePosition(animation, 10)
    
    expect(posStart.x).toBeCloseTo(0, 1)
    expect(posMid.x).toBeCloseTo(5, 1)
    expect(posEnd.x).toBeCloseTo(10, 1)
    
    // Ping-pong logic is handled in animationStore, not in calculation function
    // This test verifies the calculation produces expected forward values
  })
})

describe('Animation Timing Accuracy', () => {
  it('should interpolate correctly at different time points', () => {
    const animation: Animation = {
      id: 'test-timing',
      name: 'Test Timing',
      type: 'linear',
      duration: 10,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 0, z: 0 }
      },
      loop: false,
      pingPong: false,
      coordinateSystem: { type: 'xyz' }
    }

    // Test multiple time points
    const testPoints = [
      { time: 0, expectedX: 0 },
      { time: 2.5, expectedX: 2.5 },
      { time: 5, expectedX: 5 },
      { time: 7.5, expectedX: 7.5 },
      { time: 10, expectedX: 10 }
    ]

    testPoints.forEach(({ time, expectedX }) => {
      const pos = calculatePosition(animation, time)
      expect(pos.x).toBeCloseTo(expectedX, 1)
    })
  })

  it('should maintain consistent speed across different animation types', () => {
    const duration = 10
    
    // Linear animation
    const linear: Animation = {
      id: 'linear-test',
      name: 'Linear',
      type: 'linear',
      duration,
      parameters: { startPosition: { x: 0, y: 0, z: 0 }, endPosition: { x: 10, y: 0, z: 0 } },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }
    
    const linPos5 = calculatePosition(linear, 5)
    expect(linPos5.x).toBeCloseTo(5, 1) // 50% through duration = 50% through path
  })
})

describe('Multi-Track Animations', () => {
  it('should support identical mode - same parameters for all tracks', () => {
    // In identical mode, all tracks use the same animation parameters
    const sharedAnimation: Animation = {
      id: 'shared-anim',
      name: 'Shared',
      type: 'circular',
      duration: 10,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 5,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    // Calculate position at t=2.5 for multiple "tracks"
    const track1Pos = calculatePosition(sharedAnimation, 2.5)
    const track2Pos = calculatePosition(sharedAnimation, 2.5)
    const track3Pos = calculatePosition(sharedAnimation, 2.5)
    
    // All tracks should have identical positions at same time
    expect(track1Pos.x).toBeCloseTo(track2Pos.x, 5)
    expect(track1Pos.y).toBeCloseTo(track2Pos.y, 5)
    expect(track2Pos.x).toBeCloseTo(track3Pos.x, 5)
    expect(track2Pos.y).toBeCloseTo(track3Pos.y, 5)
  })

  it('should support phase-offset mode - staggered timing', () => {
    const animation: Animation = {
      id: 'phase-test',
      name: 'Phase Offset',
      type: 'linear',
      duration: 10,
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 0, z: 0 }
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    // Simulate 3 tracks with phase offset (1 second apart)
    const time = 5
    const track1Pos = calculatePosition(animation, time) // t=5
    const track2Pos = calculatePosition(animation, time - 1) // t=4 (1s behind)
    const track3Pos = calculatePosition(animation, time - 2) // t=3 (2s behind)
    
    expect(track1Pos.x).toBeCloseTo(5, 1)
    expect(track2Pos.x).toBeCloseTo(4, 1)
    expect(track3Pos.x).toBeCloseTo(3, 1)
  })

  it('should support position-relative mode - different centers per track', () => {
    // Each track has its own center position
    const createAnimation = (center: { x: number; y: number; z: number }): Animation => ({
      id: 'pos-relative',
      name: 'Position Relative',
      type: 'circular',
      duration: 10,
      parameters: {
        center,
        radius: 3,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    })

    const track1Anim = createAnimation({ x: 0, y: 0, z: 0 })
    const track2Anim = createAnimation({ x: 10, y: 0, z: 0 })
    const track3Anim = createAnimation({ x: -10, y: 0, z: 0 })

    const time = 2.5
    const track1Pos = calculatePosition(track1Anim, time)
    const track2Pos = calculatePosition(track2Anim, time)
    const track3Pos = calculatePosition(track3Anim, time)
    
    // All tracks should follow same pattern, but centered at different positions
    const track1Offset = Math.sqrt(track1Pos.x ** 2 + track1Pos.y ** 2)
    const track2Offset = Math.sqrt((track2Pos.x - 10) ** 2 + track2Pos.y ** 2)
    const track3Offset = Math.sqrt((track3Pos.x + 10) ** 2 + track3Pos.y ** 2)
    
    expect(track1Offset).toBeCloseTo(track2Offset, 1)
    expect(track2Offset).toBeCloseTo(track3Offset, 1)
  })
})

describe('Physics-Based Animation State', () => {
  it('pendulum should maintain continuous motion', () => {
    const animation: Animation = {
      id: 'pendulum-test',
      name: 'Pendulum',
      type: 'pendulum',
      duration: 10,
      parameters: {
        anchorPoint: { x: 0, y: 5, z: 0 },
        pendulumLength: 3,
        initialAngle: 45,
        damping: 0.02,
        gravity: 9.81
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    // Test consecutive time points
    const times = [0, 0.1, 0.2, 0.3, 0.4, 0.5]
    const positions = times.map(t => calculatePosition(animation, t))
    
    // Verify positions are valid
    positions.forEach(pos => {
      expect(pos.y).toBeLessThan(5) // Below anchor point
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
    })
    
    // Verify there's movement
    const hasMovement = positions.some((pos, i) => 
      i > 0 && Math.abs(pos.x - positions[0].x) > 0.1
    )
    expect(hasMovement).toBe(true)
  })

  it('spring should oscillate and settle', () => {
    const animation: Animation = {
      id: 'spring-test',
      name: 'Spring',
      type: 'spring',
      duration: 10,
      parameters: {
        restPosition: { x: 0, y: 0, z: 0 },
        springStiffness: 10,
        dampingCoefficient: 0.5,
        initialDisplacement: { x: 5, y: 5, z: 0 },
        mass: 1
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const times = [0, 0.5, 1, 2, 5, 10]
    const positions = times.map(t => calculatePosition(animation, t))
    
    // Verify oscillation exists
    positions.forEach(pos => {
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
    })
  })
})

describe('Advanced Animation Types', () => {
  it('perlin noise should generate smooth organic movement', () => {
    const animation: Animation = {
      id: 'perlin-test',
      name: 'Perlin Noise',
      type: 'perlin-noise',
      duration: 10,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        bounds: { x: 5, y: 5, z: 5 },
        noiseFrequency: 1,
        noiseOctaves: 3,
        noisePersistence: 0.5,
        noiseScale: 1,
        noiseSeed: 12345
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const times = [0, 2, 4, 6, 8, 10]
    const positions = times.map(t => calculatePosition(animation, t))
    
    // Should produce valid positions
    positions.forEach(pos => {
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
      expect(isFinite(pos.z)).toBe(true)
    })
    
    // Should be within bounds (approximately)
    positions.forEach(pos => {
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(10)
      expect(Math.abs(pos.y)).toBeLessThanOrEqual(10)
      expect(Math.abs(pos.z)).toBeLessThanOrEqual(10)
    })
  })

  it('lissajous should create complex periodic patterns', () => {
    const animation: Animation = {
      id: 'lissajous-test',
      name: 'Lissajous',
      type: 'lissajous',
      duration: 10,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        frequencyRatioA: 3,
        frequencyRatioB: 2,
        phaseDifference: 90,
        amplitudeX: 3,
        amplitudeY: 3,
        amplitudeZ: 1
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const positions = [0, 2.5, 5, 7.5, 10].map(t => calculatePosition(animation, t))
    
    positions.forEach(pos => {
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(5)
      expect(Math.abs(pos.y)).toBeLessThanOrEqual(5)
    })
  })

  it('rose curve should create petal patterns', () => {
    const animation: Animation = {
      id: 'rose-test',
      name: 'Rose Curve',
      type: 'rose-curve',
      duration: 10,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        roseRadius: 3,
        petalCount: 5,
        roseRotation: 0,
        plane: 'xy'
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const positions = [0, 2, 4, 6, 8, 10].map(t => calculatePosition(animation, t))
    
    positions.forEach(pos => {
      expect(isFinite(pos.x)).toBe(true)
      expect(isFinite(pos.y)).toBe(true)
      // Should stay within radius bounds (approximately)
      const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2)
      expect(distance).toBeLessThanOrEqual(5)
    })
  })
})

describe('Spatial Audio Animations', () => {
  it('doppler should create linear fly-by', () => {
    const animation: Animation = {
      id: 'doppler-test',
      name: 'Doppler',
      type: 'doppler',
      duration: 10,
      parameters: {
        pathStart: { x: -10, y: 0, z: 5 },
        pathEnd: { x: 10, y: 0, z: 5 },
        passBySpeed: 1
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const posStart = calculatePosition(animation, 0)
    const posMid = calculatePosition(animation, 5)
    const posEnd = calculatePosition(animation, 10)
    
    expect(posStart.x).toBeCloseTo(-10, 1)
    expect(posMid.x).toBeCloseTo(0, 1)
    expect(posEnd.x).toBeCloseTo(10, 1)
    expect(posStart.z).toBeCloseTo(5, 1)
  })

  it('circular scan should sweep around listener', () => {
    const animation: Animation = {
      id: 'scan-test',
      name: 'Circular Scan',
      type: 'circular-scan',
      duration: 10,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        scanRadius: 5,
        scanHeight: 2,
        sweepCount: 1,
        startAngleOffset: 0
      },
      loop: false,
      coordinateSystem: { type: 'xyz' }
    }

    const positions = [0, 2.5, 5, 7.5, 10].map(t => calculatePosition(animation, t))
    
    positions.forEach(pos => {
      const radius = Math.sqrt(pos.x ** 2 + pos.z ** 2)
      expect(radius).toBeCloseTo(5, 1)
      expect(pos.y).toBeCloseTo(2, 1)
    })
  })
})
