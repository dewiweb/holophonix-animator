import * as THREE from 'three'
import type { Position } from '@/types'

/**
 * Coordinate System Conversion Utilities
 * 
 * App Coordinate System (Spatial Audio - Z-up):
 * - X: Right
 * - Y: Forward (toward listener)
 * - Z: Up (vertical)
 * 
 * Three.js Coordinate System (Graphics - Y-up):
 * - X: Right
 * - Y: Up (vertical)
 * - Z: Forward (toward viewer)
 * 
 * Conversion:
 * - App → Three.js: (x, y, z) → (x, z, -y)
 * - Three.js → App: (x, y, z) → (x, -z, y)
 */

/**
 * Convert app position (Z-up) to Three.js position (Y-up)
 */
export const appToThreePosition = (appPos: Position): THREE.Vector3 => {
  return new THREE.Vector3(
    appPos.x,      // X stays same (right)
    appPos.z,      // App Z (up) → Three Y (up)
    -appPos.y      // App Y (forward) → Three -Z (forward, flipped)
  )
}

/**
 * Convert Three.js position (Y-up) to app position (Z-up)
 */
export const threeToAppPosition = (threePos: THREE.Vector3): Position => {
  return {
    x: threePos.x,   // X stays same (right)
    y: -threePos.z,  // Three -Z (forward) → App Y (forward)
    z: threePos.y    // Three Y (up) → App Z (up)
  }
}

/**
 * Convert multiple app positions to Three.js
 */
export const appPositionsToThree = (positions: Position[]): THREE.Vector3[] => {
  return positions.map(appToThreePosition)
}

/**
 * Convert multiple Three.js positions to app
 */
export const threePositionsToApp = (positions: THREE.Vector3[]): Position[] => {
  return positions.map(threeToAppPosition)
}
