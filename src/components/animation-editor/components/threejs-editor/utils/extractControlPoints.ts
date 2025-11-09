import * as THREE from 'three'
import type { Animation, Position } from '@/types'
import { appToThreePosition, threeToAppPosition } from './coordinateConversion'

/**
 * Helper to convert Position to THREE.Vector3 with coordinate system conversion
 * App uses Z-up (spatial audio), Three.js uses Y-up (graphics)
 */
export const positionToVector3 = (pos: Position): THREE.Vector3 => {
  return appToThreePosition(pos)
}

/**
 * Extract control points from animation parameters based on animation type
 * This matches the logic from the old ControlPointEditor
 */
export const extractControlPointsFromAnimation = (animation: Animation | null): THREE.Vector3[] => {
  console.log('🔍 Extracting control points:', {
    hasAnimation: !!animation,
    type: animation?.type,
    hasParameters: !!animation?.parameters,
    parameters: animation?.parameters
  })
  
  if (!animation || !animation.parameters) {
    console.log('❌ No animation or parameters to extract from')
    return []
  }
  
  const params = animation.parameters as any // Dynamic params based on animation type
  const points: THREE.Vector3[] = []
  
  switch (animation.type) {
    case 'linear':
      // Start and end positions
      if (params.startPosition) {
        points.push(positionToVector3(params.startPosition))
      }
      if (params.endPosition) {
        points.push(positionToVector3(params.endPosition))
      }
      break
      
    case 'bezier':
      // Bezier curve: start, control1, control2, end
      if (params.bezierStart) {
        points.push(positionToVector3(params.bezierStart))
      }
      if (params.bezierControl1) {
        points.push(positionToVector3(params.bezierControl1))
      }
      if (params.bezierControl2) {
        points.push(positionToVector3(params.bezierControl2))
      }
      if (params.bezierEnd) {
        points.push(positionToVector3(params.bezierEnd))
      }
      break
      
    case 'catmull-rom':
      // Array of control points
      if (params.controlPoints && Array.isArray(params.controlPoints)) {
        params.controlPoints.forEach((p: Position) => {
          points.push(positionToVector3(p))
        })
      }
      break
      
    case 'circular':
    case 'spiral':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
    case 'zoom':
      // Center point for circular/radial animations
      if (params.center) {
        points.push(positionToVector3(params.center))
      }
      break
      
    case 'elliptical':
      // Elliptical uses separate centerX/Y/Z
      if (typeof params.centerX === 'number' && 
          typeof params.centerY === 'number' && 
          typeof params.centerZ === 'number') {
        points.push(positionToVector3({ 
          x: params.centerX, 
          y: params.centerY, 
          z: params.centerZ 
        }))
      }
      break
      
    case 'pendulum':
      // Anchor point (the point it swings from)
      if (params.anchorPoint) {
        points.push(positionToVector3(params.anchorPoint))
      }
      break
      
    case 'spring':
      // Rest position (equilibrium point)
      if (params.restPosition) {
        points.push(positionToVector3(params.restPosition))
      }
      break
      
    case 'attract-repel':
      // Target position (attraction/repulsion center)
      if (params.target) {
        points.push(positionToVector3(params.target))
      }
      break
      
    case 'helix':
      // Axis start and end points
      if (params.axisStart) {
        points.push(positionToVector3(params.axisStart))
      }
      if (params.axisEnd) {
        points.push(positionToVector3(params.axisEnd))
      }
      break
      
    case 'zigzag':
    case 'doppler':
      // Path-based: start and end
      if (params.start) {
        points.push(positionToVector3(params.start))
      }
      if (params.end) {
        points.push(positionToVector3(params.end))
      }
      break
      
    case 'custom':
      // Extract from keyframes
      if (animation.keyframes && Array.isArray(animation.keyframes)) {
        animation.keyframes.forEach((kf: any) => {
          if (kf.position) {
            points.push(positionToVector3(kf.position))
          }
        })
      }
      break
      
    default:
      // For other animation types, try common parameter names
      if (params.startPosition) {
        points.push(positionToVector3(params.startPosition))
      }
      if (params.endPosition) {
        points.push(positionToVector3(params.endPosition))
      }
      break
  }
  
  console.log('✅ Extracted control points:', {
    count: points.length,
    points: points.map(p => ({ x: p.x.toFixed(2), y: p.y.toFixed(2), z: p.z.toFixed(2) }))
  })
  
  return points
}

/**
 * Convert control points back to animation parameters
 * Used when user edits control points via gizmo
 * Converts from Three.js coordinates back to app coordinates
 */
export const controlPointsToParameters = (
  animationType: string,
  points: THREE.Vector3[],
  originalParams: any
): any => {
  // Convert Three.js Vector3 back to app Position (with coordinate conversion)
  const vector3ToPosition = (vec: THREE.Vector3): Position => {
    return threeToAppPosition(vec)
  }
  
  const updatedParams = { ...originalParams }
  
  switch (animationType) {
    case 'linear':
      if (points[0]) updatedParams.startPosition = vector3ToPosition(points[0])
      if (points[1]) updatedParams.endPosition = vector3ToPosition(points[1])
      break
      
    case 'bezier':
      if (points[0]) updatedParams.bezierStart = vector3ToPosition(points[0])
      if (points[1]) updatedParams.bezierControl1 = vector3ToPosition(points[1])
      if (points[2]) updatedParams.bezierControl2 = vector3ToPosition(points[2])
      if (points[3]) updatedParams.bezierEnd = vector3ToPosition(points[3])
      break
      
    case 'catmull-rom':
      updatedParams.controlPoints = points.map(vector3ToPosition)
      break
      
    case 'circular':
    case 'spiral':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
    case 'zoom':
      // Update center point
      if (points[0]) {
        updatedParams.center = vector3ToPosition(points[0])
      }
      break
      
    case 'elliptical':
      // Update separate centerX/Y/Z
      if (points[0]) {
        const pos = vector3ToPosition(points[0])
        updatedParams.centerX = pos.x
        updatedParams.centerY = pos.y
        updatedParams.centerZ = pos.z
      }
      break
      
    case 'pendulum':
      // Update anchor point
      if (points[0]) {
        updatedParams.anchorPoint = vector3ToPosition(points[0])
      }
      break
      
    case 'spring':
      // Update rest position
      if (points[0]) {
        updatedParams.restPosition = vector3ToPosition(points[0])
      }
      break
      
    case 'attract-repel':
      // Update target
      if (points[0]) {
        updatedParams.target = vector3ToPosition(points[0])
      }
      break
      
    case 'helix':
      // Update axis points
      if (points[0]) updatedParams.axisStart = vector3ToPosition(points[0])
      if (points[1]) updatedParams.axisEnd = vector3ToPosition(points[1])
      break
      
    case 'zigzag':
    case 'doppler':
      // Update start/end
      if (points[0]) updatedParams.start = vector3ToPosition(points[0])
      if (points[1]) updatedParams.end = vector3ToPosition(points[1])
      break
      
    case 'custom':
      // For custom animations, would need to update keyframes
      // This is more complex and may require separate handling
      break
      
    default:
      // For other types, update common parameters if they exist
      if (points[0] && originalParams.startPosition) {
        updatedParams.startPosition = vector3ToPosition(points[0])
      }
      if (points[1] && originalParams.endPosition) {
        updatedParams.endPosition = vector3ToPosition(points[1])
      }
      break
  }
  
  return updatedParams
}
