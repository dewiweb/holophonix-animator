import { Position } from '@/types'
import { Rotation } from '@/models/types'
import * as THREE from 'three'

/**
 * Apply 3D rotation to a path around a center point
 * Handles coordinate system conversion between app (Z-up) and Three.js (Y-up)
 * 
 * @param points - Array of points forming the path (app coordinates, Z-up)
 * @param center - Center point for rotation origin (app coordinates, Z-up)
 * @param rotation - Euler angles in degrees {x, y, z} (app coordinates, Z-up)
 * @returns Rotated path points (app coordinates, Z-up)
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

  // Convert app rotation (Z-up) to Three.js rotation (Y-up)
  // App: X=pitch, Y=yaw(forward), Z=roll(vertical)
  // Three.js: X=pitch, Y=yaw(vertical), Z=roll(forward)
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(rotation.x),   // Pitch: same axis
    THREE.MathUtils.degToRad(rotation.z),   // Three.js Y: App Z (vertical)
    THREE.MathUtils.degToRad(-rotation.y),  // Three.js Z: App -Y (inverted)
    'XYZ'
  )

  // Create rotation matrix
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler)

  // Convert center from app (Z-up) to Three.js (Y-up): (x, y, z) → (x, z, -y)
  const centerThree = new THREE.Vector3(center.x, center.z, -center.y)

  // Transform each point
  return points.map(point => {
    // Convert point from app (Z-up) to Three.js (Y-up): (x, y, z) → (x, z, -y)
    const pointThree = new THREE.Vector3(point.x, point.z, -point.y)
    
    // Translate to origin (relative to center)
    pointThree.sub(centerThree)

    // Apply rotation
    pointThree.applyMatrix4(rotationMatrix)

    // Translate back
    pointThree.add(centerThree)

    // Convert back from Three.js (Y-up) to app (Z-up): (x, y, z) → (x, -z, y)
    return {
      x: pointThree.x,
      y: -pointThree.z,
      z: pointThree.y
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
