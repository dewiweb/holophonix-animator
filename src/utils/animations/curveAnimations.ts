import { Position } from '@/types'

// ========================================
// CURVE & PATH-BASED ANIMATIONS
// ========================================

export function calculateBezierPosition(params: any, time: number, duration: number): Position {
  const start = params?.bezierStart || { x: -5, y: 0, z: 0 }
  const control1 = params?.bezierControl1 || { x: -2, y: 5, z: 2 }
  const control2 = params?.bezierControl2 || { x: 2, y: 5, z: -2 }
  const end = params?.bezierEnd || { x: 5, y: 0, z: 0 }
  const easing = params?.easingFunction || 'linear'
  
  let t = time / duration
  
  // Apply easing
  switch (easing) {
    case 'ease-in':
      t = t * t
      break
    case 'ease-out':
      t = t * (2 - t)
      break
    case 'ease-in-out':
      t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      break
  }
  
  // Cubic Bézier formula
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t
  
  return {
    x: mt3 * start.x + 3 * mt2 * t * control1.x + 3 * mt * t2 * control2.x + t3 * end.x,
    y: mt3 * start.y + 3 * mt2 * t * control1.y + 3 * mt * t2 * control2.y + t3 * end.y,
    z: mt3 * start.z + 3 * mt2 * t * control1.z + 3 * mt * t2 * control2.z + t3 * end.z
  }
}

export function calculateCatmullRomPosition(params: any, time: number, duration: number): Position {
  const points = params?.controlPoints || [
    { x: -5, y: 0, z: 0 },
    { x: -2, y: 3, z: 2 },
    { x: 2, y: 3, z: -2 },
    { x: 5, y: 0, z: 0 }
  ]
  const tension = Number(params?.tension) || 0.5
  const closedLoop = params?.closedLoop || false
  
  if (points.length < 2) return points[0] || { x: 0, y: 0, z: 0 }
  
  const t = (time / duration) * (closedLoop ? points.length : points.length - 1)
  const segment = Math.floor(t)
  const local_t = t - segment
  
  const getPoint = (index: number) => {
    if (closedLoop) {
      return points[((index % points.length) + points.length) % points.length]
    }
    return points[Math.max(0, Math.min(points.length - 1, index))]
  }
  
  const p0 = getPoint(segment - 1)
  const p1 = getPoint(segment)
  const p2 = getPoint(segment + 1)
  const p3 = getPoint(segment + 2)
  
  const t2 = local_t * local_t
  const t3 = t2 * local_t
  
  const interpolate = (v0: number, v1: number, v2: number, v3: number) => {
    return tension * (
      v1 +
      (-v0 + v2) * local_t +
      (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 +
      (-v0 + 3 * v1 - 3 * v2 + v3) * t3
    ) + (1 - tension) * (v1 + (v2 - v1) * local_t)
  }
  
  return {
    x: interpolate(p0.x, p1.x, p2.x, p3.x),
    y: interpolate(p0.y, p1.y, p2.y, p3.y),
    z: interpolate(p0.z, p1.z, p2.z, p3.z)
  }
}

export function calculateZigzagPosition(params: any, time: number, duration: number): Position {
  const start = params?.zigzagStart || { x: -5, y: 0, z: 0 }
  const end = params?.zigzagEnd || { x: 5, y: 0, z: 0 }
  const zigzagCount = Number(params?.zigzagCount) || 5
  const amplitude = Number(params?.zigzagAmplitude) || 2
  const plane = params?.zigzagPlane || 'xy'
  
  const t = time / duration
  const zigzagProgress = t * zigzagCount
  const zigzagT = (zigzagProgress % 1)
  const zigzagValue = (zigzagT < 0.5 ? zigzagT * 2 : 2 - zigzagT * 2) * 2 - 1
  
  // Base position along path
  const baseX = start.x + (end.x - start.x) * t
  const baseY = start.y + (end.y - start.y) * t
  const baseZ = start.z + (end.z - start.z) * t
  
  // Add zigzag perpendicular to path
  if (plane === 'xy') {
    return { x: baseX, y: baseY + amplitude * zigzagValue, z: baseZ }
  } else if (plane === 'xz') {
    return { x: baseX, y: baseY, z: baseZ + amplitude * zigzagValue }
  } else {
    return { x: baseX + amplitude * zigzagValue, y: baseY, z: baseZ }
  }
}
