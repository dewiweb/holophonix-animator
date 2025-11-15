/**
 * Position Interpolation Utilities
 * 
 * Provides various interpolation strategies for smooth transitions
 * between positions in 3D space.
 */

import { Position } from '@/types'
import { InterpolationMode, EasingFunction } from '@/types/positionPreset'

// ========================================
// EASING FUNCTIONS
// ========================================

/**
 * Easing function implementations
 * Maps easing names to mathematical functions
 */
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  // Basic
  'linear': (t: number) => t,
  
  // Quadratic
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // Cubic
  'ease-in-cubic': (t: number) => t * t * t,
  'ease-out-cubic': (t: number) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t: number) => 
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  // Exponential
  'ease-in-expo': (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  'ease-out-expo': (t: number) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
  'ease-in-out-expo': (t: number) => {
    if (t === 0 || t === 1) return t
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
    return (2 - Math.pow(2, -20 * t + 10)) / 2
  },
  
  // Back (overshoots then settles)
  'ease-in-back': (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  'ease-out-back': (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  'ease-in-out-back': (t: number) => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  },
  
  // Elastic (bounces)
  'ease-in-elastic': (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  },
  'ease-out-elastic': (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  'ease-in-out-elastic': (t: number) => {
    const c5 = (2 * Math.PI) / 4.5
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  }
}

/**
 * Apply easing to a normalized time value (0-1)
 */
export function applyEasing(t: number, easing: EasingFunction): number {
  const fn = EASING_FUNCTIONS[easing]
  return fn ? fn(Math.max(0, Math.min(1, t))) : t
}

// ========================================
// INTERPOLATION STRATEGIES
// ========================================

/**
 * Cartesian (Linear) Interpolation
 * Simple linear interpolation in XYZ space
 */
export function interpolateCartesian(
  from: Position,
  to: Position,
  t: number
): Position {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t
  }
}

/**
 * Spherical Linear Interpolation (SLERP)
 * Interpolates along a great circle arc on a sphere
 * Maintains constant distance from origin
 */
export function interpolateSpherical(
  from: Position,
  to: Position,
  t: number
): Position {
  // Convert to spherical coordinates
  const fromSpherical = cartesianToSpherical(from)
  const toSpherical = cartesianToSpherical(to)
  
  // Interpolate angles
  const theta = fromSpherical.theta + shortestAngleDifference(
    fromSpherical.theta,
    toSpherical.theta
  ) * t
  
  const phi = fromSpherical.phi + shortestAngleDifference(
    fromSpherical.phi,
    toSpherical.phi
  ) * t
  
  // Interpolate radius
  const r = fromSpherical.r + (toSpherical.r - fromSpherical.r) * t
  
  // Convert back to cartesian
  return sphericalToCartesian({ r, theta, phi })
}

/**
 * Bezier Interpolation
 * Smooth curve with auto-generated control points
 */
export function interpolateBezier(
  from: Position,
  to: Position,
  t: number,
  controlPoints?: { cp1: Position; cp2: Position }
): Position {
  // Auto-generate control points if not provided
  const cp1 = controlPoints?.cp1 || generateBezierControlPoint(from, to, 0.33, 0.5)
  const cp2 = controlPoints?.cp2 || generateBezierControlPoint(from, to, 0.67, 0.5)
  
  // Cubic Bezier formula: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  
  return {
    x: mt3 * from.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * to.x,
    y: mt3 * from.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * to.y,
    z: mt3 * from.z + 3 * mt2 * t * cp1.z + 3 * mt * t2 * cp2.z + t3 * to.z
  }
}

/**
 * Circular Interpolation
 * Maintains constant distance from origin while interpolating angle
 */
export function interpolateCircular(
  from: Position,
  to: Position,
  t: number,
  center: Position = { x: 0, y: 0, z: 0 }
): Position {
  // Translate to origin
  const fromRel = subtract(from, center)
  const toRel = subtract(to, center)
  
  // Project onto XY plane for circular motion
  const fromAngle = Math.atan2(fromRel.y, fromRel.x)
  const toAngle = Math.atan2(toRel.y, toRel.x)
  
  // Interpolate angle (shortest path)
  const angle = fromAngle + shortestAngleDifference(fromAngle, toAngle) * t
  
  // Interpolate radius and Z
  const fromRadius = Math.sqrt(fromRel.x * fromRel.x + fromRel.y * fromRel.y)
  const toRadius = Math.sqrt(toRel.x * toRel.x + toRel.y * toRel.y)
  const radius = fromRadius + (toRadius - fromRadius) * t
  
  const z = fromRel.z + (toRel.z - fromRel.z) * t
  
  // Convert back and translate
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
    z: center.z + z
  }
}

/**
 * Generic interpolate function that dispatches to appropriate strategy
 */
export function interpolatePosition(
  from: Position,
  to: Position,
  t: number,
  mode: InterpolationMode = 'cartesian',
  options?: {
    center?: Position
    controlPoints?: { cp1: Position; cp2: Position }
  }
): Position {
  switch (mode) {
    case 'cartesian':
      return interpolateCartesian(from, to, t)
    
    case 'spherical':
      return interpolateSpherical(from, to, t)
    
    case 'bezier':
      return interpolateBezier(from, to, t, options?.controlPoints)
    
    case 'circular':
      return interpolateCircular(from, to, t, options?.center)
    
    case 'custom':
      // For custom interpolation, fall back to cartesian
      // User can override this in their implementation
      return interpolateCartesian(from, to, t)
    
    default:
      return interpolateCartesian(from, to, t)
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Convert cartesian to spherical coordinates
 */
function cartesianToSpherical(pos: Position): { r: number; theta: number; phi: number } {
  const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)
  const theta = Math.atan2(pos.y, pos.x)
  const phi = Math.acos(r > 0 ? pos.z / r : 0)
  
  return { r, theta, phi }
}

/**
 * Convert spherical to cartesian coordinates
 */
function sphericalToCartesian(spherical: { r: number; theta: number; phi: number }): Position {
  const { r, theta, phi } = spherical
  
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi)
  }
}

/**
 * Calculate shortest angle difference (handles wraparound)
 */
function shortestAngleDifference(from: number, to: number): number {
  const diff = to - from
  const twoPi = 2 * Math.PI
  
  if (diff > Math.PI) {
    return diff - twoPi
  } else if (diff < -Math.PI) {
    return diff + twoPi
  }
  
  return diff
}

/**
 * Generate Bezier control point
 */
function generateBezierControlPoint(
  from: Position,
  to: Position,
  position: number,  // 0-1 along the path
  height: number     // 0-1 perpendicular offset
): Position {
  // Linear position along path
  const base = interpolateCartesian(from, to, position)
  
  // Calculate perpendicular direction (simplified)
  const direction = normalize(subtract(to, from))
  const perpendicular = {
    x: -direction.y,
    y: direction.x,
    z: 0
  }
  
  // Offset by height
  const distance = Math.sqrt(
    Math.pow(to.x - from.x, 2) +
    Math.pow(to.y - from.y, 2) +
    Math.pow(to.z - from.z, 2)
  )
  
  const offset = height * distance * 0.5
  
  return {
    x: base.x + perpendicular.x * offset,
    y: base.y + perpendicular.y * offset,
    z: base.z + perpendicular.z * offset
  }
}

/**
 * Vector subtraction
 */
function subtract(a: Position, b: Position): Position {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  }
}

/**
 * Normalize vector
 */
function normalize(v: Position): Position {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  
  if (length === 0) {
    return { x: 0, y: 0, z: 0 }
  }
  
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length
  }
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(from: Position, to: Position): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calculate velocity (distance per second)
 */
export function calculateVelocity(from: Position, to: Position, duration: number): number {
  return duration > 0 ? calculateDistance(from, to) / duration : 0
}

/**
 * Clamp position to bounds
 */
export function clampPosition(
  position: Position,
  min: Position,
  max: Position
): Position {
  return {
    x: Math.max(min.x, Math.min(max.x, position.x)),
    y: Math.max(min.y, Math.min(max.y, position.y)),
    z: Math.max(min.z, Math.min(max.z, position.z))
  }
}

/**
 * Check if position is within bounds
 */
export function isWithinBounds(
  position: Position,
  min: Position,
  max: Position
): boolean {
  return (
    position.x >= min.x && position.x <= max.x &&
    position.y >= min.y && position.y <= max.y &&
    position.z >= min.z && position.z <= max.z
  )
}
