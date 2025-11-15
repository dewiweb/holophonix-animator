/**
 * Position Cue Type
 * 
 * Recalls position presets with smooth transitions.
 * Integrates with cuelist system for scene management.
 */

import { BaseCue } from './baseCue'
import {
  PositionTransition,
  PresetBlend,
  TrackFilter,
  PositionPreset,
  PresetValidation,
  TransitionTarget
} from '@/types/positionPreset'
import { Position } from '@/types'

// ========================================
// POSITION CUE
// ========================================

/**
 * Position Cue
 * Recalls a position preset with interpolation
 */
export interface PositionCue extends BaseCue {
  type: 'position'
  data: PositionCueData
}

/**
 * Position Cue Data
 * Configuration for position recall
 */
export interface PositionCueData {
  // Preset reference
  presetId: string                    // Reference to position preset
  
  // Target tracks (optional override)
  trackIds?: string[]                 // If undefined, use all tracks from preset
  trackFilter?: TrackFilter           // Dynamic track selection
  
  // Transition settings
  transition: PositionTransition
  
  // Blend settings (for multi-preset morphing)
  blend?: PresetBlend
  
  // Behavior
  interruptAnimations?: boolean       // Stop animations on target tracks
  waitForCompletion?: boolean         // Block until transition completes
  resumeAfterwards?: boolean          // Resume animations after transition
  
  // Coordinate system override
  coordinateSystem?: 'xyz' | 'aed'
  
  // Safety
  respectBounds?: boolean             // Clip positions to safe bounds
  maxSpeed?: number                   // Max track velocity (m/s)
  validateBeforeApply?: boolean       // Run validation before execution
  
  // Advanced
  relativeToCurrentPositions?: boolean  // Apply as offset from current positions
  preserveRelativeDistances?: boolean   // Maintain track spacing
}

// ========================================
// DISPLAY & UI
// ========================================

/**
 * Position Cue Display Info
 * Information for rendering cue UI
 */
export interface PositionCueDisplayInfo {
  presetName: string
  presetCategory?: string
  trackCount: number
  trackNames: string[]
  
  // Transition summary
  transitionDuration: number
  transitionMode: string
  hasStagger: boolean
  
  // Safety
  isValid: boolean
  warnings: string[]
}

/**
 * Position Cue Icon
 * Visual representation in cue grid
 */
export interface PositionCueIcon {
  type: 'preset' | 'blend' | 'relative'
  color: string
  label?: string
  categoryIcon?: string
}

// ========================================
// EXECUTION
// ========================================

/**
 * Position Cue Execution State
 * Runtime state during cue execution
 */
export interface PositionCueExecution {
  cueId: string
  startTime: Date
  endTime?: Date
  
  // Progress
  state: PositionExecutionState
  progress: number                    // 0-1
  
  // Targets
  targets: TransitionTarget[]
  activeTrackIds: string[]
  
  // Interruptions
  interruptedAnimations: string[]     // Animation IDs that were stopped
  
  // Error handling
  error?: string
  warnings?: string[]
  
  // Performance
  frameCount: number
  lastUpdateTime: Date
}

export type PositionExecutionState = 
  | 'preparing'      // Loading preset, validating
  | 'interrupting'   // Stopping animations
  | 'transitioning'  // Moving tracks
  | 'completing'     // Finalizing
  | 'complete'       // Finished
  | 'error'          // Failed

/**
 * Position Update Event
 * Emitted during transition for tracking progress
 */
export interface PositionUpdateEvent {
  cueId: string
  trackId: string
  position: Position
  progress: number
  timestamp: Date
}

// ========================================
// VALIDATION
// ========================================

/**
 * Position Cue Validation
 * Validates cue before execution
 */
export interface PositionCueValidationResult extends PresetValidation {
  // Cue-specific checks
  cueChecks: {
    presetExists: boolean
    tracksExist: boolean
    transitionValid: boolean
    noConflicts: boolean
  }
  
  // Track-specific issues
  missingTracks: string[]
  conflictingCues: string[]
}

/**
 * Validate position cue
 */
export function validatePositionCue(
  cue: PositionCue,
  preset: PositionPreset | null,
  availableTrackIds: string[]
): PositionCueValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check preset exists
  const presetExists = preset !== null
  if (!presetExists) {
    errors.push(`Preset not found: ${cue.data.presetId}`)
  }
  
  // Check tracks
  const targetTrackIds = cue.data.trackIds || preset?.trackIds || []
  const missingTracks = targetTrackIds.filter(id => !availableTrackIds.includes(id))
  if (missingTracks.length > 0) {
    warnings.push(`Missing tracks: ${missingTracks.join(', ')}`)
  }
  
  const tracksExist = missingTracks.length === 0
  
  // Validate transition
  const transitionValid = validateTransition(cue.data.transition)
  if (!transitionValid) {
    errors.push('Invalid transition configuration')
  }
  
  // Check for conflicts (placeholder - would check against other running cues)
  const noConflicts = true
  const conflictingCues: string[] = []
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    safetyChecks: {
      boundsCheck: true,  // Would perform actual bounds check
      collisionCheck: true,
      velocityCheck: true
    },
    cueChecks: {
      presetExists,
      tracksExist,
      transitionValid,
      noConflicts
    },
    missingTracks,
    conflictingCues
  }
}

function validateTransition(transition: PositionTransition): boolean {
  if (transition.duration < 0) return false
  if (transition.stagger?.enabled && transition.stagger.delay < 0) return false
  return true
}

// ========================================
// HELPERS
// ========================================

/**
 * Get display info for position cue
 */
export function getPositionCueDisplayInfo(
  cue: PositionCue,
  preset: PositionPreset | null,
  trackNames: Record<string, string>
): PositionCueDisplayInfo {
  const targetTrackIds = cue.data.trackIds || preset?.trackIds || []
  const names = targetTrackIds.map(id => trackNames[id] || id)
  
  return {
    presetName: preset?.name || 'Unknown Preset',
    presetCategory: preset?.category,
    trackCount: targetTrackIds.length,
    trackNames: names,
    transitionDuration: cue.data.transition.duration,
    transitionMode: cue.data.transition.mode,
    hasStagger: cue.data.transition.stagger?.enabled || false,
    isValid: preset !== null,
    warnings: preset ? [] : ['Preset not found']
  }
}

/**
 * Create position cue from preset
 */
export function createPositionCueFromPreset(
  preset: PositionPreset,
  options: Partial<PositionCueData> = {}
): Omit<PositionCue, 'id' | 'created' | 'modified' | 'triggerCount'> {
  return {
    name: `Recall: ${preset.name}`,
    type: 'position',
    color: getCategoryColor(preset.category),
    status: 'idle',
    isEnabled: true,
    triggers: [{ id: 'default', type: 'manual', enabled: true }],
    data: {
      presetId: preset.id,
      transition: {
        duration: 2.0,
        easing: 'ease-in-out',
        mode: 'cartesian'
      },
      interruptAnimations: false,
      waitForCompletion: true,
      respectBounds: true,
      validateBeforeApply: true,
      ...options
    }
  }
}

/**
 * Get color for preset category
 */
function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    scene: '#4A90E2',      // Blue
    formation: '#50C878',   // Green
    effect: '#9B59B6',      // Purple
    safety: '#E74C3C',      // Red
    custom: '#95A5A6'       // Gray
  }
  return colors[category || 'custom'] || colors.custom
}

// ========================================
// PRESET MORPHING
// ========================================

/**
 * Morphing Cue
 * Smoothly blend between multiple presets over time
 */
export interface MorphingCue extends PositionCue {
  data: PositionCueData & {
    morph: MorphConfiguration
  }
}

export interface MorphConfiguration {
  // Timeline of preset weights
  keyframes: MorphKeyframe[]
  
  // Behavior
  smoothing: number                   // 0-1, how smooth the morph is
  autoCalculateTimings: boolean       // Auto-space keyframes evenly
}

export interface MorphKeyframe {
  time: number                        // Time in seconds (relative to cue start)
  presetWeights: Record<string, number>  // presetId -> weight (0-1)
  easing?: string                     // Easing to next keyframe
}

/**
 * Calculate interpolated position during morph
 */
export function calculateMorphPosition(
  trackId: string,
  time: number,
  morph: MorphConfiguration,
  presets: Map<string, PositionPreset>
): Position | null {
  // Find surrounding keyframes
  const keyframes = morph.keyframes.sort((a, b) => a.time - b.time)
  let prevKeyframe = keyframes[0]
  let nextKeyframe = keyframes[keyframes.length - 1]
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      prevKeyframe = keyframes[i]
      nextKeyframe = keyframes[i + 1]
      break
    }
  }
  
  // Calculate interpolation factor
  const duration = nextKeyframe.time - prevKeyframe.time
  const elapsed = time - prevKeyframe.time
  const t = duration > 0 ? elapsed / duration : 0
  
  // Blend positions based on weights
  let blendedPosition: Position = { x: 0, y: 0, z: 0 }
  let totalWeight = 0
  
  Object.entries(prevKeyframe.presetWeights).forEach(([presetId, startWeight]) => {
    const endWeight = nextKeyframe.presetWeights[presetId] || 0
    const currentWeight = startWeight + (endWeight - startWeight) * t
    
    const preset = presets.get(presetId)
    if (!preset) return
    
    const pos = preset.positions[trackId]
    if (!pos) return
    
    blendedPosition.x += pos.x * currentWeight
    blendedPosition.y += pos.y * currentWeight
    blendedPosition.z += pos.z * currentWeight
    totalWeight += currentWeight
  })
  
  // Normalize if weights don't sum to 1
  if (totalWeight > 0 && Math.abs(totalWeight - 1.0) > 0.01) {
    blendedPosition.x /= totalWeight
    blendedPosition.y /= totalWeight
    blendedPosition.z /= totalWeight
  }
  
  return totalWeight > 0 ? blendedPosition : null
}

// ========================================
// ADVANCED FEATURES
// ========================================

/**
 * Conditional Position Cue
 * Apply different presets based on runtime conditions
 */
export interface ConditionalPositionCue extends PositionCue {
  data: PositionCueData & {
    conditions: PresetCondition[]
    fallbackPresetId: string
  }
}

export interface PresetCondition {
  check: ConditionType
  operator: 'equals' | 'greater' | 'less' | 'contains'
  value: any
  presetId: string                    // Use this preset if condition matches
}

export type ConditionType = 
  | 'track-count'
  | 'track-type'
  | 'project-setting'
  | 'time-of-day'
  | 'cue-number'
  | 'custom'

/**
 * Evaluate condition
 */
export function evaluatePresetCondition(
  condition: PresetCondition,
  context: Record<string, any>
): boolean {
  const contextValue = context[condition.check]
  
  switch (condition.operator) {
    case 'equals':
      return contextValue === condition.value
    case 'greater':
      return contextValue > condition.value
    case 'less':
      return contextValue < condition.value
    case 'contains':
      return String(contextValue).includes(String(condition.value))
    default:
      return false
  }
}

/**
 * Resolve conditional preset
 */
export function resolveConditionalPreset(
  cue: ConditionalPositionCue,
  context: Record<string, any>
): string {
  for (const condition of cue.data.conditions) {
    if (evaluatePresetCondition(condition, context)) {
      return condition.presetId
    }
  }
  return cue.data.fallbackPresetId
}
