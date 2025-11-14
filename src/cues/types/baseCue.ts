import { Position } from '@/types'

/**
 * Base Cue Interface
 * All cue types extend this base
 */
export interface BaseCue {
  id: string
  name: string
  type: CueType
  
  // Visual
  color: string              // User-selectable color
  number?: number            // Optional cue number (1, 1.5, 2.0)
  icon?: string             // Optional icon override
  
  // Status
  status: CueStatus
  isEnabled: boolean
  
  // Triggers
  triggers: CueTrigger[]
  followActions?: FollowAction[]
  
  // Timing (optional per type)
  duration?: number
  fadeIn?: number
  fadeOut?: number
  
  // Metadata
  description?: string
  tags?: string[]
  readonly created: Date
  modified: Date
  lastTriggered?: Date
  triggerCount: number
}

/**
 * Cue Types
 */
export type CueType = 'animation' | 'osc' | 'reset'

/**
 * Cue Status
 */
export type CueStatus = 
  | 'idle'
  | 'active'
  | 'complete'
  | 'error'

/**
 * Cue Trigger Configuration
 */
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

/**
 * Follow Action - Execute action after cue
 */
export interface FollowAction {
  type: 'go' | 'stop' | 'fade' | 'wait'
  targetCueId?: string
  delay?: number            // Delay in seconds
  condition?: TriggerCondition
}

/**
 * Cue Execution State
 */
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

/**
 * Cue Stack - Manages executing cues
 */
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

/**
 * External Control Messages
 */
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
