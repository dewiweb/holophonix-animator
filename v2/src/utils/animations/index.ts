import { Animation, Position } from '@/types'

// Import all calculation functions
import {
  calculateLinearPosition,
  calculateCircularPosition,
  calculateEllipticalPosition,
  calculateSpiralPosition,
  calculateRandomPosition
} from './basicAnimations'

import {
  calculatePendulumPosition,
  calculateBouncePosition,
  calculateSpringPosition
} from './physicsAnimations'

import {
  calculateWavePosition,
  calculateLissajousPosition,
  calculateHelixPosition
} from './waveAnimations'

import {
  calculateBezierPosition,
  calculateCatmullRomPosition,
  calculateZigzagPosition
} from './curveAnimations'

import {
  calculatePerlinNoisePosition,
  calculateRoseCurvePosition,
  calculateEpicycloidPosition
} from './proceduralAnimations'

import {
  calculateOrbitPosition,
  calculateFormationPosition,
  calculateAttractRepelPosition
} from './interactiveAnimations'

import {
  calculateDopplerPosition,
  calculateCircularScanPosition,
  calculateZoomPosition
} from './spatialAnimations'

import {
  calculateCustomPosition
} from './keyframeAnimations'

// ========================================
// RE-EXPORT ALL ANIMATION CALCULATIONS
// ========================================

export {
  calculateLinearPosition,
  calculateCircularPosition,
  calculateEllipticalPosition,
  calculateSpiralPosition,
  calculateRandomPosition,
  calculatePendulumPosition,
  calculateBouncePosition,
  calculateSpringPosition,
  calculateWavePosition,
  calculateLissajousPosition,
  calculateHelixPosition,
  calculateBezierPosition,
  calculateCatmullRomPosition,
  calculateZigzagPosition,
  calculatePerlinNoisePosition,
  calculateRoseCurvePosition,
  calculateEpicycloidPosition,
  calculateOrbitPosition,
  calculateFormationPosition,
  calculateAttractRepelPosition,
  calculateDopplerPosition,
  calculateCircularScanPosition,
  calculateZoomPosition,
  calculateCustomPosition
}

// ========================================
// MAIN ANIMATION POSITION CALCULATOR
// ========================================

/**
 * Main entry point for calculating animation positions
 * Routes to appropriate calculation function based on animation type
 * @param context 'playback' for real-time animation, 'preview' for 3D path preview
 */
export function calculatePosition(animation: Animation, time: number, loopCount: number = 0, context: string = 'playback'): Position {
  const { type, parameters, duration } = animation
  
  // Time is already processed by animationStore for loop/ping-pong per-track
  // Just clamp to valid range to be safe
  const effectiveTime = duration > 0 ? Math.max(0, Math.min(time, duration)) : time
  
  switch (type) {
    // Basic animations
    case 'linear':
      return calculateLinearPosition(parameters, effectiveTime, duration)
    case 'circular':
      return calculateCircularPosition(parameters, effectiveTime, duration)
    case 'elliptical':
      return calculateEllipticalPosition(parameters, effectiveTime, duration)
    case 'spiral':
      return calculateSpiralPosition(parameters, effectiveTime, duration)
    case 'random':
      return calculateRandomPosition(parameters, effectiveTime, duration)
    case 'custom':
      return calculateCustomPosition(parameters, effectiveTime, duration, loopCount)
    
    // Physics-based animations
    case 'pendulum':
      return calculatePendulumPosition(parameters, time, duration, context)
    case 'bounce':
      return calculateBouncePosition(parameters, time, duration)
    case 'spring':
      return calculateSpringPosition(parameters, time, duration, context)
    
    // Wave-based animations
    case 'wave':
      return calculateWavePosition(parameters, effectiveTime, duration)
    case 'lissajous':
      return calculateLissajousPosition(parameters, effectiveTime, duration)
    case 'helix':
      return calculateHelixPosition(parameters, effectiveTime, duration)
    
    // Curve & path-based animations
    case 'bezier':
      return calculateBezierPosition(parameters, effectiveTime, duration)
    case 'catmull-rom':
      return calculateCatmullRomPosition(parameters, effectiveTime, duration)
    case 'zigzag':
      return calculateZigzagPosition(parameters, effectiveTime, duration)
    
    // Advanced procedural animations
    case 'perlin-noise':
      return calculatePerlinNoisePosition(parameters, time, duration)
    case 'rose-curve':
      return calculateRoseCurvePosition(parameters, effectiveTime, duration)
    case 'epicycloid':
      return calculateEpicycloidPosition(parameters, effectiveTime, duration)
    
    // Multi-object & interactive animations
    case 'orbit':
      return calculateOrbitPosition(parameters, effectiveTime, duration)
    case 'formation':
      return calculateFormationPosition(parameters, effectiveTime, duration)
    case 'attract-repel':
      return calculateAttractRepelPosition(parameters, time, duration)
    
    // Specialized spatial audio animations
    case 'doppler':
      return calculateDopplerPosition(parameters, effectiveTime, duration)
    case 'circular-scan':
      return calculateCircularScanPosition(parameters, effectiveTime, duration)
    case 'zoom':
      return calculateZoomPosition(parameters, effectiveTime, duration)
    
    default:
      return { x: 0, y: 0, z: 0 }
  }
}
