import { Position } from '@/types'
import { Rotation } from '@/models/types'
import * as THREE from 'three'

/**
 * Apply 3D rotation to a path around a center point
 * 
 * @param points - Array of points forming the path
 * @param center - Center point for rotation origin
 * @param rotation - Euler angles in degrees {x, y, z}
 * @returns Rotated path points
 */
export function applyRotationToPath(
  points: Position[],
  center: Position,
  rotation: Rotation
): Position[] {
  if (!rotation || (rotation.x === 0 && rotation.y === 0 && rotation.z === 0)) {
    // No rotation needed
    return points
  }

  // Convert degrees to radians
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z),
    'XYZ'
  )

  // Create rotation matrix
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler)

  // Create center vector
  const centerVec = new THREE.Vector3(center.x, center.y, center.z)

  // Transform each point
  return points.map(point => {
    // Translate to origin (relative to center)
    const vec = new THREE.Vector3(
      point.x - center.x,
      point.y - center.y,
      point.z - center.z
    )

    // Apply rotation
    vec.applyMatrix4(rotationMatrix)

    // Translate back
    vec.add(centerVec)

    return {
      x: vec.x,
      y: vec.y,
      z: vec.z
    }
  })
}

/**
 * Convert plane enum to rotation angles
 * Helper for backward compatibility with plane-based models
 * 
 * @param plane - Plane identifier ('xy', 'xz', 'yz')
 * @returns Rotation angles in degrees
 */
export function planeToRotation(plane: 'xy' | 'xz' | 'yz'): Rotation {
  switch (plane) {
    case 'xy':
      return { x: 0, y: 0, z: 0 }      // Default orientation
    case 'xz':
      return { x: 90, y: 0, z: 0 }     // Rotate 90° around X
    case 'yz':
      return { x: 0, y: 0, z: 90 }     // Rotate 90° around Z
    default:
      return { x: 0, y: 0, z: 0 }
  }
}

/**
 * Convert rotation angles to nearest canonical plane
 * Helper for UI hints or simplification
 * 
 * @param rotation - Rotation angles in degrees
 * @returns Nearest canonical plane
 */
export function rotationToPlane(rotation: Rotation): 'xy' | 'xz' | 'yz' {
  // Normalize angles to 0-360
  const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360

  const x = normalizeAngle(rotation.x)
  const y = normalizeAngle(rotation.y)
  const z = normalizeAngle(rotation.z)

  // Check which plane is closest
  const isNearAngle = (angle: number, target: number, tolerance = 15) => {
    return Math.abs(angle - target) < tolerance || Math.abs(angle - target - 360) < tolerance
  }

  // XZ plane: 90° around X
  if (isNearAngle(x, 90) && isNearAngle(y, 0) && isNearAngle(z, 0)) {
    return 'xz'
  }

  // YZ plane: 90° around Z
  if (isNearAngle(x, 0) && isNearAngle(y, 0) && isNearAngle(z, 90)) {
    return 'yz'
  }

  // Default to XY plane
  return 'xy'
}
