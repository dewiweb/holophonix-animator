import { BaseCue } from './baseCue'

/**
 * Animation Cue Type
 * 
 * Executes a stored animation with all its parameters.
 * Supports both locked animations (with embedded tracks) and 
 * unlocked animations (can override tracks).
 */
export interface AnimationCue extends BaseCue {
  type: 'animation'
  data: AnimationCueData
}

/**
 * Animation Cue Data
 */
export interface AnimationCueData {
  // Animation reference
  animationId: string           // Reference to stored animation in library
  
  // Track override (for unlocked animations)
  trackIds?: string[]           // Override tracks if animation is unlocked
  
  // Playback overrides
  playbackSpeed?: number        // Override speed (default: 1.0)
  loop?: boolean                // Override loop setting
  reverse?: boolean             // Override direction
  
  // Cue-specific parameter overrides
  // These are stored only in the cue, not in the library animation
  cueSpecificParams?: CueSpecificParameters
}

/**
 * Cue-Specific Parameters
 * 
 * When editing an animation from a cue and choosing "Save to Cue Only",
 * these parameters override the library animation's parameters for this cue only.
 */
export interface CueSpecificParameters {
  // Parameter overrides
  parameters?: Record<string, any>  // Specific animation parameters
  
  // Timing overrides
  duration?: number
  fadeIn?: number
  fadeOut?: number
  
  // Multi-track overrides (for formation mode)
  multiTrackMode?: string
  barycentricVariant?: string
  customCenter?: { x: number; y: number; z: number }
  phaseOffset?: number
  
  // Metadata
  lastEditedAt?: Date
  editedBy?: string
  editNotes?: string
}

/**
 * Animation Cue Display Info
 * Used for rendering cue button UI
 */
export interface AnimationCueDisplayInfo {
  animationName: string
  animationIcon?: string
  trackCount: number
  trackNames: string[]          // Track names for display
  isLocked: boolean             // Whether animation has locked tracks
  hasOverrides: boolean         // Whether cue has specific overrides
  estimatedDuration?: number    // Expected duration in seconds
}

/**
 * Animation Cue Save Mode
 * Options when saving an edited animation from a cue
 */
export type AnimationCueSaveMode = 
  | 'cue-only'              // Save to cue only, don't modify library
  | 'update-library'        // Update the library animation (affects all cues)
  | 'save-as-new'          // Create new library animation

/**
 * Animation Cue Edit Context
 * Passed to animation editor when editing from a cue
 */
export interface AnimationCueEditContext {
  cueId: string
  cueName: string
  animationId: string
  hasOverrides: boolean
  trackIds?: string[]
  currentOverrides?: CueSpecificParameters
}

/**
 * Helper functions
 */

/**
 * Check if an animation cue can have its tracks overridden
 */
export function canOverrideTracks(cue: AnimationCue, animationLocked: boolean): boolean {
  return !animationLocked
}

/**
 * Get effective parameters for an animation cue
 * Merges library animation params with cue-specific overrides
 */
export function getEffectiveParameters(
  libraryParams: Record<string, any>,
  cueOverrides?: CueSpecificParameters
): Record<string, any> {
  if (!cueOverrides?.parameters) {
    return libraryParams
  }
  
  return {
    ...libraryParams,
    ...cueOverrides.parameters
  }
}

/**
 * Get display info for an animation cue
 */
export function getAnimationCueDisplayInfo(
  cue: AnimationCue,
  animationName: string,
  trackNames: string[],
  isLocked: boolean
): AnimationCueDisplayInfo {
  return {
    animationName,
    animationIcon: cue.icon,
    trackCount: cue.data.trackIds?.length || trackNames.length,
    trackNames,
    isLocked,
    hasOverrides: !!cue.data.cueSpecificParams,
    estimatedDuration: cue.duration
  }
}
