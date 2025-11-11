import { Track, Animation, AnimationParameters, Position } from '@/types'

/**
 * 2-MODE ARCHITECTURE: Relative + Barycentric (with variants)
 * - 'relative': Each track has own parameters (relative to track.position)
 * - 'barycentric': Formation/group movement around a center
 *   - variant 'shared': All tracks identical (zero offsets)
 *   - variant 'isobarycentric': Auto-calculated center, preserves offsets
 *   - variant 'centered': User-defined center, preserves offsets
 *   - variant 'custom': Advanced user control
 */

export type MultiTrackMode = 'relative' | 'barycentric'
export type BarycentricVariant = 'shared' | 'isobarycentric' | 'centered' | 'custom'

export interface MultiTrackStrategy {
  readonly name: MultiTrackMode
  
  /**
   * Get parameters for a specific track
   */
  getTrackParameters(
    animation: Animation,
    track: Track,
    trackIndex: number,
    allTracks: Track[],
    variant?: BarycentricVariant
  ): AnimationParameters
  
  /**
   * Get phase offset (time delay) for this track
   * Returns 0 if no phase offset
   */
  getPhaseOffset(
    trackIndex: number,
    globalPhaseOffset?: number
  ): number
  
  /**
   * Whether this strategy requires per-track parameter storage
   */
  requiresPerTrackParameters(): boolean
}

/**
 * BARYCENTRIC MODE: Formation/group movement around a center
 * Supports variants: shared, isobarycentric, centered, custom
 */
export class BarycentricStrategy implements MultiTrackStrategy {
  readonly name = 'barycentric' as const
  
  getTrackParameters(
    animation: Animation,
    track: Track,
    trackIndex: number,
    allTracks: Track[],
    variant: BarycentricVariant = 'isobarycentric'
  ): AnimationParameters {
    // Calculate or get center point (the barycenter)
    let center: Position
    if (variant === 'isobarycentric') {
      // Auto-calculate from track positions
      center = this.calculateBarycenter(allTracks)
    } else {
      // shared, centered, custom: all use user-defined center
      center = animation.customCenter || { x: 0, y: 0, z: 0 }
    }
    
    // Calculate track offset from barycenter based on variant
    let trackOffset: Position
    
    if (variant === 'shared') {
      // SHARED: All tracks at barycenter (zero offset)
      trackOffset = { x: 0, y: 0, z: 0 }
      
    } else if (variant === 'custom') {
      // CUSTOM: 3D Spherical arrangement at specified radius
      const radius = animation.customCenter?.radius ?? 5.0
      
      if (radius === 0) {
        // Radius 0 = same as shared (all at center)
        trackOffset = { x: 0, y: 0, z: 0 }
      } else {
        // Distribute tracks evenly on sphere surface using spherical coordinates
        // Using golden spiral algorithm for uniform distribution
        const trackCount = allTracks.length
        
        // Golden angle in radians
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ≈ 137.5°
        
        // Calculate spherical coordinates for this track
        // theta: azimuthal angle (around vertical axis)
        const theta = goldenAngle * trackIndex
        
        // phi: polar angle (from vertical axis)
        // Map track index to range [0, 1] then to [0, π]
        const y_normalized = 1 - (trackIndex / Math.max(1, trackCount - 1)) * 2 // Range: [1, -1]
        const phi = Math.acos(y_normalized)
        
        // Convert spherical to Cartesian coordinates
        const sinPhi = Math.sin(phi)
        trackOffset = {
          x: radius * sinPhi * Math.cos(theta),
          y: radius * Math.cos(phi),
          z: radius * sinPhi * Math.sin(theta)
        }
        
        console.log(`🎯 Custom spherical: Track ${trackIndex}/${trackCount} - theta: ${(theta * 180 / Math.PI).toFixed(1)}°, phi: ${(phi * 180 / Math.PI).toFixed(1)}°, offset:`, trackOffset)
      }
      
    } else {
      // ISOBARYCENTRIC or CENTERED: Preserve original offsets
      // Tracks maintain their relative positions from barycenter
      trackOffset = {
        x: track.position.x - center.x,
        y: track.position.y - center.y,
        z: track.position.z - center.z
      }
    }
    
    return {
      ...animation.parameters,
      _multiTrackMode: 'barycentric',
      _isobarycenter: variant === 'isobarycentric' ? center : undefined,
      _customCenter: (variant === 'centered' || variant === 'custom' || variant === 'shared') ? center : undefined,
      _trackOffset: trackOffset
    }
  }
  
  getPhaseOffset(trackIndex: number, globalPhaseOffset?: number): number {
    // Phase offset can be applied to barycentric mode
    return globalPhaseOffset ? trackIndex * globalPhaseOffset : 0
  }
  
  requiresPerTrackParameters(): boolean {
    return false
  }
  
  private calculateBarycenter(tracks: Track[]): Position {
    if (tracks.length === 0) return { x: 0, y: 0, z: 0 }
    
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
}

/**
 * RELATIVE MODE: Each track has own parameters relative to track.position
 * Replaces: position-relative, phase-offset-relative
 * Track position is passed to models via context.trackOffset
 */
export class RelativeStrategy implements MultiTrackStrategy {
  readonly name = 'relative' as const
  
  getTrackParameters(
    animation: Animation,
    track: Track,
    trackIndex: number
  ): AnimationParameters {
    // Use per-track parameters if available
    const trackParams = animation.multiTrackParameters?.[track.id]
    if (trackParams) {
      return {
        ...trackParams,
        _multiTrackMode: 'relative',
        _trackOffset: track.position  // Models use this to offset calculations
      }
    }
    
    // Fallback: use base params + track offset
    return {
      ...animation.parameters,
      _multiTrackMode: 'relative',
      _trackOffset: track.position
    }
  }
  
  getPhaseOffset(trackIndex: number, globalPhaseOffset?: number): number {
    // Phase offset can still be applied in relative mode
    return globalPhaseOffset ? trackIndex * globalPhaseOffset : 0
  }
  
  requiresPerTrackParameters(): boolean {
    return true
  }
}


/**
 * Factory to get strategy instance
 */
export function getMultiTrackStrategy(mode: MultiTrackMode): MultiTrackStrategy {
  switch (mode) {
    case 'relative':
      return new RelativeStrategy()
    case 'barycentric':
      return new BarycentricStrategy()
    default:
      console.warn(`Unknown mode: ${mode}, defaulting to relative`)
      return new RelativeStrategy()
  }
}

/**
 * Migration helper: Convert old modes to new 2-mode system
 */
export function migrateMultiTrackMode(oldMode: string | undefined): {
  mode: MultiTrackMode
  variant?: BarycentricVariant
} {
  switch (oldMode) {
    case 'identical':
    case 'phase-offset':
      return { mode: 'barycentric', variant: 'shared' }
    
    case 'centered':
      return { mode: 'barycentric', variant: 'centered' }
    
    case 'isobarycenter':
    case 'formation':
      return { mode: 'barycentric', variant: 'isobarycentric' }
    
    case 'position-relative':
    case 'phase-offset-relative':
    case 'per-track':
    case 'relative':
      return { mode: 'relative' }
    
    // Old 3-mode system compatibility
    case 'shared':
      return { mode: 'barycentric', variant: 'shared' }
    
    default:
      return { mode: 'relative' }  // Default to most flexible mode
  }
}
