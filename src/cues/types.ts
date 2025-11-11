import { Animation, Position } from '@/types'

/**
 * Live Show Control System - Cue Types
 * Professional cue system for live performances
 */

// ========================================
// CUE CORE
// ========================================

export interface Cue {
  id: string
  name: string
  number?: number              // Cue number (e.g., 1, 1.5, 2.0)
  category: CueCategory
  
  // Visual
  color: string               // Visual color in UI
  icon?: string               // Icon name
  thumbnail?: string          // Preview thumbnail
  
  // Description
  description?: string
  notes?: string             // Performance notes
  tags?: string[]
  
  // Status
  status: CueStatus
  isEnabled: boolean
  isLocked?: boolean
  
  // Execution
  action: CueAction
  targetType: CueTargetType
  targets: CueTarget[]
  
  // Parameters
  parameters: CueParameters
  
  // Timing
  duration?: number          // Duration in seconds
  fadeIn?: number           // Fade in time
  fadeOut?: number          // Fade out time
  
  // Triggers
  triggers: CueTrigger[]
  followActions?: FollowAction[]
  
  // Statistics
  lastTriggered?: Date
  triggerCount: number
  averageExecutionTime?: number
}

export type CueCategory = 
  | 'animation'
  | 'effect' 
  | 'lighting'
  | 'sound'
  | 'video'
  | 'control'
  | 'system'
  | 'user'

export type CueStatus = 
  | 'idle'
  | 'armed'
  | 'active'
  | 'paused'
  | 'complete'
  | 'error'

export type CueAction = 
  | 'play'
  | 'pause'
  | 'stop'
  | 'fade'
  | 'go'
  | 'jump'
  | 'trigger'
  | 'release'
  | 'toggle'

export type CueTargetType = 
  | 'animation'
  | 'track'
  | 'group'
  | 'timeline'
  | 'cue'
  | 'effect'
  | 'parameter'

// ========================================
// CUE TARGETS
// ========================================

export interface CueTarget {
  type: CueTargetType
  id: string                 // Target ID (animation, track, etc.)
  name?: string              // Display name
  
  // Override parameters
  parameterOverrides?: Record<string, any>
  
  // Transform
  positionOffset?: Position
  scaleMultiplier?: number
  rotationOffset?: number
}

// ========================================
// CUE PARAMETERS
// ========================================

export interface CueParameters {
  // Animation source (mutually exclusive)
  animationId?: string   // Saved animation (may have locked tracks)
  presetId?: string      // Preset template (requires track selection)
  animationParameters?: Record<string, any>
  
  // Playback parameters
  playbackSpeed?: number
  loop?: boolean
  pingPong?: boolean
  reverse?: boolean
  
  // Multi-track parameters
  trackIds?: string[]    // Required for presets, optional for unlocked animations
  multiTrackMode?: string
  phaseOffset?: number
  
  // Effect parameters
  effectType?: string
  effectIntensity?: number
  effectParameters?: Record<string, any>
  
  // Control parameters
  oscMessages?: OSCMessage[]
  midiMessages?: MIDIMessage[]
  dmxChannels?: DMXChannel[]
  
  // Custom parameters
  custom?: Record<string, any>
}

// ========================================
// CUE TRIGGERS
// ========================================

export interface CueTrigger {
  id: string
  type: CueTriggerType
  enabled: boolean
  
  // Trigger-specific data
  hotkey?: string           // Keyboard shortcut
  oscAddress?: string       // OSC trigger address
  midiNote?: number         // MIDI note number
  midiChannel?: number      // MIDI channel
  timecode?: string         // SMPTE timecode
  timelinePosition?: number // Timeline position in seconds
  
  // Conditions
  conditions?: TriggerCondition[]
  
  // Modifiers
  velocity?: boolean        // Use velocity for intensity
  exclusive?: boolean       // Stop other cues
  toggle?: boolean         // Toggle on/off
}

export type CueTriggerType = 
  | 'manual'
  | 'hotkey'
  | 'osc'
  | 'midi'
  | 'timecode'
  | 'timeline'
  | 'follow'
  | 'auto'

export interface TriggerCondition {
  type: 'time' | 'cue' | 'parameter' | 'expression'
  operator: 'equals' | 'greater' | 'less' | 'between' | 'contains'
  value: any
  target?: string
}

export interface FollowAction {
  type: 'go' | 'stop' | 'fade' | 'wait'
  targetCueId?: string
  delay?: number            // Delay in seconds
  condition?: TriggerCondition
}

// ========================================
// CUE LISTS & BANKS
// ========================================

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
  isArmed: boolean
}

// ========================================
// CUE EXECUTION
// ========================================

export interface CueExecution {
  id: string
  cueId: string
  startTime: Date
  endTime?: Date
  
  // State
  state: 'preparing' | 'running' | 'fading' | 'complete' | 'error'
  progress: number         // 0-1
  
  // Targets
  activeTargets: string[]
  
  // Error handling
  error?: string
  warnings?: string[]
}

export interface CueStack {
  id: string
  name: string
  
  // Stack of executing cues
  executions: CueExecution[]
  
  // Priority handling
  priority: 'fifo' | 'lifo' | 'priority'
  maxConcurrent: number
  
  // Behavior
  exclusive: boolean       // Only one cue at a time
  interruptible: boolean  // Can be interrupted
}

// ========================================
// EXTERNAL CONTROL
// ========================================

export interface OSCMessage {
  address: string
  args: any[]
  type?: string
}

export interface MIDIMessage {
  type: 'note' | 'cc' | 'program' | 'sysex'
  channel: number
  data1: number
  data2?: number
}

export interface DMXChannel {
  universe: number
  channel: number
  value: number           // 0-255
}

// ========================================
// CUE SETTINGS
// ========================================

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

// ========================================
// CUE TEMPLATES
// ========================================

export interface CueTemplate {
  id: string
  name: string
  category: CueCategory
  
  // Template data
  baseAction: CueAction
  defaultParameters: Partial<CueParameters>
  defaultTriggers: Partial<CueTrigger>[]
  
  // Visual
  icon: string
  color: string
  
  // Metadata
  author?: string
  version?: string
  tags?: string[]
}

// ========================================
// SHOW CONTROL
// ========================================

export interface Show {
  id: string
  name: string
  description?: string
  
  // Components
  cueLists: CueList[]
  cueBanks: CueBank[]
  cueStacks: CueStack[]
  
  // Current state
  activeCueListId?: string
  activeBankId?: string
  
  // Settings
  settings: CueSystemSettings
  
  // Timecode
  timecodeFormat?: 'SMPTE' | 'BPM' | 'Seconds'
  bpm?: number
  startTime?: number
  
  // Metadata
  created: Date
  modified: Date
  author?: string
  venue?: string
  notes?: string
}
