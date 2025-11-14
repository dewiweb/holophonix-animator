/**
 * Animation Orchestrator
 * 
 * Central coordinator for all animation playback in the application.
 * Manages scheduling, priorities, conflicts, and coordinates between
 * the UI layer (cues, timeline) and execution layer (animationStore).
 */

import { create } from 'zustand'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'
import { usePresetStore } from '@/stores/presetStore'
import {
  PlaybackId,
  ScheduleId,
  PlaybackRequest,
  PlaybackInfo,
  PlaybackState,
  PlaybackPriority,
  PlaybackEvent,
  ScheduledAction,
  ConflictStrategy,
  OrchestratorConfig,
  OrchestratorStatus,
  PlaybackEventListener
} from './types'

/**
 * Generate unique playback ID
 */
function generatePlaybackId(): PlaybackId {
  return `playback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate unique schedule ID
 */
function generateScheduleId(): ScheduleId {
  return `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Orchestrator store interface
 */
interface OrchestratorStore {
  // Configuration
  config: OrchestratorConfig
  
  // Active playbacks
  playbacks: Map<PlaybackId, PlaybackInfo>
  
  // Scheduled actions
  scheduled: Map<ScheduleId, ScheduledAction>
  
  // Event listeners
  listeners: Map<PlaybackEvent, Set<PlaybackEventListener>>
  
  // Statistics
  stats: {
    totalPlaybacks: number
    totalErrors: number
    peakConcurrent: number
  }
  
  // Methods
  play: (request: PlaybackRequest) => Promise<PlaybackId>
  stop: (playbackId: PlaybackId) => void
  pause: (playbackId: PlaybackId) => void
  resume: (playbackId: PlaybackId) => void
  stopAll: () => void
  schedule: (request: PlaybackRequest, executeAt: number) => ScheduleId
  cancelSchedule: (scheduleId: ScheduleId) => void
  getPlayback: (playbackId: PlaybackId) => PlaybackInfo | undefined
  getActivePlaybacks: () => PlaybackInfo[]
  getStatus: () => OrchestratorStatus
  on: (event: PlaybackEvent, listener: PlaybackEventListener) => void
  off: (event: PlaybackEvent, listener: PlaybackEventListener) => void
  emit: (event: PlaybackEvent, playbackId: PlaybackId, data?: any) => void
  updateConfig: (config: Partial<OrchestratorConfig>) => void
  
  // Private methods (internal use only)
  _startPlayback: (playbackId: PlaybackId) => void
  _executeScheduled: (scheduleId: ScheduleId) => void
  _checkConflicts: (request: PlaybackRequest) => PlaybackInfo[]
  _resolveConflicts: (conflicts: PlaybackInfo[], newRequest: PlaybackRequest) => void
}

/**
 * Animation Orchestrator Store
 */
export const useOrchestrator = create<OrchestratorStore>((set, get) => ({
  // Initial state
  config: {
    defaultConflictStrategy: ConflictStrategy.PRIORITY_BASED,
    maxConcurrentPlaybacks: 50,
    defaultFade: {
      fadeIn: 0,
      fadeOut: 0,
      curve: 'linear'
    },
    enableMonitoring: true
  },
  
  playbacks: new Map(),
  scheduled: new Map(),
  listeners: new Map(),
  
  stats: {
    totalPlaybacks: 0,
    totalErrors: 0,
    peakConcurrent: 0
  },
  
  /**
   * Play an animation
   */
  play: async (request: PlaybackRequest): Promise<PlaybackId> => {
    const state = get()
    const playbackId = generatePlaybackId()
    
    try {
      // Get animation
      const projectStore = useProjectStore.getState()
      const animation = projectStore.animations.find(a => a.id === request.animationId)
      
      if (!animation) {
        throw new Error(`Animation ${request.animationId} not found`)
      }
      
      // Validate tracks
      if (!request.trackIds || request.trackIds.length === 0) {
        throw new Error(`No tracks specified for playback`)
      }
      
      // Check for conflicts
      const conflicts = state._checkConflicts(request)
      if (conflicts.length > 0) {
        state._resolveConflicts(conflicts, request)
      }
      
      // Create playback info
      const playbackInfo: PlaybackInfo = {
        id: playbackId,
        request,
        state: request.delay && request.delay > 0 ? PlaybackState.SCHEDULED : PlaybackState.STARTING,
        startTime: performance.now() + (request.delay || 0) * 1000,
        currentTime: 0,
        duration: animation.duration || 10
      }
      
      // Add to active playbacks
      state.playbacks.set(playbackId, playbackInfo)
      set({
        playbacks: new Map(state.playbacks),
        stats: {
          ...state.stats,
          totalPlaybacks: state.stats.totalPlaybacks + 1,
          peakConcurrent: Math.max(state.stats.peakConcurrent, state.playbacks.size)
        }
      })
      
      // Emit event
      state.emit(PlaybackEvent.SCHEDULED, playbackId)
      
      // Handle delay
      if (request.delay && request.delay > 0) {
        setTimeout(() => {
          state._startPlayback(playbackId)
        }, request.delay * 1000)
      } else {
        state._startPlayback(playbackId)
      }
      
      return playbackId
      
    } catch (error) {
      console.error(`[Orchestrator] Play error:`, error)
      set({
        stats: {
          ...state.stats,
          totalErrors: state.stats.totalErrors + 1
        }
      })
      throw error
    }
  },
  
  /**
   * Stop a playback
   */
  stop: (playbackId: PlaybackId) => {
    const state = get()
    const playback = state.playbacks.get(playbackId)
    
    if (!playback) {
      console.warn(`[Orchestrator] Playback ${playbackId} not found`)
      return
    }
    
    // Update state to stopping
    playback.state = PlaybackState.STOPPING
    state.playbacks.set(playbackId, playback)
    set({ playbacks: new Map(state.playbacks) })
    
    // Emit event
    state.emit(PlaybackEvent.STOPPED, playbackId)
    
    // Stop in animation store
    const animationStore = useAnimationStore.getState()
    animationStore.stopAnimation(playback.request.animationId)
    
    // Remove from active playbacks
    state.playbacks.delete(playbackId)
    set({ playbacks: new Map(state.playbacks) })
  },
  
  /**
   * Pause a playback
   */
  pause: (playbackId: PlaybackId) => {
    const state = get()
    const playback = state.playbacks.get(playbackId)
    
    if (!playback || playback.state !== PlaybackState.PLAYING) {
      return
    }
    
    playback.state = PlaybackState.PAUSED
    state.playbacks.set(playbackId, playback)
    set({ playbacks: new Map(state.playbacks) })
    
    state.emit(PlaybackEvent.PAUSED, playbackId)
    
    // Pause in animation store
    const animationStore = useAnimationStore.getState()
    animationStore.pauseAnimation(playback.request.animationId)
  },
  
  /**
   * Resume a playback
   */
  resume: (playbackId: PlaybackId) => {
    const state = get()
    const playback = state.playbacks.get(playbackId)
    
    if (!playback || playback.state !== PlaybackState.PAUSED) {
      return
    }
    
    playback.state = PlaybackState.PLAYING
    state.playbacks.set(playbackId, playback)
    set({ playbacks: new Map(state.playbacks) })
    
    state.emit(PlaybackEvent.RESUMED, playbackId)
    
    // Resume in animation store
    const animationStore = useAnimationStore.getState()
    animationStore.pauseAnimation(playback.request.animationId) // Toggle pause
  },
  
  /**
   * Stop all playbacks
   */
  stopAll: () => {
    const state = get()
    
    // Stop each playback
    Array.from(state.playbacks.keys()).forEach(playbackId => {
      state.stop(playbackId)
    })
    
    // Clear all
    state.playbacks.clear()
    set({ playbacks: new Map() })
    
    // Stop all in animation store
    const animationStore = useAnimationStore.getState()
    animationStore.stopAllAnimations()
  },
  
  /**
   * Schedule an action for future execution
   */
  schedule: (request: PlaybackRequest, executeAt: number): ScheduleId => {
    const state = get()
    const scheduleId = generateScheduleId()
    
    const action: ScheduledAction = {
      id: scheduleId,
      request,
      executeAt,
      createdAt: Date.now(),
      executed: false,
      cancelled: false
    }
    
    state.scheduled.set(scheduleId, action)
    set({ scheduled: new Map(state.scheduled) })
    
    // Set timeout to execute
    const delay = executeAt - Date.now()
    if (delay > 0) {
      setTimeout(() => {
        state._executeScheduled(scheduleId)
      }, delay)
    }
    
    return scheduleId
  },
  
  /**
   * Cancel a scheduled action
   */
  cancelSchedule: (scheduleId: ScheduleId) => {
    const state = get()
    const action = state.scheduled.get(scheduleId)
    
    if (action && !action.executed) {
      action.cancelled = true
      state.scheduled.set(scheduleId, action)
      set({ scheduled: new Map(state.scheduled) })
    }
  },
  
  /**
   * Get playback info
   */
  getPlayback: (playbackId: PlaybackId) => {
    return get().playbacks.get(playbackId)
  },
  
  /**
   * Get all active playbacks
   */
  getActivePlaybacks: () => {
    return Array.from(get().playbacks.values())
  },
  
  /**
   * Get orchestrator status
   */
  getStatus: (): OrchestratorStatus => {
    const state = get()
    return {
      activePlaybacks: state.playbacks.size,
      scheduledActions: Array.from(state.scheduled.values()).filter(a => !a.executed && !a.cancelled).length,
      totalPlaybacks: state.stats.totalPlaybacks,
      errors: state.stats.totalErrors,
      performance: {
        averageLatency: 0, // TODO: Implement
        peakConcurrent: state.stats.peakConcurrent
      }
    }
  },
  
  /**
   * Register event listener
   */
  on: (event: PlaybackEvent, listener: PlaybackEventListener) => {
    const state = get()
    if (!state.listeners.has(event)) {
      state.listeners.set(event, new Set())
    }
    state.listeners.get(event)!.add(listener)
  },
  
  /**
   * Unregister event listener
   */
  off: (event: PlaybackEvent, listener: PlaybackEventListener) => {
    const state = get()
    state.listeners.get(event)?.delete(listener)
  },
  
  /**
   * Emit event
   */
  emit: (event: PlaybackEvent, playbackId: PlaybackId, data?: any) => {
    const state = get()
    const playback = state.playbacks.get(playbackId)
    
    if (!playback) return
    
    const listeners = state.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener({ type: event, playbackId, playback, data })
        } catch (error) {
          console.error(`[Orchestrator] Event listener error:`, error)
        }
      })
    }
  },
  
  /**
   * Update configuration
   */
  updateConfig: (config: Partial<OrchestratorConfig>) => {
    set({ config: { ...get().config, ...config } })
  },
  
  /**
   * PRIVATE: Start playback execution
   */
  _startPlayback: (playbackId: PlaybackId) => {
    const state = get()
    const playback = state.playbacks.get(playbackId)
    
    if (!playback) return
    
    // Update state
    playback.state = PlaybackState.PLAYING
    state.playbacks.set(playbackId, playback)
    set({ playbacks: new Map(state.playbacks) })
    
    // Emit event
    state.emit(PlaybackEvent.STARTED, playbackId)
    
    // Start in animation store
    const animationStore = useAnimationStore.getState()
    animationStore.playAnimation(playback.request.animationId, playback.request.trackIds)
  },
  
  /**
   * PRIVATE: Execute scheduled action
   */
  _executeScheduled: (scheduleId: ScheduleId) => {
    const state = get()
    const action = state.scheduled.get(scheduleId)
    
    if (!action || action.executed || action.cancelled) return
    
    action.executed = true
    state.scheduled.set(scheduleId, action)
    set({ scheduled: new Map(state.scheduled) })
    
    // Execute the playback
    state.play(action.request)
  },
  
  /**
   * PRIVATE: Check for conflicts with existing playbacks
   */
  _checkConflicts: (request: PlaybackRequest): PlaybackInfo[] => {
    const state = get()
    const conflicts: PlaybackInfo[] = []
    
    state.playbacks.forEach(playback => {
      // Check if tracks overlap
      const hasOverlap = request.trackIds.some(trackId =>
        playback.request.trackIds.includes(trackId)
      )
      
      if (hasOverlap && playback.state === PlaybackState.PLAYING) {
        conflicts.push(playback)
      }
    })
    
    return conflicts
  },
  
  /**
   * PRIVATE: Resolve conflicts based on strategy
   */
  _resolveConflicts: (conflicts: PlaybackInfo[], newRequest: PlaybackRequest) => {
    const state = get()
    const strategy = state.config.defaultConflictStrategy || ConflictStrategy.PRIORITY_BASED
    const newPriority = newRequest.priority || PlaybackPriority.NORMAL
    
    switch (strategy) {
      case ConflictStrategy.STOP_EXISTING:
        conflicts.forEach(conflict => state.stop(conflict.id))
        break
      
      case ConflictStrategy.PRIORITY_BASED:
        conflicts.forEach(conflict => {
          const existingPriority = conflict.request.priority || PlaybackPriority.NORMAL
          if (newPriority > existingPriority) {
            state.stop(conflict.id)
          }
        })
        break
      
      case ConflictStrategy.REJECT_NEW:
        throw new Error('Track conflict: Tracks are busy')
      
      case ConflictStrategy.ALLOW_CONCURRENT:
        // Do nothing, allow both to play
        break
    }
  }
}))
