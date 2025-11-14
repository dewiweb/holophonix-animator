/**
 * Transform Application Utilities
 * Applies animation transforms uniformly AFTER model calculation
 */

import type { Position, Animation, AnimationTransform, AnimationType } from '@/types'
import { modelRegistry } from '@/models/registry'

/**
 * Rotate a position offset for formation animations
 * Used to maintain rigid body formation during rotational animations
 */
function rotateOffset(
  offset: Position,
  animationType: AnimationType,
  params: any,
  time: number,
  duration: number
): Position {
  // Check if this animation type has rotation
  const model = modelRegistry.getModel(animationType)
  
  if (!model?.visualization?.calculateRotationAngle) {
    // Non-rotational animation: offset stays fixed
    return offset
  }
  
  // Calculate rotation angle using model method
  const rotationAngle = model.visualization.calculateRotationAngle(time, duration, params)
  
  // Get plane of rotation
  const plane = params?.plane || 'xy'
  
  // Rotate offset in the appropriate plane
  const cos = Math.cos(rotationAngle)
  const sin = Math.sin(rotationAngle)
  
  if (plane === 'xy') {
    return {
      x: offset.x * cos - offset.y * sin,
      y: offset.x * sin + offset.y * cos,
      z: offset.z
    }
  } else if (plane === 'xz') {
    return {
      x: offset.x * cos - offset.z * sin,
      y: offset.y,
      z: offset.x * sin + offset.z * cos
    }
  } else { // yz plane
    return {
      x: offset.x,
      y: offset.y * cos - offset.z * sin,
      z: offset.y * sin + offset.z * cos
    }
  }
}

/**
 * Apply animation transform to a calculated position
 * This is the ONLY place where offsets are applied
 * 
 * @param basePosition - Position calculated by model (in absolute coordinates)
 * @param trackId - ID of the track being transformed
 * @param animation - Animation with optional transform metadata
 * @param time - Current animation time
 * @param activeTrackIds - Optional: tracks currently active in this playback (for LTP subset filtering)
 * @returns Transformed position for this track
 */
export function applyTransform(
  basePosition: Position,
  trackId: string,
  animation: Animation,
  time: number,
  activeTrackIds?: string[]
): Position {
  // No transform = absolute mode (single track, no transformation)
  if (!animation.transform) {
    return basePosition
  }
  
  // Runtime filtering: If activeTrackIds provided, check if this track is active
  if (activeTrackIds && !activeTrackIds.includes(trackId)) {
    // Track not in active set for this playback = no transformation
    console.warn(`⚠️ Track ${trackId} not in active set, skipping transform`)
    return basePosition
  }
  
  // Get track-specific transform
  const trackTransform = animation.transform.tracks[trackId]
  if (!trackTransform) {
    // Track not in transform map = no transformation
    return basePosition
  }
  
  const { offset } = trackTransform
  const { mode, formation } = animation.transform
  
  // Apply offset based on mode
  if (mode === 'absolute') {
    // No offset for absolute mode
    return basePosition
  }
  
  if (mode === 'relative') {
    // Relative mode: simple static offset
    // Each track moves independently, offset doesn't rotate
    if (Math.random() < 0.01) { // Log 1% of frames
      console.log('🔄 applyTransform relative:', {
        baseX: basePosition.x,
        baseY: basePosition.y,
        baseZ: basePosition.z,
        offsetX: offset.x,
        offsetY: offset.y,
        offsetZ: offset.z,
        finalX: basePosition.x + offset.x,
        finalY: basePosition.y + offset.y,
        finalZ: basePosition.z + offset.z
      })
    }
    return {
      x: basePosition.x + offset.x,
      y: basePosition.y + offset.y,
      z: basePosition.z + offset.z,
    }
  }
  
  if (mode === 'formation') {
    // Formation mode: apply formation anchor + base position + offset
    // CRITICAL: basePosition is the animation path (centered at 0,0,0)
    // We must ADD the formation anchor to get world position
    const pattern = formation?.pattern || 'rigid'
    const anchor = formation?.anchor || { x: 0, y: 0, z: 0 }
    
    if (pattern === 'spherical') {
      // Spherical: offset doesn't rotate (tracks maintain sphere)
      return {
        x: anchor.x + basePosition.x + offset.x,
        y: anchor.y + basePosition.y + offset.y,
        z: anchor.z + basePosition.z + offset.z,
      }
    }
    
    if (pattern === 'rigid') {
      // Rigid formation: rotate offset to maintain formation shape
      const rotatedOffset = rotateOffset(
        offset,
        animation.type,
        animation.parameters,
        time,
        animation.duration
      )
      
      return {
        x: anchor.x + basePosition.x + rotatedOffset.x,
        y: anchor.y + basePosition.y + rotatedOffset.y,
        z: anchor.z + basePosition.z + rotatedOffset.z,
      }
    }
  }
  
  // Fallback: return base position
  return basePosition
}

/**
 * Get adjusted animation time for a track (applying time shift)
 * 
 * @param trackId - ID of the track
 * @param baseTime - Base animation time in seconds
 * @param animation - Animation with optional transform
 * @returns Adjusted time for this track
 */
export function getTrackTime(
  trackId: string,
  baseTime: number,
  animation: Animation
): number {
  if (!animation.transform) {
    return baseTime
  }
  
  const trackTransform = animation.transform.tracks[trackId]
  if (!trackTransform) {
    return baseTime
  }
  
  // Apply time shift (phase offset)
  return Math.max(0, baseTime - trackTransform.timeShift)
}

/**
 * Check if animation uses transforms (multi-track)
 */
export function isMultiTrack(animation: Animation): boolean {
  return !!animation.transform && Object.keys(animation.transform.tracks).length > 1
}

/**
 * Get list of track IDs in animation
 */
export function getAnimationTrackIds(animation: Animation): string[] {
  if (!animation.transform) {
    // Fallback to legacy trackIds field
    return animation.trackIds || []
  }
  
  return Object.keys(animation.transform.tracks)
}
