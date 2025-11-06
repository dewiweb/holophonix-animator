import { Position, Track } from '@/types'

/**
 * Calculate the barycenter (center of mass) of a group of tracks
 */
export function calculateBarycenter(tracks: Track[]): Position
export function calculateBarycenter(tracks: Array<{ position: Position }>): Position
export function calculateBarycenter(tracks: Track[] | Array<{ position: Position }>): Position {
  if (tracks.length === 0) {
    return { x: 0, y: 0, z: 0 }
  }

  const sum = tracks.reduce(
    (acc, track) => ({
      x: acc.x + track.position.x,
      y: acc.y + track.position.y,
      z: acc.z + track.position.z
    }),
    { x: 0, y: 0, z: 0 }
  )

  return {
    x: sum.x / tracks.length,
    y: sum.y / tracks.length,
    z: sum.z / tracks.length
  }
}

/**
 * Calculate offset vectors from barycenter for each track
 */
export function calculateOffsets(tracks: Track[], barycenter: Position): Record<string, Position> {
  const offsets: Record<string, Position> = {}
  
  tracks.forEach(track => {
    offsets[track.id] = {
      x: track.position.x - barycenter.x,
      y: track.position.y - barycenter.y,
      z: track.position.z - barycenter.z
    }
  })

  return offsets
}

/**
 * Apply position to barycenter and distribute offsets to tracks
 */
export function applyBarycentricPosition(
  barycentricPosition: Position,
  offsets: Record<string, Position>
): Record<string, Position> {
  const trackPositions: Record<string, Position> = {}

  Object.entries(offsets).forEach(([trackId, offset]) => {
    trackPositions[trackId] = {
      x: barycentricPosition.x + offset.x,
      y: barycentricPosition.y + offset.y,
      z: barycentricPosition.z + offset.z
    }
  })

  return trackPositions
}

/**
 * Rotate a position around origin by angle (in radians) on specified plane
 */
export function rotatePosition(position: Position, angle: number, plane: 'xy' | 'xz' | 'yz'): Position {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  switch (plane) {
    case 'xy':
      return {
        x: position.x * cos - position.y * sin,
        y: position.x * sin + position.y * cos,
        z: position.z
      }
    case 'xz':
      return {
        x: position.x * cos - position.z * sin,
        y: position.y,
        z: position.x * sin + position.z * cos
      }
    case 'yz':
      return {
        x: position.x,
        y: position.y * cos - position.z * sin,
        z: position.y * sin + position.z * cos
      }
  }
}

/**
 * Apply barycentric position with rotation
 */
export function applyBarycentricPositionWithRotation(
  barycentricPosition: Position,
  offsets: Record<string, Position>,
  rotationAngle: number,
  rotationPlane: 'xy' | 'xz' | 'yz' = 'xy'
): Record<string, Position> {
  const trackPositions: Record<string, Position> = {}

  Object.entries(offsets).forEach(([trackId, offset]) => {
    // Rotate the offset vector
    const rotatedOffset = rotatePosition(offset, rotationAngle, rotationPlane)
    
    // Apply to barycenter position
    trackPositions[trackId] = {
      x: barycentricPosition.x + rotatedOffset.x,
      y: barycentricPosition.y + rotatedOffset.y,
      z: barycentricPosition.z + rotatedOffset.z
    }
  })

  return trackPositions
}

/**
 * Calculate rotation angle from animation parameters
 * For circular/orbital animations, derive rotation from the animation progress
 */
export function calculateRotationFromAnimation(
  animationType: string,
  progress: number, // 0-1
  parameters: any
): number {
  // Detect rotational animation types
  const rotationalTypes = ['circular', 'orbit', 'circular-scan']
  const spiralTypes = ['spiral']
  
  if (rotationalTypes.includes(animationType)) {
    // Full rotation based on progress
    return progress * Math.PI * 2
  }
  
  if (spiralTypes.includes(animationType)) {
    // Multiple rotations for spiral
    const rotations = parameters.rotations || 1
    return progress * Math.PI * 2 * rotations
  }
  
  // Non-rotational animations
  return 0
}
