/**
 * Position Cue Executor
 * 
 * Handles execution of position cues in the cuelist system.
 * Applies position presets with smooth transitions and track management.
 */

import { PositionCue, PositionCueExecution } from '@/cues/types/positionCue'
import { TransitionTarget } from '@/types/positionPreset'
import { Position } from '@/types'
import { calculateDistance } from '@/utils/interpolation/positionInterpolation'
import { generateId } from '@/utils'

/**
 * Execution Context
 * Runtime context passed from cue store
 */
interface ExecutionContext {
  activeCues: Map<string, any>
  trackOwnership: Map<string, string>
  priorityMode: 'ltp' | 'htp' | 'first' | 'blend'
  defaultTransitionDuration: number
}

/**
 * Position Cue Executor
 * Stateless executor for position cues
 */
export class PositionCueExecutor {
  /**
   * Execute a position cue
   */
  async execute(
    cueId: string,
    cue: PositionCue,
    context: ExecutionContext
  ): Promise<void> {
    console.log(`🎯 Executing position cue: ${cue.name}`)

    // Get required stores
    const { usePositionPresetStore } = await import('@/stores/positionPresetStore')
    const { useProjectStore } = await import('@/stores/projectStore')
    const { useAnimationStore } = await import('@/stores/animationStore')
    
    const presetStore = usePositionPresetStore.getState()
    const projectStore = useProjectStore.getState()
    const animationStore = useAnimationStore.getState()

    // Get preset
    const preset = presetStore.getPreset(cue.data.presetId)
    if (!preset) {
      console.error(`❌ Preset not found: ${cue.data.presetId}`)
      throw new Error(`Preset not found: ${cue.data.presetId}`)
    }

    // Validate preset before execution
    if (cue.data.validateBeforeApply) {
      const validation = presetStore.validatePreset(cue.data.presetId)
      if (!validation.valid) {
        console.error('❌ Preset validation failed:', validation.errors)
        throw new Error(`Preset validation failed: ${validation.errors.join(', ')}`)
      }
    }

    // Determine target tracks
    const targetTrackIds = this.resolveTargetTracks(cue, preset, projectStore)
    
    if (targetTrackIds.length === 0) {
      console.warn('⚠️ No valid tracks to apply preset to')
      return
    }

    console.log(`  Tracks: ${targetTrackIds.length}`)

    // Handle priority mode (LTP by default)
    if (context.priorityMode === 'ltp') {
      await this.handleLTPConflicts(cueId, targetTrackIds, context)
    }

    // Stop animations if requested
    if (cue.data.interruptAnimations) {
      await this.interruptAnimations(targetTrackIds, animationStore)
    }

    // Build transition targets
    const targets = this.buildTransitionTargets(
      targetTrackIds,
      preset,
      cue,
      projectStore
    )

    // Create execution state
    const execution: PositionCueExecution = {
      cueId,
      startTime: new Date(),
      state: 'preparing',
      progress: 0,
      targets,
      activeTrackIds: targetTrackIds,
      interruptedAnimations: [],
      frameCount: 0,
      lastUpdateTime: new Date()
    }

    // Register execution
    context.activeCues.set(cueId, execution)
    targetTrackIds.forEach(trackId => {
      context.trackOwnership.set(trackId, cueId)
    })

    try {
      // Execute transition
      execution.state = 'transitioning'
      
      if (cue.data.transition.duration > 0) {
        // Smooth transition
        await this.executeTransition(targets, cue, execution, projectStore, animationStore)
      } else {
        // Instant apply
        await this.instantApply(targets, projectStore)
      }

      execution.state = 'complete'
      execution.endTime = new Date()
      execution.progress = 1.0

    } catch (error) {
      execution.state = 'error'
      execution.error = error instanceof Error ? error.message : String(error)
      console.error('❌ Position cue execution failed:', error)
      throw error
    } finally {
      // Cleanup
      if (cue.data.waitForCompletion) {
        // Remove from active cues after completion
        context.activeCues.delete(cueId)
        targetTrackIds.forEach(trackId => {
          if (context.trackOwnership.get(trackId) === cueId) {
            context.trackOwnership.delete(trackId)
          }
        })
      }
    }

    // Mark as recently used
    presetStore.addRecentlyUsed(cue.data.presetId)

    console.log(`✅ Position cue complete: ${cue.name}`)
  }

  /**
   * Resolve target tracks for the cue
   */
  private resolveTargetTracks(
    cue: PositionCue,
    preset: any,
    projectStore: any
  ): string[] {
    // Use cue's track override if specified
    if (cue.data.trackIds && cue.data.trackIds.length > 0) {
      return cue.data.trackIds.filter(id => {
        const track = projectStore.tracks.find((t: any) => t.id === id)
        return track !== undefined
      })
    }

    // Use preset's tracks
    return preset.trackIds.filter((id: string) => {
      const track = projectStore.tracks.find((t: any) => t.id === id)
      return track !== undefined
    })
  }

  /**
   * Handle LTP conflicts - release conflicting tracks from other cues
   */
  private async handleLTPConflicts(
    cueId: string,
    trackIds: string[],
    context: ExecutionContext
  ): Promise<void> {
    const conflictingTracks = trackIds.filter(trackId => {
      const owner = context.trackOwnership.get(trackId)
      return owner && owner !== cueId
    })

    if (conflictingTracks.length === 0) return

    console.log(`  Releasing ${conflictingTracks.length} conflicting tracks (LTP)`)

    // Group by owning cue
    const cueToTracks = new Map<string, string[]>()
    conflictingTracks.forEach(trackId => {
      const ownerCueId = context.trackOwnership.get(trackId)
      if (ownerCueId) {
        if (!cueToTracks.has(ownerCueId)) {
          cueToTracks.set(ownerCueId, [])
        }
        cueToTracks.get(ownerCueId)!.push(trackId)
      }
    })

    // Release tracks from conflicting cues
    for (const [conflictingCueId, conflictingTrackIds] of cueToTracks.entries()) {
      const execution = context.activeCues.get(conflictingCueId)
      
      if (execution && execution.activeTargets) {
        const remainingTracks = execution.activeTargets.filter(
          (t: string) => !conflictingTrackIds.includes(t)
        )
        
        if (remainingTracks.length === 0) {
          // No tracks left, mark cue as complete
          context.activeCues.delete(conflictingCueId)
          console.log(`    Cue ${conflictingCueId} released (no remaining tracks)`)
        } else {
          // Update to only include remaining tracks
          execution.activeTargets = remainingTracks
          console.log(`    Cue ${conflictingCueId} reduced to ${remainingTracks.length} tracks`)
        }
      }
      
      // Release ownership
      conflictingTrackIds.forEach(trackId => {
        context.trackOwnership.delete(trackId)
      })
    }
  }

  /**
   * Interrupt animations on target tracks
   */
  private async interruptAnimations(
    trackIds: string[],
    animationStore: any
  ): Promise<void> {
    const interruptedAnimations: string[] = []

    // Find and stop animations on these tracks
    animationStore.playingAnimations.forEach((animation: any, animId: string) => {
      const hasConflict = animation.trackIds.some((id: string) => trackIds.includes(id))
      
      if (hasConflict) {
        console.log(`  Stopping animation: ${animId}`)
        animationStore.stopAnimation(animId)
        interruptedAnimations.push(animId)
      }
    })

    if (interruptedAnimations.length > 0) {
      console.log(`  Interrupted ${interruptedAnimations.length} animations`)
    }
  }

  /**
   * Build transition targets
   */
  private buildTransitionTargets(
    trackIds: string[],
    preset: any,
    cue: PositionCue,
    projectStore: any
  ): TransitionTarget[] {
    const targets: TransitionTarget[] = []

    trackIds.forEach(trackId => {
      const track = projectStore.tracks.find((t: any) => t.id === trackId)
      const targetPos = preset.positions[trackId]

      if (!track || !targetPos) return

      // Check for per-track overrides
      const duration = cue.data.transition.perTrackDuration?.[trackId] 
        || cue.data.transition.duration
      const easing = cue.data.transition.perTrackEasing?.[trackId]
        || cue.data.transition.easing

      targets.push({
        trackId,
        from: { ...track.position },
        to: { ...targetPos },
        distance: calculateDistance(track.position, targetPos),
        duration,
        easing
      })
    })

    return targets
  }

  /**
   * Execute smooth transition
   */
  private async executeTransition(
    targets: TransitionTarget[],
    cue: PositionCue,
    execution: PositionCueExecution,
    projectStore: any,
    animationStore: any
  ): Promise<void> {
    const { transition } = cue.data

    // Apply stagger if configured
    if (transition.stagger?.enabled) {
      await this.executeStaggered(targets, transition, cue, execution, projectStore)
    } else {
      await this.executeParallel(targets, transition, cue, execution, projectStore, animationStore)
    }
  }

  /**
   * Execute staggered transition
   */
  private async executeStaggered(
    targets: TransitionTarget[],
    transition: any,
    cue: PositionCue,
    execution: PositionCueExecution,
    projectStore: any
  ): Promise<void> {
    const stagger = transition.stagger!
    const order = this.calculateStaggerOrder(targets, stagger.mode)

    console.log(`  Staggered transition: ${stagger.mode}, delay=${stagger.delay}s`)

    // Calculate delays
    const delayedTargets = order.map((target, index) => ({
      ...target,
      delay: index * stagger.delay * (1 - stagger.overlap)
    }))

    // Execute all with delays
    const promises = delayedTargets.map(target => 
      this.executeTargetTransition(target, transition, execution, projectStore)
    )

    await Promise.all(promises)
  }

  /**
   * Execute parallel transition (all tracks at once)
   */
  private async executeParallel(
    targets: TransitionTarget[],
    transition: any,
    cue: PositionCue,
    execution: PositionCueExecution,
    projectStore: any,
    animationStore: any
  ): Promise<void> {
    console.log(`  Parallel transition: ${transition.duration}s, easing=${transition.easing}`)

    // Use animation store's easeToPositions for smooth transition
    const easeTargets = targets.map(t => ({
      trackId: t.trackId,
      from: t.from,
      to: t.to
    }))

    // Set up OSC callback
    const { oscBatchManager } = await import('@/utils/osc/batchManager')
    oscBatchManager.setSendCallback(async (batch: any) => {
      const { useOSCStore } = await import('@/stores/oscStore')
      const oscStore = useOSCStore.getState()
      await oscStore.sendBatch(batch)
    })

    // Execute transition
    await animationStore._easeToPositions(
      easeTargets,
      transition.duration * 1000,  // Convert to ms
      () => {
        execution.progress = 1.0
        execution.state = 'complete'
      }
    )
  }

  /**
   * Execute transition for single target (used in stagger mode)
   */
  private async executeTargetTransition(
    target: TransitionTarget & { delay?: number },
    transition: any,
    execution: PositionCueExecution,
    projectStore: any
  ): Promise<void> {
    // Wait for delay if specified
    const delay = target.delay
    if (delay !== undefined && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000))
    }

    // Use simple position interpolation for individual track
    const { interpolatePosition, applyEasing } = await import('@/utils/interpolation/positionInterpolation')
    
    const startTime = Date.now()
    const durationMs = target.duration * 1000

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const rawProgress = Math.min(elapsed / durationMs, 1.0)
        const easedProgress = applyEasing(rawProgress, target.easing)

        // Interpolate position
        const newPos = interpolatePosition(
          target.from,
          target.to,
          easedProgress,
          transition.mode
        )

        // Update track position
        projectStore.updateTrack(target.trackId, { position: newPos })

        // Send OSC update
        this.sendOSCUpdate(target.trackId, newPos, projectStore)

        execution.frameCount++
        execution.lastUpdateTime = new Date()

        if (rawProgress < 1.0) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  /**
   * Instant apply (no transition)
   */
  private async instantApply(
    targets: TransitionTarget[],
    projectStore: any
  ): Promise<void> {
    console.log(`  Instant apply (no transition)`)

    // Update all tracks immediately
    targets.forEach(target => {
      projectStore.updateTrack(target.trackId, { position: target.to })
      this.sendOSCUpdate(target.trackId, target.to, projectStore)
    })
  }

  /**
   * Send OSC update for track position
   */
  private async sendOSCUpdate(
    trackId: string,
    position: Position,
    projectStore: any
  ): Promise<void> {
    const { useOSCStore } = await import('@/stores/oscStore')
    const { useSettingsStore } = await import('@/stores/settingsStore')
    
    const oscStore = useOSCStore.getState()
    const settingsStore = useSettingsStore.getState()
    
    const track = projectStore.tracks.find((t: any) => t.id === trackId)
    if (!track) return

    const coordSystem = (settingsStore as any).oscSettings?.defaultCoordinateSystem || 'xyz'
    const trackIndex = track.holophonixIndex || (projectStore.tracks.indexOf(track) + 1)

    oscStore.sendMessage(`/track/${trackIndex}/${coordSystem}`, [
      position.x,
      position.y,
      position.z
    ])
  }

  /**
   * Calculate stagger order based on mode
   */
  private calculateStaggerOrder(
    targets: TransitionTarget[],
    mode: string
  ): TransitionTarget[] {
    switch (mode) {
      case 'sequential':
        return [...targets]  // Keep original order
      
      case 'random':
        return this.shuffleArray([...targets])
      
      case 'inside-out':
        return this.sortByDistanceFromOrigin(targets, false)
      
      case 'outside-in':
        return this.sortByDistanceFromOrigin(targets, true)
      
      case 'distance':
        return this.sortByDistanceFromOrigin(targets, false)
      
      default:
        return [...targets]
    }
  }

  /**
   * Sort targets by distance from origin
   */
  private sortByDistanceFromOrigin(
    targets: TransitionTarget[],
    descending: boolean
  ): TransitionTarget[] {
    return [...targets].sort((a, b) => {
      const distA = Math.sqrt(a.from.x ** 2 + a.from.y ** 2 + a.from.z ** 2)
      const distB = Math.sqrt(b.from.x ** 2 + b.from.y ** 2 + b.from.z ** 2)
      return descending ? distB - distA : distA - distB
    })
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

/**
 * Singleton instance
 */
export const positionCueExecutor = new PositionCueExecutor()
