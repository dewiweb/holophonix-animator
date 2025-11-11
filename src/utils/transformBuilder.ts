/**
 * Transform Builder - Converts UI state to v3 AnimationTransform
 * Bridges the gap between UI editing concepts and engine execution model
 */

import type { AnimationTransform, TrackTransform, Position, Track } from '@/types'

/**
 * Calculate barycenter (geometric center) of tracks
 */
function calculateBarycenter(tracks: Track[]): Position {
  if (tracks.length === 0) {
    return { x: 0, y: 0, z: 0 }
  }
  
  const sum = tracks.reduce(
    (acc, track) => ({
      x: acc.x + (track.initialPosition?.x ?? track.position.x),
      y: acc.y + (track.initialPosition?.y ?? track.position.y),
      z: acc.z + (track.initialPosition?.z ?? track.position.z),
    }),
    { x: 0, y: 0, z: 0 }
  )
  
  return {
    x: sum.x / tracks.length,
    y: sum.y / tracks.length,
    z: sum.z / tracks.length,
  }
}

/**
 * Calculate spherical offset for custom variant (golden spiral distribution)
 */
function calculateSphericalOffset(
  trackIndex: number,
  totalTracks: number,
  radius: number
): Position {
  if (radius === 0) {
    return { x: 0, y: 0, z: 0 }
  }
  
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ≈ 137.5°
  const theta = goldenAngle * trackIndex
  const y_normalized = 1 - (trackIndex / Math.max(1, totalTracks - 1)) * 2
  const phi = Math.acos(y_normalized)
  const sinPhi = Math.sin(phi)
  
  return {
    x: radius * sinPhi * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * sinPhi * Math.sin(theta),
  }
}

/**
 * Build v3 AnimationTransform from UI state
 * 
 * @param mode - UI mode: 'relative' or 'barycentric'
 * @param variant - Barycentric variant: 'shared', 'isobarycentric', 'centered', 'custom'
 * @param tracks - Selected tracks
 * @param customCenter - User-defined center (for centered/custom/shared variants)
 * @param phaseOffsetSeconds - Time delay between tracks
 * @returns v3 AnimationTransform
 */
export function buildTransform(
  mode: 'relative' | 'barycentric',
  variant: 'shared' | 'isobarycentric' | 'centered' | 'custom' | undefined,
  tracks: Track[],
  customCenter?: Position,
  phaseOffsetSeconds?: number
): AnimationTransform | undefined {
  if (tracks.length === 0) {
    return undefined
  }
  
  if (tracks.length === 1) {
    // Single track - no transform needed
    return undefined
  }
  
  const trackTransforms: Record<string, TrackTransform> = {}
  const phaseOffset = phaseOffsetSeconds || 0
  
  if (mode === 'relative') {
    // Relative mode: each track has offset = its position
    tracks.forEach((track, index) => {
      const trackPos = track.initialPosition || track.position
      trackTransforms[track.id] = {
        offset: trackPos,
        timeShift: index * phaseOffset,
      }
    })
    
    return {
      mode: 'relative',
      tracks: trackTransforms,
    }
  }
  
  // Barycentric/formation mode
  const effectiveVariant = variant || 'isobarycentric'
  let anchor: Position
  let pattern: 'rigid' | 'spherical' = 'rigid'
  
  if (effectiveVariant === 'isobarycentric') {
    anchor = calculateBarycenter(tracks)
  } else {
    anchor = customCenter || { x: 0, y: 0, z: 0 }
  }
  
  if (effectiveVariant === 'custom') {
    pattern = 'spherical'
    const radius = anchor.radius ?? 5.0
    
    tracks.forEach((track, index) => {
      const offset = calculateSphericalOffset(index, tracks.length, radius)
      trackTransforms[track.id] = {
        offset,
        timeShift: index * phaseOffset,
      }
    })
  } else if (effectiveVariant === 'shared') {
    // All tracks at same position (zero offset)
    tracks.forEach((track, index) => {
      trackTransforms[track.id] = {
        offset: { x: 0, y: 0, z: 0 },
        timeShift: index * phaseOffset,
      }
    })
  } else {
    // isobarycentric or centered: preserve relative positions
    tracks.forEach((track, index) => {
      const trackPos = track.initialPosition || track.position
      const offset = {
        x: trackPos.x - anchor.x,
        y: trackPos.y - anchor.y,
        z: trackPos.z - anchor.z,
      }
      trackTransforms[track.id] = {
        offset,
        timeShift: index * phaseOffset,
      }
    })
  }
  
  return {
    mode: 'formation',
    tracks: trackTransforms,
    formation: {
      anchor,
      pattern,
    },
  }
}

/**
 * Extract UI state from v3 AnimationTransform (for editing existing animations)
 */
export function extractUIState(transform: AnimationTransform | undefined): {
  mode: 'relative' | 'barycentric'
  variant: 'shared' | 'isobarycentric' | 'centered' | 'custom' | undefined
  customCenter: Position | undefined
} {
  if (!transform) {
    return {
      mode: 'relative',
      variant: undefined,
      customCenter: undefined,
    }
  }
  
  if (transform.mode === 'relative') {
    return {
      mode: 'relative',
      variant: undefined,
      customCenter: undefined,
    }
  }
  
  // Formation mode
  const pattern = transform.formation?.pattern || 'rigid'
  const anchor = transform.formation?.anchor
  
  // Determine variant based on pattern and offsets
  const trackIds = Object.keys(transform.tracks)
  if (trackIds.length === 0) {
    return {
      mode: 'barycentric',
      variant: 'shared',
      customCenter: anchor,
    }
  }
  
  // Check if all offsets are zero (shared)
  const allZero = trackIds.every(id => {
    const offset = transform.tracks[id].offset
    return offset.x === 0 && offset.y === 0 && offset.z === 0
  })
  
  if (allZero) {
    return {
      mode: 'barycentric',
      variant: 'shared',
      customCenter: anchor,
    }
  }
  
  if (pattern === 'spherical') {
    return {
      mode: 'barycentric',
      variant: 'custom',
      customCenter: anchor,
    }
  }
  
  // Rigid pattern - could be iso or centered
  // For now, default to isobarycentric
  return {
    mode: 'barycentric',
    variant: 'isobarycentric',
    customCenter: anchor,
  }
}
