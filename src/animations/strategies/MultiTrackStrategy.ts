import { Track, Animation, AnimationParameters, Position } from '@/types'

/**
 * CLEAN ARCHITECTURE: Only 2 real modes + formation
 * - 'shared': All tracks use same parameters (absolute world coordinates)
 * - 'relative': Each track has own parameters (relative to track.position)
 * - 'formation': Barycenter-based rigid group movement
 */

export type MultiTrackMode = 'shared' | 'relative' | 'formation'

export interface MultiTrackStrategy {
  readonly name: MultiTrackMode
  
  /**
   * Get parameters for a specific track
   */
  getTrackParameters(
    animation: Animation,
    track: Track,
    trackIndex: number,
    allTracks: Track[]
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
 * SHARED MODE: All tracks use same parameters (absolute world coordinates)
 * Replaces: identical, centered (center is just a param), phase-offset
 */
export class SharedStrategy implements MultiTrackStrategy {
  readonly name = 'shared' as const
  
  getTrackParameters(animation: Animation): AnimationParameters {
    // All tracks use the same base parameters
    return animation.parameters
  }
  
  getPhaseOffset(trackIndex: number, globalPhaseOffset?: number): number {
    // If phaseOffset is set, apply it
    return globalPhaseOffset ? trackIndex * globalPhaseOffset : 0
  }
  
  requiresPerTrackParameters(): boolean {
    return false
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
        _trackOffset: track.position  // Models use this to offset calculations
      }
    }
    
    // Fallback: use base params + track offset
    return {
      ...animation.parameters,
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
 * FORMATION MODE: Barycenter-based rigid group movement
 * Replaces: isobarycenter
 * Animation applies to group center, tracks maintain relative positions
 */
export class FormationStrategy implements MultiTrackStrategy {
  readonly name = 'formation' as const
  
  getTrackParameters(
    animation: Animation,
    track: Track,
    trackIndex: number,
    allTracks: Track[]
  ): AnimationParameters {
    // Calculate barycenter
    const barycenter = this.calculateBarycenter(allTracks)
    
    // Track maintains its offset from barycenter
    const relativeOffset = {
      x: track.position.x - barycenter.x,
      y: track.position.y - barycenter.y,
      z: track.position.z - barycenter.z
    }
    
    return {
      ...animation.parameters,
      _isobarycenter: barycenter,
      _trackOffset: relativeOffset
    }
  }
  
  getPhaseOffset(trackIndex: number): number {
    // Formation requires synchronized movement
    return 0
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
 * Factory to get strategy instance
 */
export function getMultiTrackStrategy(mode: MultiTrackMode): MultiTrackStrategy {
  switch (mode) {
    case 'shared':
      return new SharedStrategy()
    case 'relative':
      return new RelativeStrategy()
    case 'formation':
      return new FormationStrategy()
    default:
      console.warn(`Unknown mode: ${mode}, defaulting to shared`)
      return new SharedStrategy()
  }
}

/**
 * Migration helper: Convert old 6 modes to new 3 modes
 */
export function migrateMultiTrackMode(oldMode: string | undefined): MultiTrackMode {
  switch (oldMode) {
    case 'identical':
    case 'centered':
    case 'phase-offset':
      return 'shared'
    
    case 'position-relative':
    case 'phase-offset-relative':
    case 'per-track':
      return 'relative'
    
    case 'isobarycenter':
    case 'formation':
      return 'formation'
    
    default:
      return 'relative'  // Default to most flexible mode
  }
}
