/**
 * Animation Migration Utilities
 * Converts v2 multi-track architecture to v3 unified transform model
 */

import type { Animation, AnimationTransform, TrackTransform, Position, Track } from '@/types'

/**
 * Check if animation needs migration from v2 to v3
 */
export function needsMigration(animation: Animation): boolean {
  // Has v2 fields but no v3 transform
  return !animation.transform && (
    !!animation.multiTrackMode ||
    !!animation.barycentricVariant ||
    !!animation.customCenter ||
    !!animation.multiTrackParameters ||
    !!animation.phaseOffsetSeconds
  )
}

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
 * Calculate offset for a track in formation mode
 */
function calculateFormationOffset(
  track: Track,
  anchor: Position,
  variant: string,
  trackIndex: number,
  totalTracks: number
): Position {
  const trackPos = track.initialPosition || track.position
  
  if (variant === 'shared') {
    // All tracks at anchor (zero offset)
    return { x: 0, y: 0, z: 0 }
  }
  
  if (variant === 'custom') {
    // Spherical distribution using golden spiral
    const radius = anchor.radius ?? 5.0
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
  
  // isobarycentric or centered: preserve relative position
  return {
    x: trackPos.x - anchor.x,
    y: trackPos.y - anchor.y,
    z: trackPos.z - anchor.z,
  }
}

/**
 * Migrate v2 animation to v3 unified transform model
 */
export function migrateToV3(animation: Animation, tracks: Track[]): Animation {
  if (!needsMigration(animation)) {
    return animation // Already v3 or single-track
  }
  
  console.log('🔄 Migrating animation from v2 to v3:', animation.name)
  
  // Determine transform mode
  let mode: 'absolute' | 'relative' | 'formation' = 'absolute'
  if (animation.multiTrackMode === 'relative') {
    mode = 'relative'
  } else if (animation.multiTrackMode === 'barycentric') {
    mode = 'formation'
  }
  
  // Build track transforms
  const trackTransforms: Record<string, TrackTransform> = {}
  const phaseOffset = animation.phaseOffsetSeconds || 0
  
  if (mode === 'absolute') {
    // Single track - no transforms needed
    if (animation.trackIds && animation.trackIds.length > 0) {
      trackTransforms[animation.trackIds[0]] = {
        offset: { x: 0, y: 0, z: 0 },
        timeShift: 0,
      }
    }
  } else if (mode === 'relative') {
    // Relative mode: each track has its own parameters
    tracks.forEach((track, index) => {
      const trackPos = track.initialPosition || track.position
      trackTransforms[track.id] = {
        offset: trackPos,  // Offset is track position
        timeShift: index * phaseOffset,
      }
    })
  } else if (mode === 'formation') {
    // Formation mode: calculate anchor and offsets
    const variant = animation.barycentricVariant || 'isobarycentric'
    let anchor: Position
    
    if (variant === 'isobarycentric') {
      anchor = calculateBarycenter(tracks)
    } else {
      anchor = animation.customCenter || { x: 0, y: 0, z: 0 }
    }
    
    tracks.forEach((track, index) => {
      const offset = calculateFormationOffset(
        track,
        anchor,
        variant,
        index,
        tracks.length
      )
      trackTransforms[track.id] = {
        offset,
        timeShift: index * phaseOffset,
      }
    })
  }
  
  // Create v3 transform
  const transform: AnimationTransform = {
    mode,
    tracks: trackTransforms,
  }
  
  // Add formation metadata if formation mode
  if (mode === 'formation') {
    const variant = animation.barycentricVariant || 'isobarycentric'
    let anchor: Position
    
    if (variant === 'isobarycentric') {
      anchor = calculateBarycenter(tracks)
    } else {
      anchor = animation.customCenter || { x: 0, y: 0, z: 0 }
    }
    
    transform.formation = {
      anchor,
      pattern: variant === 'custom' ? 'spherical' : 'rigid',
    }
  }
  
  // Create migrated animation (keep v2 fields for backward compat)
  const migrated: Animation = {
    ...animation,
    transform,
  }
  
  console.log('✅ Migration complete:', {
    mode,
    trackCount: Object.keys(trackTransforms).length,
    hasFormation: !!transform.formation,
  })
  
  return migrated
}

/**
 * Auto-migrate animation on load if needed
 * This should be called whenever an animation is loaded from storage
 */
export function autoMigrate(animation: Animation, tracks: Track[]): Animation {
  if (needsMigration(animation)) {
    return migrateToV3(animation, tracks)
  }
  return animation
}

/**
 * Batch migrate all animations in a project
 */
export function migrateProject(animations: Animation[], tracks: Track[]): Animation[] {
  return animations.map(animation => autoMigrate(animation, tracks))
}
