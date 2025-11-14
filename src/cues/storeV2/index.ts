import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { Show, Cue, CueBank, CueSystemSettings } from '../types'
import { generateId } from '@/utils'

// Import action modules
import * as CueActions from '../store/cueActions'
import * as BankActions from '../store/cueBank'

/**
 * Cue System Store V2
 * 
 * New modular architecture with:
 * - Three cue types (Animation, OSC, Reset)
 * - Priority system (LTP default)
 * - Transition modes
 * - No arming system
 * - Duplicate bug fixed
 */

/**
 * Execution Context
 * Tracks active cues and their state
 */
interface ExecutionContext {
  // Active cues
  activeCues: Map<string, any>  // cueId -> execution state
  
  // Track ownership (which cue controls which tracks)
  trackOwnership: Map<string, string>  // trackId -> cueId
  
  // Orchestrator playback IDs
  cuePlaybacks: Map<string, string>  // cueId -> playbackId
  
  // Settings
  priorityMode: 'ltp' | 'htp' | 'first' | 'blend'
  defaultTransitionMode: 'direct' | 'fade-through-initial' | 'crossfade' | 'hard-cut'
  defaultTransitionDuration: number  // seconds
}

/**
 * Store State
 */
interface CueStoreV2State {
  // Current show
  currentShow: Show | null
  
  // Execution context
  executionContext: ExecutionContext
  
  // Selection
  selectedCueIds: string[]
  selectedBankId: string | null
  selectedListId: string | null
  
  // Settings
  settings: CueSystemSettings
  
  // === SHOW MANAGEMENT ===
  createShow: (name: string) => Show
  loadShow: (show: Show) => void
  saveShow: () => void
  deleteShow: () => void
  
  // === CUE MANAGEMENT ===
  createCue: (cueData: Omit<Cue, 'id'>, options?: { skipAutoAssign?: boolean }) => string
  updateCue: (cueId: string, updates: Partial<Cue>) => void
  deleteCue: (cueId: string) => void
  duplicateCue: (cueId: string, options?: { skipAutoAssign?: boolean }) => string | null
  
  // === CUE EXECUTION ===
  triggerCue: (cueId: string, options?: { velocity?: number }) => void
  stopCue: (cueId: string) => void
  toggleCue: (cueId: string) => void
  panic: () => void  // Emergency stop all
  
  // === EXTERNAL TRIGGERS ===
  handleOscTrigger: (address: string, args: any[]) => void
  
  // === CUE BANK MANAGEMENT ===
  createCueBank: (name: string, rows: number, columns: number) => string
  deleteCueBank: (bankId: string) => void
  assignCueToSlot: (cueId: string, bankId: string, row: number, column: number) => void
  clearSlot: (bankId: string, row: number, column: number) => void
  switchBank: (bankId: string) => void
  moveCueSlot: (
    sourceBankId: string,
    sourceRow: number,
    sourceColumn: number,
    targetBankId: string,
    targetRow: number,
    targetColumn: number
  ) => void
  
  // === UTILITIES ===
  getCueById: (cueId: string) => Cue | undefined
  getCueBankById: (bankId: string) => CueBank | undefined
  getActiveCues: () => Cue[]
  
  // === SETTINGS ===
  updateSettings: (settings: Partial<CueSystemSettings>) => void
  setPriorityMode: (mode: 'ltp' | 'htp' | 'first' | 'blend') => void
  setDefaultTransition: (mode: 'direct' | 'fade-through-initial' | 'crossfade' | 'hard-cut', duration?: number) => void
  
  // === PRIVATE EXECUTION METHODS ===
  _executeAnimationCue: (cueId: string, cue: Cue, context: ExecutionContext, options?: any) => Promise<void>
  _executeOSCCue: (cueId: string, cue: Cue, context: ExecutionContext) => Promise<void>
  _executeResetCue: (cueId: string, cue: Cue, context: ExecutionContext) => Promise<void>
}

// Default settings
const defaultSettings: CueSystemSettings = {
  gridSize: { rows: 8, columns: 8 },
  defaultBank: '',
  defaultFadeTime: 1.0,
  defaultHoldTime: 0,
  safeMode: false,
  showThumbnails: true,
  showNumbers: true,
  showStatus: true,
  compactMode: false,
  enableOSC: true,
  enableDMX: false,
  enableTimecode: false,
  preloadCues: true,
  cacheSize: 100,
  maxConcurrentCues: 10,
}

// Default execution context
const defaultExecutionContext: ExecutionContext = {
  activeCues: new Map(),
  trackOwnership: new Map(),
  cuePlaybacks: new Map(),
  priorityMode: 'ltp',  // Last Takes Precedence (default)
  defaultTransitionMode: 'direct',
  defaultTransitionDuration: 1.0,
}

/**
 * Create Cue Store V2
 */
export const useCueStoreV2 = create<CueStoreV2State>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentShow: null,
        executionContext: { ...defaultExecutionContext },
        selectedCueIds: [],
        selectedBankId: null,
        selectedListId: null,
        settings: defaultSettings,
        
        // ========================================
        // SHOW MANAGEMENT
        // ========================================
        
        createShow: (name: string) => {
          const show: Show = {
            id: generateId(),
            name,
            cueLists: [],
            cueBanks: [],
            cueStacks: [{
              id: generateId(),
              name: 'Main Stack',
              executions: [],
              priority: 'fifo',
              maxConcurrent: 10,
              exclusive: false,
              interruptible: true,
            }],
            settings: defaultSettings,
            created: new Date(),
            modified: new Date(),
          }
          
          // Create default bank
          const { bankId, show: updatedShow } = BankActions.createCueBank(
            show,
            'Bank A',
            8,
            8
          )
          
          updatedShow.activeBankId = bankId
          
          set({
            currentShow: updatedShow,
            selectedBankId: bankId,
            executionContext: { ...defaultExecutionContext }
          })
          
          return updatedShow
        },
        
        loadShow: (show: Show) => {
          set({
            currentShow: show,
            selectedBankId: show.activeBankId || null,
            selectedListId: show.activeCueListId || null,
            executionContext: { ...defaultExecutionContext }
          })
        },
        
        saveShow: () => {
          const show = get().currentShow
          if (!show) return
          
          localStorage.setItem('holophonix-show-v2', JSON.stringify(show))
        },
        
        deleteShow: () => {
          get().panic()
          set({
            currentShow: null,
            selectedCueIds: [],
            selectedBankId: null,
            selectedListId: null,
            executionContext: { ...defaultExecutionContext }
          })
        },
        
        // ========================================
        // CUE MANAGEMENT
        // ========================================
        
        createCue: (cueData, options = {}) => {
          const show = get().currentShow
          if (!show) {
            console.error('No show loaded')
            return ''
          }
          
          const { cueId, show: updatedShow } = CueActions.createCue(show, cueData, options)
          set({ currentShow: updatedShow })
          
          return cueId
        },
        
        updateCue: (cueId, updates) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = CueActions.updateCue(show, cueId, updates)
          set({ currentShow: updatedShow })
        },
        
        deleteCue: (cueId) => {
          const show = get().currentShow
          if (!show) return
          
          // Stop if active
          const context = get().executionContext
          if (context.activeCues.has(cueId)) {
            get().stopCue(cueId)
          }
          
          const updatedShow = CueActions.deleteCue(show, cueId)
          set({
            currentShow: updatedShow,
            selectedCueIds: get().selectedCueIds.filter(id => id !== cueId)
          })

        },
        
        duplicateCue: (cueId, options = {}) => {
          const show = get().currentShow
          if (!show) return null
          
          const result = CueActions.duplicateCue(show, cueId, options)
          if (!result) return null
          
          set({ currentShow: result.show })
          return result.cueId
        },
        
        // ========================================
        // CUE EXECUTION
        // ========================================
        
        triggerCue: async (cueId, options = {}) => {
          const cue = get().getCueById(cueId)
          if (!cue || !cue.isEnabled) {
            console.warn('Cue not found or disabled:', cueId)
            return
          }
          
          const context = get().executionContext
          
          // Handle different cue types
          if ((cue as any).type === 'animation' || (cue as any).category === 'animation') {
            await get()._executeAnimationCue(cueId, cue, context, options)
          } else if ((cue as any).type === 'osc') {
            await get()._executeOSCCue(cueId, cue, context)
          } else if ((cue as any).type === 'reset') {
            await get()._executeResetCue(cueId, cue, context)
          } else {
            console.warn('Unknown cue type:', (cue as any).type)
          }
          
          // Mark as triggered
          get().updateCue(cueId, {
            lastTriggered: new Date(),
            triggerCount: cue.triggerCount + 1
          })
        },
        
        /**
         * Execute animation cue
         * Implements LTP (Last Takes Precedence) by default
         */
        _executeAnimationCue: async (cueId: string, cue: Cue, context: ExecutionContext, options: any = {}) => {
          const cueData = (cue as any).data || (cue as any).parameters || {}
          const animationId = cueData.animationId
          
          if (!animationId) {
            console.error('Animation cue has no animation ID:', cueId)
            return
          }
          
          // Get animation from project store
          const { useProjectStore } = await import('@/stores/projectStore')
          const { animations } = useProjectStore.getState()
          const animation = animations.find(a => a.id === animationId)
          
          if (!animation) {
            console.error('Animation not found:', animationId)
            return
          }
          
          // Determine track IDs
          let trackIds: string[] = []
          
          if (animation.trackSelectionLocked && animation.trackIds) {
            // Locked animation - use embedded tracks
            trackIds = animation.trackIds
          } else {
            // Unlocked - use cue's track selection, or fallback to animation tracks, or all selected tracks
            if (cueData.trackIds && cueData.trackIds.length > 0) {
              // Cue has specific tracks assigned
              trackIds = cueData.trackIds
            } else if (animation.trackIds && animation.trackIds.length > 0) {
              // Use all tracks from animation as default
              trackIds = animation.trackIds
            } else {
              // Fallback to currently selected tracks
              trackIds = useProjectStore.getState().selectedTracks
            }
          }
          
          if (trackIds.length === 0) {
            console.warn('⚠️ No tracks available for animation cue:', cueId)
            return
          }
          
          // FORMATION/CENTERED MODE VALIDATION
          // Check if this is a formation/centered animation being played on a track subset
          if (animation.transform?.mode === 'formation') {
            const savedTracks = Object.keys(animation.transform.tracks)
            const validTracks = trackIds.filter(id => savedTracks.includes(id))
            const missingTracks = savedTracks.filter(id => !trackIds.includes(id))
            
            if (validTracks.length !== savedTracks.length) {
              console.warn('⚠️ Formation animation track mismatch:', {
                animationName: animation.name,
                savedTracks,
                requestedTracks: trackIds,
                validTracks,
                missingTracks
              })
              
              // Formation animations are "all-or-nothing"
              // Playing on subset would break formation geometry
              if (validTracks.length === 0) {
                console.error('❌ Cannot play formation animation: no valid tracks')
                return
              }
              
              // Warn but allow playback on valid subset
              // Note: Formation anchor will be recalculated at runtime
              trackIds = validTracks
            }
          }
          
          // Handle priority mode (LTP by default)
          const priorityMode = context.priorityMode || 'ltp'
          
          if (priorityMode === 'ltp') {
            // Last Takes Precedence: Release only conflicting tracks
            // Per-track LTP: Only stop tracks that overlap, not entire cues
            
            const conflictingTracks = trackIds.filter(trackId => {
              const owner = context.trackOwnership.get(trackId)
              return owner && owner !== cueId
            })
            
            if (conflictingTracks.length > 0) {
              // Group conflicting tracks by owning cue
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
              
              // For each conflicting cue, remove only the conflicting tracks
              for (const [conflictingCueId, conflictingTrackIds] of cueToTracks.entries()) {
                const execution = context.activeCues.get(conflictingCueId)
                
                if (execution && execution.activeTargets) {
                  // Remove conflicting tracks from this cue's active targets
                  const remainingTracks = execution.activeTargets.filter(
                    (t: string) => !conflictingTrackIds.includes(t)
                  )
                  
                  if (remainingTracks.length === 0) {
                    // No tracks left, stop the entire cue
                    await get().stopCue(conflictingCueId)
                  } else {
                    // Update execution to only include remaining tracks
                    execution.activeTargets = remainingTracks
                    
                    // Stop animation only on conflicting tracks
                    const animationId = context.cuePlaybacks.get(conflictingCueId)
                    if (animationId) {
                      const { useAnimationStore } = await import('@/stores/animationStore')
                      const animationStore = useAnimationStore.getState()
                      
                      // Stop animation on conflicting tracks only
                      conflictingTrackIds.forEach(trackId => {
                        // Release track ownership
                        context.trackOwnership.delete(trackId)
                      })
                      
                      // Note: animationStore doesn't support per-track stop currently,
                      // but ownership is released so new cue can take over
                    }
                  }
                }
              }
            }
          }
          
          // Start animation via animation store
          const { useAnimationStore } = await import('@/stores/animationStore')
          const animationStore = useAnimationStore.getState()
          
          animationStore.playAnimation(animationId, trackIds)
          
          // Track execution
          const executionId = generateId()
          context.activeCues.set(cueId, {
            id: executionId,
            cueId,
            startTime: new Date(),
            state: 'running',
            // Don't set progress here - let CueButton calculate it locally
            activeTargets: trackIds
          })
          
          // Claim track ownership
          trackIds.forEach(trackId => {
            context.trackOwnership.set(trackId, cueId)
          })
          
          // Store playback reference
          context.cuePlaybacks.set(cueId, animationId)
          
          // Update cue status
          get().updateCue(cueId, { status: 'active' })
          
          set({ executionContext: { ...context } })
          
          console.log('✅ Animation cue executing:', cueId)
          
          // Determine if animation should loop
          // Priority: cue-specific loop setting > animation's loop setting
          const shouldLoop = cueData.loop !== undefined ? cueData.loop : animation.loop
          
          console.log(`🔁 Loop setting - Cue: ${cueData.loop}, Animation: ${animation.loop}, Final: ${shouldLoop}`)
          
          // Auto-stop after animation duration (ONLY if not looping)
          if (animation.duration && !shouldLoop) {
            const durationMs = animation.duration * 1000
            console.log(`⏰ Will auto-stop cue after ${animation.duration}s (not looping)`)
            
            setTimeout(() => {
              // Check if cue is still active
              const currentContext = get().executionContext
              if (currentContext.activeCues.has(cueId)) {
                console.log('⏱️ Auto-stopping cue after duration:', cueId)
                get().stopCue(cueId)
              }
            }, durationMs)
          } else if (shouldLoop) {
            console.log('🔁 Animation will loop indefinitely (no auto-stop)')
          }
        },
        
        /**
         * Execute OSC cue
         */
        _executeOSCCue: async (cueId: string, cue: Cue, context: ExecutionContext) => {
          const cueData = (cue as any).data || {}
          const messages = cueData.messages || []
          
          if (messages.length === 0) {
            console.warn('⚠️ OSC cue has no messages:', cueId)
            return
          }
          
          console.log('📡 Sending OSC messages:', messages.length)
          
          // Get OSC store
          const { useOSCStore } = await import('@/stores/oscStore')
          const oscStore = useOSCStore.getState()
          
          // Send each message
          for (const msg of messages) {
            if (msg.address && msg.address.trim() !== '') {
              console.log('  → OSC:', msg.address, msg.args || [])
              
              // Send via OSC store
              oscStore.sendMessage(msg.address, msg.args || [])
            }
          }
          
          // Mark as executed (instant)
          const executionId = generateId()
          context.activeCues.set(cueId, {
            id: executionId,
            cueId,
            startTime: new Date(),
            state: 'completed',
            activeTargets: []
          })
          
          // Update cue status briefly
          get().updateCue(cueId, { status: 'active' })
          set({ executionContext: { ...context } })
          
          // Remove after short delay (OSC cues are instant)
          setTimeout(() => {
            const currentContext = get().executionContext
            currentContext.activeCues.delete(cueId)
            get().updateCue(cueId, { status: 'idle' })
            set({ executionContext: { ...currentContext } })
            console.log('✅ OSC cue completed:', cueId)
          }, 200)
        },
        
        /**
         * Execute reset cue
         */
        _executeResetCue: async (cueId: string, cue: Cue, context: ExecutionContext) => {
          const cueData = (cue as any).data || {}
          const trackIds = cueData.trackIds || []
          const resetType = cueData.resetType || 'initial'
          const duration = cueData.duration || 1.0
          
          if (trackIds.length === 0) {
            console.warn('⚠️ Reset cue has no tracks:', cueId)
            return
          }
          
          console.log('🔄 Resetting tracks:', trackIds, 'to:', resetType, 'duration:', duration + 's')
          
          // Get project store
          const { useProjectStore } = await import('@/stores/projectStore')
          const projectStore = useProjectStore.getState()
          
          // Get OSC store for sending position updates
          const { useOSCStore } = await import('@/stores/oscStore')
          const oscStore = useOSCStore.getState()
          
          // Determine target positions and create reset data
          const resetData = trackIds.map((trackId: string) => {
            const track = projectStore.tracks.find(t => t.id === trackId)
            if (!track) return null
            
            let targetPos
            if (resetType === 'initial') {
              targetPos = track.initialPosition || { x: 0, y: 0, z: 0 }
            } else {
              targetPos = { x: 0, y: 0, z: 0 }
            }
            
            return {
              trackId,
              from: { ...track.position },
              to: targetPos
            }
          }).filter(Boolean)
          
          if (resetData.length === 0) {
            console.warn('⚠️ No valid tracks to reset')
            return
          }
          
          // Mark as executing
          const executionId = generateId()
          context.activeCues.set(cueId, {
            id: executionId,
            cueId,
            startTime: new Date(),
            state: 'running',
            activeTargets: trackIds
          })
          
          get().updateCue(cueId, { status: 'active' })
          set({ executionContext: { ...context } })
          
          // Perform smooth transition
          const startTime = Date.now()
          const durationMs = duration * 1000
          
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / durationMs, 1.0)
            
            // Linear easing
            resetData.forEach((data: any) => {
              const newPos = {
                x: data.from.x + (data.to.x - data.from.x) * progress,
                y: data.from.y + (data.to.y - data.from.y) * progress,
                z: data.from.z + (data.to.z - data.from.z) * progress
              }
              
              // Update track position in project store
              projectStore.updateTrack(data.trackId, { position: newPos })
              
              // Send OSC update
              const track = projectStore.tracks.find((t: any) => t.id === data.trackId)
              if (track) {
                // Get coordinate system from settings store
                const { useSettingsStore } = require('@/stores/settingsStore')
                const coordSystem = useSettingsStore.getState().oscSettings?.defaultCoordinateSystem || 'xyz'
                const trackIndex = track.holophonixIndex || (projectStore.tracks.indexOf(track) + 1)
                oscStore.sendMessage(`/track/${trackIndex}/${coordSystem}`, [newPos.x, newPos.y, newPos.z])
              }
            })
            
            if (progress < 1.0) {
              requestAnimationFrame(animate)
            } else {
              // Complete
              const currentContext = get().executionContext
              currentContext.activeCues.delete(cueId)
              get().updateCue(cueId, { status: 'idle' })
              set({ executionContext: { ...currentContext } })
              console.log('✅ Reset cue completed:', cueId)
            }
          }
          
          requestAnimationFrame(animate)
        },
        
        stopCue: async (cueId) => {
          console.log('⏹️ Cue stopped:', cueId)
          
          const context = get().executionContext
          const execution = context.activeCues.get(cueId)
          const animationId = context.cuePlaybacks.get(cueId)
          
          // Stop animation in animation store
          if (animationId) {
            const { useAnimationStore } = await import('@/stores/animationStore')
            const animationStore = useAnimationStore.getState()
            
            console.log('⏹️ Stopping animation:', animationId)
            animationStore.stopAnimation(animationId)
          }
          
          // Clear execution state
          context.activeCues.delete(cueId)
          context.cuePlaybacks.delete(cueId)
          
          // Clear track ownership
          const tracksToRelease: string[] = []
          context.trackOwnership.forEach((ownerCueId, trackId) => {
            if (ownerCueId === cueId) {
              tracksToRelease.push(trackId)
            }
          })
          tracksToRelease.forEach(trackId => {
            context.trackOwnership.delete(trackId)
          })
          
          // Update cue status
          get().updateCue(cueId, { status: 'idle' })
          
          set({ executionContext: { ...context } })
        },
        
        toggleCue: (cueId) => {
          const context = get().executionContext
          if (context.activeCues.has(cueId)) {
            get().stopCue(cueId)
          } else {
            get().triggerCue(cueId)
          }
        },
        
        panic: async () => {
          console.log('🚨 PANIC: Stopping all cues')
          
          const context = get().executionContext
          const activeCueIds = Array.from(context.activeCues.keys())
          
          // Stop all animations first
          const { useAnimationStore } = await import('@/stores/animationStore')
          const animationStore = useAnimationStore.getState()
          animationStore.stopAllAnimations()
          
          // Stop all cues
          for (const cueId of activeCueIds) {
            await get().stopCue(cueId)
          }
          
          set({
            executionContext: {
              ...context,
              activeCues: new Map(),
              trackOwnership: new Map(),
              cuePlaybacks: new Map()
            }
          })
        },
        
        // ========================================
        // CUE BANK MANAGEMENT
        // ========================================
        
        createCueBank: (name, rows, columns) => {
          const show = get().currentShow
          if (!show) return ''
          
          const { bankId, show: updatedShow } = BankActions.createCueBank(
            show,
            name,
            rows,
            columns
          )
          
          set({ currentShow: updatedShow })
          console.log('✅ Bank created:', bankId, name)
          return bankId
        },
        
        deleteCueBank: (bankId) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = BankActions.deleteCueBank(show, bankId)
          set({ currentShow: updatedShow })
          console.log('🗑️ Bank deleted:', bankId)
        },
        
        assignCueToSlot: (cueId, bankId, row, column) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = BankActions.assignCueToSlot(
            show,
            cueId,
            bankId,
            row,
            column
          )
          
          set({ currentShow: updatedShow })
          console.log('📌 Cue assigned to slot:', cueId, `[${row},${column}]`)
        },
        
        clearSlot: (bankId, row, column) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = BankActions.clearSlot(show, bankId, row, column)
          set({ currentShow: updatedShow })
          console.log('🧹 Slot cleared:', `[${row},${column}]`)
        },
        
        switchBank: (bankId) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = BankActions.switchBank(show, bankId)
          set({
            currentShow: updatedShow,
            selectedBankId: bankId
          })
          console.log('🔄 Switched to bank:', bankId)
        },
        
        moveCueSlot: (sourceBankId, sourceRow, sourceColumn, targetBankId, targetRow, targetColumn) => {
          const show = get().currentShow
          if (!show) return
          
          const updatedShow = BankActions.moveCueSlot(
            show,
            sourceBankId,
            sourceRow,
            sourceColumn,
            targetBankId,
            targetRow,
            targetColumn
          )
          
          set({ currentShow: updatedShow })
          console.log('↔️ Cue moved:', `[${sourceRow},${sourceColumn}]`, '→', `[${targetRow},${targetColumn}]`)
        },
        
        // ========================================
        // UTILITIES
        // ========================================
        
        getCueById: (cueId) => {
          const show = get().currentShow
          if (!show) return undefined
          return CueActions.getCueById(show, cueId)
        },
        
        getCueBankById: (bankId) => {
          const show = get().currentShow
          if (!show) return undefined
          return BankActions.getCueBankById(show, bankId)
        },
        
        getActiveCues: () => {
          const context = get().executionContext
          const cueIds = Array.from(context.activeCues.keys())
          return cueIds
            .map(id => get().getCueById(id))
            .filter(Boolean) as Cue[]
        },
        
        // ========================================
        // EXTERNAL TRIGGERS
        // ========================================
        
        handleOscTrigger: (address: string, args: any[]) => {
          const show = get().currentShow
          if (!show) return
          
          // Search all cues in all banks for matching OSC triggers
          for (const bank of show.cueBanks) {
            for (const slot of bank.slots) {
              if (!slot?.cueId) continue
              
              const cue = get().getCueById(slot.cueId)
              if (!cue) continue
              
              // Check if cue has matching OSC trigger
              const oscTrigger = cue.triggers?.find(t => 
                t.type === 'osc' && 
                t.enabled && 
                t.oscAddress === address
              )
              
              if (oscTrigger) {
                get().toggleCue(cue.id)
                return
              }
            }
          }
        },
        
        // ========================================
        // SETTINGS
        // ========================================
        
        updateSettings: (newSettings) => {
          set({
            settings: {
              ...get().settings,
              ...newSettings
            }
          })
          console.log('⚙️ Settings updated')
        },
        
        setPriorityMode: (mode) => {
          const context = get().executionContext
          set({
            executionContext: {
              ...context,
              priorityMode: mode
            }
          })
          console.log('🎯 Priority mode set to:', mode)
        },
        
        setDefaultTransition: (mode, duration) => {
          const context = get().executionContext
          set({
            executionContext: {
              ...context,
              defaultTransitionMode: mode,
              defaultTransitionDuration: duration ?? context.defaultTransitionDuration
            }
          })
          console.log('🔄 Default transition set to:', mode, duration ? `(${duration}s)` : '')
        },
      }),
      {
        name: 'cue-store-v2',
        partialize: (state) => ({
          currentShow: state.currentShow,
          settings: state.settings,
          executionContext: {
            priorityMode: state.executionContext.priorityMode,
            defaultTransitionMode: state.executionContext.defaultTransitionMode,
            defaultTransitionDuration: state.executionContext.defaultTransitionDuration,
            // Don't persist active state
            activeCues: new Map(),
            trackOwnership: new Map(),
            cuePlaybacks: new Map(),
          }
        }),
      }
    )
  )
)

// Export for backward compatibility during migration
export type { CueStoreV2State }
