/**
 * Animation Orchestrator Module
 * 
 * Exports all orchestrator functionality
 */

export { useOrchestrator } from './animationOrchestrator'

export type {
  PlaybackId,
  ScheduleId,
  PlaybackRequest,
  PlaybackInfo,
  ScheduledAction,
  OrchestratorConfig,
  OrchestratorStatus,
  FadeConfig,
  PlaybackEventListener
} from './types'

export {
  PlaybackPriority,
  PlaybackState,
  PlaybackEvent,
  ConflictStrategy
} from './types'
