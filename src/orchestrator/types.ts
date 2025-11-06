/**
 * Animation Orchestrator Types
 * 
 * Defines the core types for the Animation Orchestrator system,
 * which manages all animation playback, scheduling, and coordination.
 */

import { Animation } from '@/types'

/**
 * Unique identifier for a playback instance
 */
export type PlaybackId = string

/**
 * Unique identifier for a scheduled action
 */
export type ScheduleId = string

/**
 * Priority levels for playback requests
 * Higher priority requests can interrupt lower priority ones
 */
export enum PlaybackPriority {
  EMERGENCY = 100,    // Stop everything (emergency stop, panic button)
  CRITICAL = 80,      // Critical system events
  HIGH = 60,          // Timeline cues, important automated sequences
  NORMAL = 40,        // Manual cues, user-triggered animations
  BACKGROUND = 20,    // Ambient animations, background effects
  LOW = 10            // Non-essential animations
}

/**
 * Playback state
 */
export enum PlaybackState {
  SCHEDULED = 'scheduled',  // Waiting to start
  STARTING = 'starting',    // Fade in / preparing
  PLAYING = 'playing',      // Active playback
  PAUSED = 'paused',       // Temporarily paused
  STOPPING = 'stopping',   // Fade out / cleanup
  STOPPED = 'stopped',     // Finished or manually stopped
  ERROR = 'error'          // Playback error
}

/**
 * Fade configuration
 */
export interface FadeConfig {
  /** Fade in duration in seconds */
  fadeIn?: number
  /** Fade out duration in seconds */
  fadeOut?: number
  /** Fade curve (linear, ease-in, ease-out, ease-in-out) */
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Request to play an animation
 */
export interface PlaybackRequest {
  /** Animation to play */
  animationId: string
  
  /** Tracks to animate */
  trackIds: string[]
  
  /** Priority level */
  priority?: PlaybackPriority
  
  /** Start delay in seconds */
  delay?: number
  
  /** Fade configuration */
  fade?: FadeConfig
  
  /** Playback speed multiplier (1.0 = normal) */
  speed?: number
  
  /** Loop configuration */
  loop?: boolean | number  // true = infinite, number = loop count
  
  /** Reverse playback */
  reverse?: boolean
  
  /** Source of the request (for tracking) */
  source?: 'cue' | 'timeline' | 'manual' | 'automation'
  
  /** Source ID (cue ID, timeline ID, etc.) */
  sourceId?: string
  
  /** Metadata */
  metadata?: Record<string, any>
}

/**
 * Active playback information
 */
export interface PlaybackInfo {
  /** Unique playback ID */
  id: PlaybackId
  
  /** Original request */
  request: PlaybackRequest
  
  /** Current state */
  state: PlaybackState
  
  /** Start time (performance.now()) */
  startTime: number
  
  /** Current playback time in seconds */
  currentTime: number
  
  /** Total duration in seconds */
  duration: number
  
  /** Fade state */
  fadeState?: {
    isFading: boolean
    direction: 'in' | 'out'
    progress: number  // 0-1
  }
  
  /** Error information if state === ERROR */
  error?: string
}

/**
 * Scheduled action (for future execution)
 */
export interface ScheduledAction {
  /** Unique schedule ID */
  id: ScheduleId
  
  /** Playback request */
  request: PlaybackRequest
  
  /** Execution time (absolute, in ms since epoch) */
  executeAt: number
  
  /** Created at */
  createdAt: number
  
  /** Executed flag */
  executed: boolean
  
  /** Cancelled flag */
  cancelled: boolean
}

/**
 * Conflict resolution strategy
 * Determines what happens when animations target the same tracks
 */
export enum ConflictStrategy {
  /** Stop existing animations on conflicting tracks */
  STOP_EXISTING = 'stop_existing',
  
  /** Stop new animation if tracks are busy */
  REJECT_NEW = 'reject_new',
  
  /** Allow concurrent playback (blend) */
  ALLOW_CONCURRENT = 'allow_concurrent',
  
  /** Priority-based (higher priority wins) */
  PRIORITY_BASED = 'priority_based'
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Default conflict strategy */
  defaultConflictStrategy?: ConflictStrategy
  
  /** Maximum concurrent playbacks */
  maxConcurrentPlaybacks?: number
  
  /** Default fade durations */
  defaultFade?: FadeConfig
  
  /** Enable performance monitoring */
  enableMonitoring?: boolean
}

/**
 * Orchestrator status
 */
export interface OrchestratorStatus {
  /** Active playbacks count */
  activePlaybacks: number
  
  /** Scheduled actions count */
  scheduledActions: number
  
  /** Total playbacks since start */
  totalPlaybacks: number
  
  /** Errors count */
  errors: number
  
  /** Performance metrics */
  performance?: {
    averageLatency: number
    peakConcurrent: number
  }
}

/**
 * Playback event types
 */
export enum PlaybackEvent {
  SCHEDULED = 'playback:scheduled',
  STARTED = 'playback:started',
  PAUSED = 'playback:paused',
  RESUMED = 'playback:resumed',
  STOPPED = 'playback:stopped',
  COMPLETED = 'playback:completed',
  ERROR = 'playback:error',
  FADE_IN_START = 'playback:fade_in_start',
  FADE_IN_END = 'playback:fade_in_end',
  FADE_OUT_START = 'playback:fade_out_start',
  FADE_OUT_END = 'playback:fade_out_end',
}

/**
 * Event listener callback
 */
export type PlaybackEventListener = (event: {
  type: PlaybackEvent
  playbackId: PlaybackId
  playback: PlaybackInfo
  data?: any
}) => void
