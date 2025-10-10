import { Position } from '@/types'

// ========================================
// SPECIALIZED SPATIAL AUDIO ANIMATIONS
// ========================================

export function calculateDopplerPosition(params: any, time: number, duration: number): Position {
  const pathStart = params?.pathStart || { x: -10, y: 0, z: 5 }
  const pathEnd = params?.pathEnd || { x: 10, y: 0, z: 5 }
  const speed = Number(params?.passBySpeed) || 1
  
  const t = (time / duration) * speed
  const clampedT = Math.max(0, Math.min(1, t))
  
  return {
    x: pathStart.x + (pathEnd.x - pathStart.x) * clampedT,
    y: pathStart.y + (pathEnd.y - pathStart.y) * clampedT,
    z: pathStart.z + (pathEnd.z - pathStart.z) * clampedT
  }
}

export function calculateCircularScanPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const radius = Number(params?.scanRadius) || 5
  const height = Number(params?.scanHeight) || 0
  const sweepCount = Number(params?.sweepCount) || 1
  const startAngle = (Number(params?.startAngleOffset) || 0) * (Math.PI / 180)
  
  const t = (time / duration) * sweepCount * 2 * Math.PI + startAngle
  
  return {
    x: center.x + radius * Math.cos(t),
    y: center.y + height,
    z: center.z + radius * Math.sin(t)
  }
}

export function calculateZoomPosition(params: any, time: number, duration: number): Position {
  const zoomCenter = params?.zoomCenter || { x: 0, y: 0, z: 0 }
  const startDist = Number(params?.startDistance) || 10
  const endDist = Number(params?.endDistance) || 1
  const curve = params?.accelerationCurve || 'linear'
  
  let t = time / duration
  
  // Apply easing curve
  switch (curve) {
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
  
  const distance = startDist + (endDist - startDist) * t
  const angle = (time / duration) * 2 * Math.PI  // Optional: rotate while zooming
  
  return {
    x: zoomCenter.x + distance * Math.cos(angle),
    y: zoomCenter.y,
    z: zoomCenter.z + distance * Math.sin(angle)
  }
}
