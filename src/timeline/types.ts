import { Animation, Position } from '@/types'

/**
 * Advanced Timeline System Types
 * Professional DAW-style timeline with multi-track support
 */

// ========================================
// TIMELINE CORE
// ========================================

export interface Timeline {
  id: string
  name: string
  
  // Time configuration
  duration: number  // in seconds
  frameRate: number // for frame-accurate editing
  timeFormat: 'timecode' | 'bars-beats' | 'seconds'
  
  // Tracks (vertical layers)
  tracks: TimelineTrack[]
  
  // Global settings
  viewSettings: TimelineViewSettings
  
  // Markers and regions
  markers: TimelineMarker[]
  regions: TimelineRegion[]
  
  // Transport
  transport: TimelineTransport
  
  // Linked show control (optional)
  showId?: string
  cueListId?: string
  
  // Metadata
  created: Date
  modified: Date
  author?: string
  description?: string
}

// ========================================
// TIMELINE TRACKS
// ========================================

export type TimelineTrackType = 
  | 'animation'    // Animation clips
  | 'effect'       // Effect automation
  | 'group'        // Group/folder track
  | 'automation'   // Parameter automation
  | 'cue'          // Cue triggers
  | 'timecode'     // Timecode reference
  | 'marker'       // Marker track

export interface TimelineTrack {
  id: string
  name: string
  type: TimelineTrackType
  
  // Track visibility and behavior
  isMuted: boolean
  isSoloed: boolean
  isLocked: boolean
  isCollapsed: boolean
  isVisible: boolean
  
  // Track items (clips, automation points, etc.)
  items: TimelineItem[]
  
  // Track-specific settings
  height: number      // Track height in pixels
  color: string       // Track color for visual identification
  opacity: number     // Track opacity (0-1)
  
  // For group tracks
  children?: string[] // IDs of child tracks
  parentId?: string   // For nested tracks
  
  // Track-specific data
  linkedTrackIds?: string[]  // Linked audio track IDs
  automationTargets?: AutomationTarget[] // What this track automates
}

// ========================================
// TIMELINE ITEMS
// ========================================

export type TimelineItemType = 
  | 'clip'         // Animation or effect clip
  | 'automation'   // Automation point/curve
  | 'marker'       // Position marker
  | 'cue'          // Cue trigger
  | 'region'       // Time region

export interface TimelineItem {
  id: string
  type: TimelineItemType
  trackId: string
  
  // Timing
  startTime: number    // Start time in seconds
  duration: number     // Duration in seconds (0 for instant)
  
  // Common properties
  name?: string
  color?: string
  locked?: boolean
  
  // Type-specific data
  clipData?: ClipData
  automationData?: AutomationData
  cueData?: CueData
  markerData?: MarkerData
  
  // Fades and transitions
  fadeIn?: number      // Fade in duration
  fadeOut?: number     // Fade out duration
  transition?: ClipTransition
}

// ========================================
// CLIP DATA
// ========================================

export interface ClipData {
  // Source
  animationId?: string      // Reference to animation
  sourceOffset?: number     // Offset within source
  playbackRate?: number     // Speed multiplier
  
  // Multi-track
  targetTrackIds?: string[] // Which tracks to animate
  multiTrackMode?: string   // Multi-track mode for this clip
  
  // Parameters
  parameterOverrides?: Record<string, any> // Override animation parameters
  
  // Loop settings
  loop?: boolean
  loopCount?: number
  pingPong?: boolean
  
  // Clip-specific transforms
  position?: Position       // Position offset
  scale?: number           // Scale factor
  rotation?: number        // Rotation in degrees
}

export interface ClipTransition {
  type: 'crossfade' | 'dip' | 'wipe' | 'custom'
  duration: number
  curve?: string           // Easing curve
  parameters?: Record<string, any>
}

// ========================================
// AUTOMATION
// ========================================

export interface AutomationTarget {
  type: 'track' | 'animation' | 'effect' | 'global'
  targetId: string
  parameter: string       // Parameter path (e.g., 'position.x')
}

export interface AutomationData {
  target: AutomationTarget
  points: AutomationPoint[]
  mode: 'linear' | 'bezier' | 'step' | 'hold'
  
  // Range
  minValue?: number
  maxValue?: number
  defaultValue?: number
}

export interface AutomationPoint {
  time: number           // Time in seconds
  value: number          // Parameter value
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier'
  
  // Bezier control points
  controlIn?: { x: number; y: number }
  controlOut?: { x: number; y: number }
}

// ========================================
// CUE INTEGRATION
// ========================================

export interface CueData {
  cueId: string          // Reference to cue in library
  triggerType: 'timecode' | 'manual' | 'follow' | 'osc' | 'midi'
  
  // Trigger conditions
  triggerTime?: number   // For timecode trigger
  followDelay?: number   // Delay after previous cue
  oscAddress?: string    // OSC trigger address
  midiNote?: number      // MIDI note trigger
  
  // Execution
  action: 'play' | 'pause' | 'stop' | 'go' | 'fade'
  fadeTime?: number
  
  // Pre/post wait
  preWait?: number       // Wait before execution
  postWait?: number      // Wait after execution
}

// ========================================
// MARKERS & REGIONS
// ========================================

export interface TimelineMarker {
  id: string
  time: number           // Time in seconds
  name: string
  color?: string
  type?: 'generic' | 'cue' | 'section' | 'loop'
  
  // Actions
  actions?: MarkerAction[]
}

export interface TimelineRegion {
  id: string
  startTime: number
  endTime: number
  name: string
  color?: string
  
  // Loop region
  isLoopRegion?: boolean
  
  // Punch in/out
  isPunchRegion?: boolean
  
  // Section marker
  sectionNumber?: number
  sectionName?: string
}

export interface MarkerAction {
  type: 'jump' | 'trigger' | 'osc' | 'script'
  target?: string
  parameters?: Record<string, any>
}

export interface MarkerData {
  label: string
  description?: string
  icon?: string
  actions?: MarkerAction[]
}

// ========================================
// TRANSPORT & PLAYBACK
// ========================================

export interface TimelineTransport {
  isPlaying: boolean
  isPaused: boolean
  isLooping: boolean
  isRecording: boolean
  
  // Position
  currentTime: number    // Current playhead position
  playbackSpeed: number  // Speed multiplier
  
  // Loop points
  loopStart?: number
  loopEnd?: number
  
  // Punch points
  punchIn?: number
  punchOut?: number
  
  // Sync
  isSynced: boolean
  syncSource?: 'internal' | 'ltc' | 'mtc' | 'midi-clock'
  syncOffset?: number
}

// ========================================
// VIEW SETTINGS
// ========================================

export interface TimelineViewSettings {
  // Visible range
  visibleStartTime: number
  visibleEndTime: number
  
  // Zoom
  horizontalZoom: number  // Pixels per second
  verticalZoom: number    // Track height multiplier
  
  // Grid
  snapToGrid: boolean
  gridSize: number        // Grid size in seconds or beats
  gridType: 'seconds' | 'frames' | 'beats'
  
  // Display options
  showWaveforms: boolean
  showAutomation: boolean
  showMarkers: boolean
  showRegions: boolean
  showTimecodeRuler: boolean
  
  // Track settings
  trackHeight: 'small' | 'medium' | 'large' | 'auto'
  showTrackHeaders: boolean
  showTrackControls: boolean
}

// ========================================
// TIMELINE OPERATIONS
// ========================================

export interface TimelineSelection {
  tracks: string[]       // Selected track IDs
  items: string[]        // Selected item IDs
  timeRange?: {
    start: number
    end: number
  }
}

export interface TimelineEdit {
  type: 'cut' | 'copy' | 'paste' | 'delete' | 'duplicate' | 'split' | 'trim' | 'move' | 'resize'
  selection: TimelineSelection
  parameters?: Record<string, any>
  timestamp: Date
}

export interface TimelineSnapshot {
  id: string
  name: string
  timeline: Timeline
  timestamp: Date
  description?: string
}

// ========================================
// TIMECODE
// ========================================

export interface TimecodeSettings {
  format: '24' | '25' | '29.97' | '30' | '50' | '60'
  dropFrame: boolean
  startTime: string      // Starting timecode
  displayFormat: 'hh:mm:ss:ff' | 'hh:mm:ss.ms' | 'frames' | 'seconds'
}

export interface TimecodeSync {
  source: 'ltc' | 'mtc' | 'midi-clock' | 'network'
  isConnected: boolean
  isLocked: boolean
  offset: number         // Offset in frames
  lastReceived?: Date
  quality?: number       // Sync quality 0-100
}

// ========================================
// EXPORT/IMPORT
// ========================================

export interface TimelineExportOptions {
  format: 'json' | 'xml' | 'aaf' | 'omf'
  includeMedia: boolean
  includeAutomation: boolean
  includeMarkers: boolean
  timeRange?: {
    start: number
    end: number
  }
}

export interface TimelineImportOptions {
  format: 'json' | 'xml' | 'aaf' | 'omf' | 'midi'
  mergeMode: 'replace' | 'merge' | 'append'
  timeOffset: number
  trackMapping?: Record<string, string>
}
