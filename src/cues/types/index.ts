/**
 * Cue System Types - v2.0
 * 
 * Modular cue system with three main cue types:
 * - Animation: Execute stored animations
 * - OSC: Send direct OSC messages
 * - Position: Recall position presets with transitions
 * 
 * Major changes from v1:
 * - Removed arming system
 * - Removed preset-based cues (merged into animation cues)
 * - Removed reset cues (replaced by position presets)
 * - Modular architecture with type-specific data structures
 * - Enhanced edit workflow for animation cues
 */

// Base types
export * from './baseCue'

// Cue types
export * from './animationCue'
export * from './oscCue'
export * from './positionCue'

// Import for union type
import { AnimationCue } from './animationCue'
import { OSCCue } from './oscCue'
import { PositionCue } from './positionCue'
import { BaseCue } from './baseCue'

/**
 * Unified Cue Type
 * Union of all cue types
 */
export type Cue = AnimationCue | OSCCue | PositionCue

/**
 * Cue Category (for organization)
 */
export type CueCategory = 
  | 'animation'
  | 'effect' 
  | 'lighting'
  | 'sound'
  | 'video'
  | 'control'
  | 'system'
  | 'user'

/**
 * Cue Lists & Banks
 */
export interface CueList {
  id: string
  name: string
  description?: string
  
  // Cues
  cues: Cue[]
  cueOrder: string[]        // Ordered cue IDs
  
  // Playback
  currentCueId?: string
  nextCueId?: string
  
  // Settings
  autoFollow: boolean
  loop: boolean
  timecodeSync: boolean
  
  // Visual
  color?: string
  icon?: string
}

export interface CueBank {
  id: string
  name: string
  label: string            // Display label (A, B, C, etc.)
  
  // Grid layout
  rows: number
  columns: number
  
  // Cue slots
  slots: CueSlot[]
  
  // Visual
  color?: string
  isActive: boolean
}

export interface CueSlot {
  row: number
  column: number
  cueId?: string           // Empty slot if undefined
  
  // Visual override
  color?: string
  label?: string
  icon?: string
  
  // State
  isEmpty: boolean
  isActive: boolean
}

/**
 * Show - Top-level container
 */
export interface Show {
  id: string
  name: string
  
  // Collections
  cueLists: CueList[]
  cueBanks: CueBank[]
  cueStacks: import('./baseCue').CueStack[]
  
  // Active selections
  activeBankId?: string
  activeCueListId?: string
  
  // Settings
  settings: CueSystemSettings
  
  // Metadata
  created: Date
  modified: Date
}

/**
 * Cue System Settings
 */
export interface CueSystemSettings {
  // Grid
  gridSize: { rows: number; columns: number }
  defaultBank: string
  
  // Playback
  defaultFadeTime: number
  defaultHoldTime: number
  safeMode: boolean       // Require confirmation
  
  // Visual
  showThumbnails: boolean
  showNumbers: boolean
  showStatus: boolean
  compactMode: boolean
  
  // Control
  enableOSC: boolean
  enableMIDI: boolean
  enableDMX: boolean
  enableTimecode: boolean
  
  // Performance
  preloadCues: boolean
  cacheSize: number
  maxConcurrentCues: number
}

/**
 * Cue Template
 */
export interface CueTemplate {
  id: string
  name: string
  category: CueCategory
  
  // Template data
  baseCue: Partial<BaseCue>
  
  // Visual
  icon: string
  color: string
  
  // Metadata
  author?: string
  version?: string
  tags?: string[]
}

/**
 * Type Guards
 */

export function isAnimationCue(cue: Cue): cue is AnimationCue {
  return cue.type === 'animation'
}

export function isOSCCue(cue: Cue): cue is OSCCue {
  return cue.type === 'osc'
}

export function isPositionCue(cue: Cue): cue is PositionCue {
  return cue.type === 'position'
}

/**
 * Helper Functions
 */

/**
 * Get cue by ID from show
 */
export function getCueById(show: Show, cueId: string): Cue | undefined {
  for (const list of show.cueLists) {
    const cue = list.cues.find(c => c.id === cueId)
    if (cue) return cue
  }
  return undefined
}

/**
 * Get cue display color
 */
export function getCueDisplayColor(cue: Cue): string {
  // Custom color takes precedence
  if (cue.color) return cue.color
  
  // Default colors by type
  switch (cue.type) {
    case 'animation': return '#3B82F6'  // Blue
    case 'osc': return '#8B5CF6'        // Purple
    case 'position': return '#10B981'   // Green
    default: return '#6B7280'           // Gray
  }
}

/**
 * Get cue icon
 */
export function getCueIcon(cue: Cue): string {
  // Custom icon takes precedence
  if (cue.icon) return cue.icon
  
  // Default icons by type
  switch (cue.type) {
    case 'animation': return 'Play'
    case 'osc': return 'Radio'
    case 'position': return 'Home'
    default: return 'Circle'
  }
}

/**
 * Validate cue based on type
 */
export function validateCue(cue: Cue): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Base validation
  if (!cue.id) errors.push('Cue ID is required')
  if (!cue.name) errors.push('Cue name is required')
  if (!cue.type) errors.push('Cue type is required')
  
  // Type-specific validation
  switch (cue.type) {
    case 'animation':
      if (!cue.data.animationId) {
        errors.push('Animation ID is required for animation cue')
      }
      break
    
    case 'osc':
      if (!cue.data.messages || cue.data.messages.length === 0) {
        errors.push('At least one OSC message is required')
      }
      break
    
    case 'position':
      if (!cue.data.presetId) {
        errors.push('Preset ID is required for position cue')
      }
      break
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create default cue of specified type
 */
export function createDefaultCue(type: 'animation' | 'osc' | 'position'): Partial<Cue> {
  const base: Partial<BaseCue> = {
    name: `New ${type} cue`,
    type,
    color: getCueDisplayColor({ type } as Cue),
    status: 'idle',
    isEnabled: true,
    triggers: [],
    created: new Date(),
    modified: new Date(),
    triggerCount: 0
  }
  
  switch (type) {
    case 'animation':
      return {
        ...base,
        type: 'animation',
        data: {
          animationId: '',
          playbackSpeed: 1.0
        }
      } as Partial<AnimationCue>
    
    case 'osc':
      return {
        ...base,
        type: 'osc',
        data: {
          messages: [],
          sendMode: 'sequential'
        }
      } as Partial<OSCCue>
    
    case 'position':
      return {
        ...base,
        type: 'position',
        data: {
          presetId: '',
          transition: {
            duration: 2.0,
            easing: 'ease-in-out',
            mode: 'cartesian'
          },
          interruptAnimations: true
        }
      } as Partial<PositionCue>
  }
}
