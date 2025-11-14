import { BaseCue } from './baseCue'
import { Position } from '@/types'

/**
 * Reset Cue Type
 * 
 * Returns tracks to initial positions.
 * Supports different reset modes and configurable fade times.
 */
export interface ResetCue extends BaseCue {
  type: 'reset'
  data: ResetCueData
}

/**
 * Reset Cue Data
 */
export interface ResetCueData {
  // Tracks to reset
  trackIds: string[]
  
  // Reset mode
  resetType: ResetType
  
  // Custom positions (only for 'custom' type)
  customPositions?: Record<string, Position>  // trackId -> position
  
  // Animation settings
  duration?: number            // Fade time to position (seconds)
  easing?: EasingFunction      // Easing function for transition
  
  // Options
  resetGain?: boolean          // Also reset gain to initial
  resetColor?: boolean         // Also reset color to initial
  resetName?: boolean          // Also reset name to initial
  
  // Behavior
  interruptAnimations?: boolean  // Stop running animations on these tracks
  waitForCompletion?: boolean    // Wait until reset completes before allowing new cues
}

/**
 * Reset Type
 */
export type ResetType = 
  | 'initial'     // Return to initial position from project
  | 'zero'        // Return to origin (0, 0, 0)
  | 'custom'      // Return to custom positions
  | 'snapshot'    // Return to saved snapshot position

/**
 * Easing Function Types
 */
export type EasingFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'

/**
 * Reset Cue Display Info
 */
export interface ResetCueDisplayInfo {
  resetType: ResetType
  trackCount: number
  trackNames: string[]
  hasDuration: boolean
  willInterrupt: boolean
}

/**
 * Reset Target - Information about a single track's reset
 */
export interface ResetTarget {
  trackId: string
  trackName: string
  currentPosition: Position
  targetPosition: Position
  distance: number           // Distance to travel
}

/**
 * Helper functions
 */

/**
 * Get target position for a track based on reset type
 */
export function getResetTargetPosition(
  trackId: string,
  resetType: ResetType,
  options: {
    initialPositions?: Record<string, Position>
    customPositions?: Record<string, Position>
    snapshotPositions?: Record<string, Position>
  }
): Position | null {
  switch (resetType) {
    case 'initial':
      return options.initialPositions?.[trackId] || null
    
    case 'zero':
      return { x: 0, y: 0, z: 0 }
    
    case 'custom':
      return options.customPositions?.[trackId] || null
    
    case 'snapshot':
      return options.snapshotPositions?.[trackId] || null
    
    default:
      return null
  }
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  const dz = pos2.z - pos1.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Get display info for a reset cue
 */
export function getResetCueDisplayInfo(
  cue: ResetCue,
  trackNames: string[]
): ResetCueDisplayInfo {
  return {
    resetType: cue.data.resetType,
    trackCount: cue.data.trackIds.length,
    trackNames,
    hasDuration: (cue.data.duration || 0) > 0,
    willInterrupt: cue.data.interruptAnimations || false
  }
}

/**
 * Validate reset cue data
 */
export function validateResetCue(cue: ResetCue): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check tracks
  if (!cue.data.trackIds || cue.data.trackIds.length === 0) {
    errors.push('No tracks selected for reset')
  }
  
  // Check custom positions if custom type
  if (cue.data.resetType === 'custom') {
    if (!cue.data.customPositions) {
      errors.push('Custom reset type requires custom positions')
    } else {
      // Verify all tracks have custom positions
      const missingTracks = cue.data.trackIds.filter(
        trackId => !cue.data.customPositions![trackId]
      )
      if (missingTracks.length > 0) {
        errors.push(`Missing custom positions for tracks: ${missingTracks.join(', ')}`)
      }
    }
  }
  
  // Validate duration
  if (cue.data.duration !== undefined && cue.data.duration < 0) {
    errors.push('Duration cannot be negative')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create reset targets for execution
 */
export function createResetTargets(
  cue: ResetCue,
  currentPositions: Record<string, Position>,
  options: {
    initialPositions?: Record<string, Position>
    snapshotPositions?: Record<string, Position>
  }
): ResetTarget[] {
  const targets: ResetTarget[] = []
  
  for (const trackId of cue.data.trackIds) {
    const currentPos = currentPositions[trackId]
    if (!currentPos) continue
    
    const targetPos = getResetTargetPosition(trackId, cue.data.resetType, {
      initialPositions: options.initialPositions,
      customPositions: cue.data.customPositions,
      snapshotPositions: options.snapshotPositions
    })
    
    if (!targetPos) continue
    
    targets.push({
      trackId,
      trackName: trackId, // Will be replaced with actual name in execution
      currentPosition: currentPos,
      targetPosition: targetPos,
      distance: calculateDistance(currentPos, targetPos)
    })
  }
  
  return targets
}

/**
 * Easing function implementations
 */
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  'linear': (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-cubic': (t: number) => t * t * t,
  'ease-out-cubic': (t: number) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  'ease-in-expo': (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  'ease-out-expo': (t: number) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
  'ease-in-out-expo': (t: number) => {
    if (t === 0 || t === 1) return t
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
    return (2 - Math.pow(2, -20 * t + 10)) / 2
  }
}

/**
 * Apply easing to a value
 */
export function applyEasing(
  progress: number,
  easingFunction: EasingFunction
): number {
  const fn = EASING_FUNCTIONS[easingFunction]
  return fn ? fn(progress) : progress
}
