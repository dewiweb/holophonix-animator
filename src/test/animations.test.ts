import { describe, it, expect, beforeEach } from 'vitest'
import { modelRuntime } from '@/models/runtime'
import { Animation, AnimationType } from '@/types'

// Helper function to test animation calculations using model runtime
function testAnimation(
  type: AnimationType,
  params: any,
  time: number,
  duration: number = 10
) {
  const animation: Animation = {
    id: 'test',
    name: 'Test Animation',
    type,
    duration,
    loop: false,
    parameters: params,
    coordinateSystem: { type: 'xyz' }
  }
  return modelRuntime.calculatePosition(animation, time)
}

// ========================================
// BASIC ANIMATIONS TESTS
// ========================================

describe('Basic Animations', () => {
  describe('calculateLinearPosition', () => {
    it('should interpolate between start and end positions', () => {
      const params = {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 10, z: 10 }
      }
      
      const start = testAnimation('linear', params, 0, 10)
      expect(start).toEqual({ x: 0, y: 0, z: 0 })
      
      const mid = testAnimation('linear', params, 5, 10)
      expect(mid).toEqual({ x: 5, y: 5, z: 5 })
      
      const end = testAnimation('linear', params, 10, 10)
      expect(end).toEqual({ x: 10, y: 10, z: 10 })
    })

    it('should handle default parameters', () => {
      const result = testAnimation('linear', {}, 5, 10)
      expect(result).toBeDefined()
      expect(result.x).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateCircularPosition', () => {
    it('should create circular motion in XY plane', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        radius: 5,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      }
      
      const start = testAnimation('circular', params, 0, 10)
      expect(start.x).toBeCloseTo(5, 1)
      expect(start.y).toBeCloseTo(0, 1)
      expect(start.z).toBe(0)
      
      const quarter = testAnimation('circular', params, 2.5, 10)
      expect(quarter.x).toBeCloseTo(0, 1)
      expect(quarter.y).toBeCloseTo(5, 1)
    })

    it('should work in different planes', () => {
      const paramsXZ = {
        center: { x: 0, y: 0, z: 0 },
        radius: 3,
        startAngle: 0,
        endAngle: 360,
        plane: 'xz'
      }
      
      const result = testAnimation('circular', paramsXZ, 0, 10)
      expect(result.y).toBe(0)
      expect(result.x).toBeCloseTo(3, 1)
    })
  })

  describe('calculateEllipticalPosition', () => {
    it('should create elliptical motion', () => {
      const params = {
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        radiusX: 5,
        radiusY: 3,
        radiusZ: 1,
        plane: 'xy'
      }
      
      const start = testAnimation('elliptical', params, 0, 10)
      expect(start.x).toBeCloseTo(5, 1)
      expect(start.y).toBeCloseTo(0, 1)
    })
  })

  describe('calculateSpiralPosition', () => {
    it('should expand radius over time', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        startRadius: 1,
        endRadius: 5,
        rotations: 3,
        direction: 'clockwise',
        plane: 'xy'
      }
      
      const start = testAnimation('spiral', params, 0, 10)
      const end = testAnimation('spiral', params, 10, 10)
      
      const startDist = Math.sqrt(start.x ** 2 + start.y ** 2)
      const endDist = Math.sqrt(end.x ** 2 + end.y ** 2)
      
      expect(startDist).toBeCloseTo(1, 1)
      expect(endDist).toBeCloseTo(5, 1)
    })
  })

  describe('calculateRandomPosition', () => {
    it('should return positions within bounds', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        bounds: { x: 5, y: 5, z: 5 },
        speed: 1,
        smoothness: 0.5,
        updateFrequency: 2
      }
      
      for (let i = 0; i < 10; i++) {
        const result = testAnimation('random', params, i, 10)
        expect(Math.abs(result.x)).toBeLessThanOrEqual(10)
        expect(Math.abs(result.y)).toBeLessThanOrEqual(10)
        expect(Math.abs(result.z)).toBeLessThanOrEqual(10)
      }
    })
  })
})

// ========================================
// PHYSICS-BASED ANIMATIONS TESTS
// ========================================

describe('Physics Animations', () => {
  describe('calculatePendulumPosition', () => {
    it('should swing below anchor point', () => {
      const params = {
        anchorPoint: { x: 0, y: 5, z: 0 },
        pendulumLength: 3,
        initialAngle: 45,
        damping: 0.02,
        gravity: 9.81
      }
      
      const result = testAnimation('pendulum', params, 0.1, 10)
      expect(result.y).toBeLessThan(5) // Should be below anchor
    })
  })

  describe('calculateBouncePosition', () => {
    it('should start at initial height', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        startHeight: 10,
        groundLevel: 0,
        bounciness: 0.8,
        dampingPerBounce: 0.1,
        gravity: 9.81
      }
      
      const start = testAnimation('bounce', params, 0, 10)
      expect(start.y).toBeCloseTo(10, 0)
    })

    it('should never go below ground level', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        startHeight: 10,
        groundLevel: 0,
        bounciness: 0.8
      }
      
      for (let t = 0; t <= 10; t += 0.5) {
        const result = testAnimation('bounce', params, t, 10)
        expect(result.y).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('calculateSpringPosition', () => {
    it('should oscillate around rest position', () => {
      const params = {
        restPosition: { x: 0, y: 0, z: 0 },
        springStiffness: 10,
        dampingCoefficient: 0.5,
        initialDisplacement: { x: 5, y: 5, z: 0 },
        mass: 1
      }
      
      const start = testAnimation('spring', params, 0.5, 10)
      // Spring should have moved from initial position after 0.5 seconds
      expect(isFinite(start.x)).toBe(true)
      expect(isFinite(start.y)).toBe(true)
    })
  })
})

// ========================================
// WAVE-BASED ANIMATIONS TESTS
// ========================================

describe('Wave Animations', () => {
  describe('calculateWavePosition', () => {
    it('should oscillate with sine wave', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        amplitude: { x: 2, y: 2, z: 1 },
        frequency: 1,
        phaseOffset: 0,
        waveType: 'sine'
      }
      
      const result = testAnimation('wave', params, 0, 10)
      expect(result).toBeDefined()
    })

    it('should support different wave types', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        amplitude: { x: 2, y: 2, z: 1 },
        frequency: 1
      }

      const types = ['sine', 'square', 'triangle', 'sawtooth']
      types.forEach(waveType => {
        const result = testAnimation('wave', { ...params, waveType }, 1, 10)
        expect(result).toBeDefined()
      })
    })
  })

  describe('calculateLissajousPosition', () => {
    it('should create complex periodic patterns', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        frequencyRatioA: 3,
        frequencyRatioB: 2,
        phaseDifference: 90,
        amplitudeX: 3,
        amplitudeY: 3,
        amplitudeZ: 1
      }
      
      const result = testAnimation('lissajous', params, 1, 10)
      expect(result).toBeDefined()
    })
  })

  describe('calculateHelixPosition', () => {
    it('should move along axis while rotating', () => {
      const params = {
        axisStart: { x: 0, y: -5, z: 0 },
        axisEnd: { x: 0, y: 5, z: 0 },
        helixRadius: 2,
        helixRotations: 5,
        direction: 'clockwise'
      }
      
      const start = testAnimation('helix', params, 0, 10)
      const end = testAnimation('helix', params, 10, 10)
      
      expect(start.y).toBeCloseTo(-5, 1)
      expect(end.y).toBeCloseTo(5, 1)
    })
  })
})

// ========================================
// CURVE & PATH ANIMATIONS TESTS
// ========================================

describe('Curve Animations', () => {
  describe('calculateBezierPosition', () => {
    it('should interpolate through control points', () => {
      const params = {
        bezierStart: { x: -5, y: 0, z: 0 },
        bezierControl1: { x: -2, y: 5, z: 2 },
        bezierControl2: { x: 2, y: 5, z: -2 },
        bezierEnd: { x: 5, y: 0, z: 0 },
        easingFunction: 'linear'
      }
      
      const start = testAnimation('bezier', params, 0, 10)
      const end = testAnimation('bezier', params, 10, 10)
      
      expect(start.x).toBeCloseTo(-5, 1)
      expect(end.x).toBeCloseTo(5, 1)
    })

    it('should support easing functions', () => {
      const params = {
        bezierStart: { x: 0, y: 0, z: 0 },
        bezierEnd: { x: 10, y: 10, z: 0 }
      }

      const easings = ['linear', 'ease-in', 'ease-out', 'ease-in-out']
      easings.forEach(easingFunction => {
        const result = testAnimation('bezier', { ...params, easingFunction }, 5, 10)
        expect(result).toBeDefined()
      })
    })
  })

  describe('calculateCatmullRomPosition', () => {
    it('should interpolate through control points', () => {
      const params = {
        controlPoints: [
          { x: -5, y: 0, z: 0 },
          { x: -2, y: 3, z: 2 },
          { x: 2, y: 3, z: -2 },
          { x: 5, y: 0, z: 0 }
        ],
        tension: 0.5,
        closedLoop: false
      }
      
      const result = testAnimation('catmull-rom', params, 5, 10)
      expect(result).toBeDefined()
    })
  })

  describe('calculateZigzagPosition', () => {
    it('should create zigzag pattern', () => {
      const params = {
        zigzagStart: { x: -5, y: 0, z: 0 },
        zigzagEnd: { x: 5, y: 0, z: 0 },
        zigzagCount: 5,
        zigzagAmplitude: 2,
        zigzagPlane: 'xy'
      }
      
      const result = testAnimation('zigzag', params, 5, 10)
      expect(result).toBeDefined()
    })
  })
})

// ========================================
// PROCEDURAL ANIMATIONS TESTS
// ========================================

describe('Procedural Animations', () => {
  describe('calculatePerlinNoisePosition', () => {
    it('should generate smooth noise', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        bounds: { x: 5, y: 5, z: 5 },
        noiseFrequency: 1,
        noiseOctaves: 3,
        noisePersistence: 0.5,
        noiseScale: 1,
        noiseSeed: 12345
      }
      
      const result = testAnimation('perlin-noise', params, 1, 10)
      expect(result).toBeDefined()
    })

    it('should be reproducible with same seed', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        noiseSeed: 42
      }
      
      const result1 = testAnimation('perlin-noise', params, 1, 10)
      const result2 = testAnimation('perlin-noise', params, 1, 10)
      
      expect(result1.x).toBeCloseTo(result2.x, 5)
      expect(result1.y).toBeCloseTo(result2.y, 5)
      expect(result1.z).toBeCloseTo(result2.z, 5)
    })
  })

  describe('calculateRoseCurvePosition', () => {
    it('should create flower pattern', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        roseRadius: 3,
        petalCount: 5,
        roseRotation: 0,
        plane: 'xy'
      }
      
      const result = testAnimation('rose-curve', params, 1, 10)
      expect(result).toBeDefined()
    })
  })

  describe('calculateEpicycloidPosition', () => {
    it('should create epicycloid pattern', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        fixedCircleRadius: 3,
        rollingCircleRadius: 1,
        rollingSpeed: 1,
        rollingType: 'epicycloid',
        plane: 'xy'
      }
      
      const result = testAnimation('epicycloid', params, 1, 10)
      expect(result).toBeDefined()
    })

    it('should support hypocycloid type', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        fixedCircleRadius: 3,
        rollingCircleRadius: 1,
        rollingType: 'hypocycloid'
      }
      
      const result = testAnimation('epicycloid', params, 1, 10)
      expect(result).toBeDefined()
    })
  })
})

// ========================================
// INTERACTIVE ANIMATIONS TESTS
// ========================================

describe('Interactive Animations', () => {
  describe('calculateOrbitPosition', () => {
    it('should create orbital motion', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        orbitalRadius: 4,
        orbitalSpeed: 1,
        orbitalPhase: 0,
        inclination: 30
      }
      
      const result = testAnimation('orbit', params, 1, 10)
      expect(result).toBeDefined()
      
      const distance = Math.sqrt(result.x ** 2 + result.y ** 2 + result.z ** 2)
      expect(distance).toBeCloseTo(4, 0)
    })
  })

  describe('calculateFormationPosition', () => {
    it('should maintain formation', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        formationSpacing: 2,
        formationShape: 'line'
      }
      
      const result = testAnimation('formation', params, 1, 10)
      expect(result).toBeDefined()
    })
  })

  describe('calculateAttractRepelPosition', () => {
    it('should move towards target', () => {
      const params = {
        targetPosition: { x: 10, y: 10, z: 10 },
        attractionStrength: 5,
        repulsionRadius: 1,
        maxSpeed: 10,
        center: { x: 0, y: 0, z: 0 }
      }
      
      const result = testAnimation('attract-repel', params, 1, 10)
      expect(result).toBeDefined()
    })
  })
})

// ========================================
// SPATIAL AUDIO ANIMATIONS TESTS
// ========================================

describe('Spatial Audio Animations', () => {
  describe('calculateDopplerPosition', () => {
    it('should move along path', () => {
      const params = {
        pathStart: { x: -10, y: 0, z: 5 },
        pathEnd: { x: 10, y: 0, z: 5 },
        passBySpeed: 1
      }
      
      const start = testAnimation('doppler', params, 0, 10)
      const end = testAnimation('doppler', params, 10, 10)
      
      expect(start.x).toBeCloseTo(-10, 1)
      expect(end.x).toBeCloseTo(10, 1)
    })
  })

  describe('calculateCircularScanPosition', () => {
    it('should sweep in circle', () => {
      const params = {
        center: { x: 0, y: 0, z: 0 },
        scanRadius: 5,
        scanHeight: 0,
        sweepCount: 1,
        startAngleOffset: 0
      }
      
      const result = testAnimation('circular-scan', params, 1, 10)
      expect(result).toBeDefined()
      
      const distance = Math.sqrt(result.x ** 2 + result.z ** 2)
      expect(distance).toBeCloseTo(5, 1)
    })
  })

  describe('calculateZoomPosition', () => {
    it('should change distance over time', () => {
      const params = {
        zoomCenter: { x: 0, y: 0, z: 0 },
        startDistance: 10,
        endDistance: 1,
        accelerationCurve: 'linear'
      }
      
      const start = testAnimation('zoom', params, 0, 10)
      const end = testAnimation('zoom', params, 10, 10)
      
      const startDist = Math.sqrt(start.x ** 2 + start.z ** 2)
      const endDist = Math.sqrt(end.x ** 2 + end.z ** 2)
      
      expect(startDist).toBeGreaterThan(endDist)
    })
  })
})
