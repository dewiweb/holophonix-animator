import { Position } from '@/types'

// ========================================
// BASIC ANIMATIONS
// ========================================

export function calculateLinearPosition(params: any, time: number, duration: number): Position {
  const t = Math.min(time / (duration || 1), 1)
  const start = params?.startPosition || { x: 0, y: 0, z: 0 }
  const end = params?.endPosition || { x: 5, y: 5, z: 5 }
  
  const result = {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t
  }
  
  return result
}

export function calculateCircularPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const radius = Number(params?.radius) || 3
  const startAngle = (Number(params?.startAngle) || 0) * (Math.PI / 180)
  const endAngle = (Number(params?.endAngle) || 360) * (Math.PI / 180)
  const plane = params?.plane || 'xy'
  
  const t = Math.min(time / (duration || 1), 1)
  const angle = startAngle + (endAngle - startAngle) * t
  
  let posX = center.x
  let posY = center.y
  let posZ = center.z
  
  if (plane === 'xy') {
    posX = center.x + radius * Math.cos(angle)
    posY = center.y + radius * Math.sin(angle)
  } else if (plane === 'xz') {
    posX = center.x + radius * Math.cos(angle)
    posZ = center.z + radius * Math.sin(angle)
  } else if (plane === 'yz') {
    posY = center.y + radius * Math.cos(angle)
    posZ = center.z + radius * Math.sin(angle)
  }
  
  return { x: posX, y: posY, z: posZ }
}

export function calculateEllipticalPosition(params: any, time: number, duration: number): Position {
  const radiusX = Number(params?.radiusX) || 3
  const radiusY = Number(params?.radiusY) || 2
  const radiusZ = Number(params?.radiusZ) || 1
  const plane = params?.plane || 'xy'
  
  const centerX = Number(params?.centerX) || 0
  const centerY = Number(params?.centerY) || 0
  const centerZ = Number(params?.centerZ) || 0
  
  const startAngleDeg = Number(params?.startAngle) || 0
  const endAngleDeg = params?.endAngle !== undefined ? Number(params.endAngle) : 360
  const startAngle = (startAngleDeg * Math.PI) / 180
  const endAngle = (endAngleDeg * Math.PI) / 180
  
  const t = Math.min(time / (duration || 1), 1)
  const angle = startAngle + t * (endAngle - startAngle)
  
  let posX = centerX
  let posY = centerY
  let posZ = centerZ
  
  if (plane === 'xy') {
    posX = centerX + radiusX * Math.cos(angle)
    posY = centerY + radiusY * Math.sin(angle)
  } else if (plane === 'xz') {
    posX = centerX + radiusX * Math.cos(angle)
    posZ = centerZ + radiusZ * Math.sin(angle)
  } else if (plane === 'yz') {
    posY = centerY + radiusY * Math.cos(angle)
    posZ = centerZ + radiusZ * Math.sin(angle)
  }
  
  return { x: posX, y: posY, z: posZ }
}

export function calculateSpiralPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const startRadius = Number(params?.startRadius) || 1
  const endRadius = Number(params?.endRadius) || 5
  const rotations = Number(params?.rotations) || 3
  const direction = params?.direction || 'clockwise'
  const plane = params?.plane || 'xy'
  
  const t = time / (duration || 1)
  const radius = startRadius + (endRadius - startRadius) * t
  const angle = t * rotations * 2 * Math.PI * (direction === 'clockwise' ? 1 : -1)
  
  let posX = center.x
  let posY = center.y
  let posZ = center.z
  
  if (plane === 'xy') {
    posX = center.x + radius * Math.cos(angle)
    posY = center.y + radius * Math.sin(angle)
  } else if (plane === 'xz') {
    posX = center.x + radius * Math.cos(angle)
    posZ = center.z + radius * Math.sin(angle)
  } else if (plane === 'yz') {
    posY = center.y + radius * Math.cos(angle)
    posZ = center.z + radius * Math.sin(angle)
  }
  
  return { x: posX, y: posY, z: posZ }
}

// Generate random waypoints for random animation (called once when creating animation)
export function generateRandomWaypoints(center: Position, bounds: { x: number; y: number; z: number }, duration: number, updateFrequency: number): Position[] {
  const waypointCount = Math.max(Math.ceil(duration * updateFrequency), 3)
  const waypoints: Position[] = []
  
  // Start at center
  waypoints.push({ ...center })
  
  // Generate random waypoints
  for (let i = 1; i < waypointCount; i++) {
    waypoints.push({
      x: center.x + (Math.random() * 2 - 1) * bounds.x,
      y: center.y + (Math.random() * 2 - 1) * bounds.y,
      z: center.z + (Math.random() * 2 - 1) * bounds.z
    })
  }
  
  // End at center for smooth looping
  waypoints.push({ ...center })
  
  return waypoints
}

export function calculateRandomPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const smoothness = Number(params?.smoothness) || 0.5
  
  // Use pre-generated waypoints if available, otherwise generate on-the-fly (fallback)
  let waypoints: Position[] = params?.randomWaypoints || []
  
  if (waypoints.length === 0) {
    // Fallback: generate default waypoints
    const bounds = params?.bounds || { x: 5, y: 5, z: 5 }
    const updateFrequency = Number(params?.updateFrequency) || 2
    waypoints = generateRandomWaypoints(center, bounds, duration, updateFrequency)
  }
  
  if (waypoints.length < 2) {
    return { ...center }
  }
  
  // Calculate which waypoint segment we're in
  const t = Math.min(time / duration, 1)
  const segmentCount = waypoints.length - 1
  const segmentIndex = Math.min(Math.floor(t * segmentCount), segmentCount - 1)
  const segmentT = (t * segmentCount) - segmentIndex
  
  const p0 = waypoints[segmentIndex]
  const p1 = waypoints[segmentIndex + 1]
  
  // Interpolate between waypoints with smoothness
  // Smoothness controls the easing: 0.5 = linear, < 0.5 = ease-in, > 0.5 = ease-out
  let interpolation = segmentT
  if (smoothness < 0.5) {
    // Ease-in: slow start
    const factor = smoothness * 2
    interpolation = Math.pow(segmentT, 2 - factor)
  } else if (smoothness > 0.5) {
    // Ease-out: slow end  
    const factor = (smoothness - 0.5) * 2
    interpolation = 1 - Math.pow(1 - segmentT, 2 - factor)
  }
  
  return {
    x: p0.x + (p1.x - p0.x) * interpolation,
    y: p0.y + (p1.y - p0.y) * interpolation,
    z: p0.z + (p1.z - p0.z) * interpolation
  }
}
