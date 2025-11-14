import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import {
  Cue,
  CueList,
  CueBank,
  CueStack,
  CueExecution,
  CueSlot,
  CueTrigger,
  CueStatus,
  CueSystemSettings,
  Show,
  CueTemplate
} from './types'
import { generateId } from '@/utils'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'
import { usePresetStore } from '@/stores/presetStore'
import { useOrchestrator, PlaybackPriority, type PlaybackId } from '@/orchestrator'

/**
 * Cue System Store
 * Manages live show control with cues
 */
interface CueStore {
  // Current show
  currentShow: Show | null
  
  // Active state
  activeCues: Map<string, CueExecution>
  armedCues: Set<string>
  
  // Orchestrator playback tracking
  cuePlaybacks: Map<string, PlaybackId>  // cueId -> playbackId
  
  // Selection
  selectedCueIds: string[]
  selectedBankId: string | null
  selectedListId: string | null
  
  // Templates
  templates: CueTemplate[]
  
  // Settings
  settings: CueSystemSettings
  
  // Actions - Show Management
  createShow: (name: string) => Show
  loadShow: (show: Show) => void
  saveShow: () => void
  deleteShow: () => void
  
  // Actions - Cue Management
  createCue: (cue: Omit<Cue, 'id'>) => string
  updateCue: (cueId: string, updates: Partial<Cue>) => void
  deleteCue: (cueId: string) => void
  duplicateCue: (cueId: string) => string | null
  
  // Actions - Cue Execution
  triggerCue: (cueId: string, velocity?: number) => void
  stopCue: (cueId: string, fadeOut?: number) => void
  toggleCue: (cueId: string) => void
  panic: () => void  // Emergency stop all
  
  // Actions - Cue Control
  armCue: (cueId: string) => void
  disarmCue: (cueId: string) => void
  goNextCue: () => void
  
  // Actions - Cue Banks
  createCueBank: (name: string, rows: number, columns: number) => string
  assignCueToSlot: (cueId: string, bankId: string, row: number, column: number) => void
  clearSlot: (bankId: string, row: number, column: number) => void
  switchBank: (bankId: string) => void
  
  // External trigger handlers
  handleOscTrigger: (address: string, args: any[]) => void
  handleMidiTrigger: (note: number, velocity: number, channel: number) => void
  
  // Utilities
  getCueById: (cueId: string) => Cue | undefined
  getCueBankById: (bankId: string) => CueBank | undefined
  getActiveCues: () => Cue[]
}

// Default settings
const defaultSettings: CueSystemSettings = {
  gridSize: { rows: 8, columns: 8 },
  defaultBank: '',
  defaultFadeTime: 1,
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

export const useCueStore = create<CueStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentShow: null,
        activeCues: new Map(),
        armedCues: new Set(),
        cuePlaybacks: new Map(),  // cueId -> playbackId
        selectedCueIds: [],
        selectedBankId: null,
        selectedListId: null,
        templates: [],
        settings: defaultSettings,
        
        // Show Management
        createShow: (name) => {
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
          const defaultBank: CueBank = {
            id: generateId(),
            name: 'Bank A',
            label: 'A',
            rows: 8,
            columns: 8,
            slots: [],
            isActive: true,
          }
          
          // Initialize slots
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              defaultBank.slots.push({
                row,
                column: col,
                isEmpty: true,
                isActive: false,
                isArmed: false,
              })
            }
          }
          
          show.cueBanks.push(defaultBank)
          show.activeBankId = defaultBank.id
          
          set({ 
            currentShow: show,
            selectedBankId: defaultBank.id,
          })
          
          return show
        },
        
        loadShow: (show) => {
          set({ 
            currentShow: show,
            selectedBankId: show.activeBankId || null,
            selectedListId: show.activeCueListId || null,
            activeCues: new Map(),
            armedCues: new Set(),
          })
        },
        
        saveShow: () => {
          const show = get().currentShow
          if (!show) return
          
          localStorage.setItem('holophonix-show', JSON.stringify(show))
        },
        
        deleteShow: () => {
          get().panic()
          set({ 
            currentShow: null,
            activeCues: new Map(),
            armedCues: new Set(),
            selectedCueIds: [],
            selectedBankId: null,
            selectedListId: null,
          })
        },
        
        // Cue Management
        createCue: (cueData) => {
          const show = get().currentShow
          if (!show) return ''
          
          const cue: Cue = {
            ...cueData,
            id: generateId(),
            status: 'idle',
            triggerCount: 0,
          }
          
          // Add to current bank if one is selected
          const bankId = get().selectedBankId
          if (bankId) {
            const bank = show.cueBanks.find(b => b.id === bankId)
            if (bank) {
              const emptySlot = bank.slots.find(s => s.isEmpty)
              if (emptySlot) {
                emptySlot.cueId = cue.id
                emptySlot.isEmpty = false
              }
            }
          }
          
          // Store cue in first list or create one
          if (show.cueLists.length === 0) {
            show.cueLists.push({
              id: generateId(),
              name: 'Main List',
              cues: [cue],
              cueOrder: [cue.id],
              autoFollow: false,
              loop: false,
              timecodeSync: false,
            })
          } else {
            show.cueLists[0].cues.push(cue)
            show.cueLists[0].cueOrder.push(cue.id)
          }
          
          set({ currentShow: { ...show } })
          return cue.id
        },
        
        updateCue: (cueId, updates) => {
          const show = get().currentShow
          if (!show) return
          
          show.cueLists.forEach(list => {
            const cueIndex = list.cues.findIndex(c => c.id === cueId)
            if (cueIndex !== -1) {
              list.cues[cueIndex] = { ...list.cues[cueIndex], ...updates }
            }
          })
          
          set({ currentShow: { ...show } })
        },
        
        deleteCue: (cueId) => {
          const show = get().currentShow
          if (!show) return
          
          if (get().activeCues.has(cueId)) {
            get().stopCue(cueId)
          }
          
          show.cueLists.forEach(list => {
            list.cues = list.cues.filter(c => c.id !== cueId)
            list.cueOrder = list.cueOrder.filter(id => id !== cueId)
          })
          
          show.cueBanks.forEach(bank => {
            bank.slots.forEach(slot => {
              if (slot.cueId === cueId) {
                slot.cueId = undefined
                slot.isEmpty = true
                slot.isActive = false
                slot.isArmed = false
              }
            })
          })
          
          set({ 
            currentShow: { ...show },
            selectedCueIds: get().selectedCueIds.filter(id => id !== cueId),
            armedCues: new Set([...get().armedCues].filter(id => id !== cueId)),
          })
        },
        
        duplicateCue: (cueId) => {
          const cue = get().getCueById(cueId)
          if (!cue) return null
          
          const newCue: Omit<Cue, 'id'> = {
            ...cue,
            name: `${cue.name} (Copy)`,
            status: 'idle',
            triggerCount: 0,
            lastTriggered: undefined,
          }
          
          return get().createCue(newCue)
        },
        
        // Cue Execution
        triggerCue: (cueId, velocity = 1) => {
          const cue = get().getCueById(cueId)
          if (!cue || !cue.isEnabled) return
          
          if (get().activeCues.has(cueId)) {
            if (cue.action === 'toggle') {
              get().stopCue(cueId)
              return
            }
          }
          
          const execution: CueExecution = {
            id: generateId(),
            cueId,
            startTime: new Date(),
            state: 'preparing',
            progress: 0,
            activeTargets: [],
          }
          
          const activeCues = new Map(get().activeCues)
          activeCues.set(cueId, execution)
          
          get().updateCue(cueId, { 
            status: 'active',
            lastTriggered: new Date(),
            triggerCount: cue.triggerCount + 1,
          })
          
          // Execute cue action
          const orchestrator = useOrchestrator.getState()
          const projectStore = useProjectStore.getState()
          
          switch (cue.action) {
            case 'play':
              // Handle three cases: preset, locked animation, unlocked animation
              if (cue.parameters.presetId) {
                // MODE 1: Using a preset - requires track selection
                const presetStore = usePresetStore.getState()
                const preset = presetStore.presets.find(p => p.id === cue.parameters.presetId)
                
                if (!preset) {
                  console.error(`Preset ${cue.parameters.presetId} not found`)
                  break
                }
                
                const trackIds = cue.parameters.trackIds || []
                if (trackIds.length === 0) {
                  console.warn('No tracks selected for preset')
                  break
                }
                
                // Create temporary animation from preset
                const tempAnimation = {
                  id: `temp-preset-${Date.now()}`,
                  ...preset.animation,
                  name: preset.name
                }
                
                // Add to project temporarily
                projectStore.addAnimation(tempAnimation)
                
                // Play via orchestrator
                orchestrator.play({
                  animationId: tempAnimation.id,
                  trackIds,
                  priority: PlaybackPriority.NORMAL,
                  source: 'cue',
                  sourceId: cueId,
                  loop: cue.parameters.loop,
                  speed: cue.parameters.playbackSpeed
                }).then(playbackId => {
                  get().cuePlaybacks.set(cueId, playbackId)
                  set({ cuePlaybacks: new Map(get().cuePlaybacks) })
                }).catch(error => {
                  console.error('Failed to play preset:', error)
                })
                
              } else if (cue.parameters.animationId) {
                // MODE 2: Using saved animation
                const animation = projectStore.animations.find(
                  a => a.id === cue.parameters.animationId
                )
                
                if (!animation) {
                  console.error(`Animation ${cue.parameters.animationId} not found`)
                  break
                }
                
                // Determine track IDs based on lock status
                let trackIds: string[]
                if (animation.trackIds && animation.trackSelectionLocked) {
                  // LOCKED: Use animation's embedded tracks
                  console.log('🔒 Using locked tracks from animation:', animation.trackIds)
                  trackIds = animation.trackIds
                } else {
                  // UNLOCKED: Use cue's track selection or fallback
                  trackIds = cue.parameters.trackIds || projectStore.selectedTracks
                  console.log('Using cue track selection:', trackIds)
                }
                
                // Play via orchestrator
                orchestrator.play({
                  animationId: animation.id,
                  trackIds,
                  priority: PlaybackPriority.NORMAL,
                  source: 'cue',
                  sourceId: cueId,
                  loop: cue.parameters.loop,
                  speed: cue.parameters.playbackSpeed,
                  reverse: cue.parameters.reverse
                }).then(playbackId => {
                  get().cuePlaybacks.set(cueId, playbackId)
                  set({ cuePlaybacks: new Map(get().cuePlaybacks) })
                }).catch(error => {
                  console.error('Failed to play animation:', error)
                })
              }
              break
            case 'stop':
              // Stop via orchestrator
              const playbackId = get().cuePlaybacks.get(cueId)
              if (playbackId) {
                orchestrator.stop(playbackId)
                get().cuePlaybacks.delete(cueId)
                set({ cuePlaybacks: new Map(get().cuePlaybacks) })
              } else {
                orchestrator.stopAll()
              }
              break
            case 'pause':
              // Pause via orchestrator
              const pausePlaybackId = get().cuePlaybacks.get(cueId)
              if (pausePlaybackId) {
                orchestrator.pause(pausePlaybackId)
              }
              break
            case 'trigger':
              // Trigger other cues
              cue.targets.forEach(target => {
                if (target.type === 'cue') {
                  get().triggerCue(target.id)
                }
              })
              break
          }
          
          set({ activeCues })
          
          // Handle follow actions
          if (cue.followActions) {
            cue.followActions.forEach(action => {
              if (action.type === 'go' && action.targetCueId) {
                setTimeout(() => {
                  get().triggerCue(action.targetCueId!)
                }, (action.delay || 0) * 1000)
              }
            })
          }
        },
        
        stopCue: (cueId, fadeOut) => {
          const execution = get().activeCues.get(cueId)
          if (!execution) return
          
          const cue = get().getCueById(cueId)
          if (!cue) return
          
          // Stop via orchestrator
          const orchestrator = useOrchestrator.getState()
          const playbackId = get().cuePlaybacks.get(cueId)
          if (playbackId) {
            orchestrator.stop(playbackId)
            get().cuePlaybacks.delete(cueId)
            set({ cuePlaybacks: new Map(get().cuePlaybacks) })
          }
          
          const activeCues = new Map(get().activeCues)
          activeCues.delete(cueId)
          
          get().updateCue(cueId, { status: 'idle' })
          set({ activeCues })
        },
        
        toggleCue: (cueId) => {
          if (get().activeCues.has(cueId)) {
            get().stopCue(cueId)
          } else {
            get().triggerCue(cueId)
          }
        },
        
        // Cue Control
        armCue: (cueId) => {
          const armedCues = new Set(get().armedCues)
          armedCues.add(cueId)
          
          get().updateCue(cueId, { status: 'armed' })
          set({ armedCues })
        },
        
        disarmCue: (cueId) => {
          const armedCues = new Set(get().armedCues)
          armedCues.delete(cueId)
          
          get().updateCue(cueId, { status: 'idle' })
          set({ armedCues })
        },
        
        goNextCue: () => {
          const show = get().currentShow
          const listId = get().selectedListId
          if (!show || !listId) return
          
          const list = show.cueLists.find(l => l.id === listId)
          if (!list) return
          
          const currentIndex = list.currentCueId 
            ? list.cueOrder.indexOf(list.currentCueId)
            : -1
          
          const nextIndex = currentIndex + 1
          if (nextIndex < list.cueOrder.length) {
            const nextCueId = list.cueOrder[nextIndex]
            list.currentCueId = nextCueId
            get().triggerCue(nextCueId)
          }
          
          set({ currentShow: { ...show } })
        },
        
        panic: () => {
          const activeCueIds = Array.from(get().activeCues.keys())
          activeCueIds.forEach(cueId => {
            get().stopCue(cueId, 0)
          })
          
          const animationStore = useAnimationStore.getState()
          if (animationStore.isPlaying) {
            animationStore.stopAnimation()
          }
          
          set({ 
            activeCues: new Map(),
            armedCues: new Set(),
          })
          
          console.log('🚨 PANIC: All cues stopped')
        },
        
        // Cue Banks
        createCueBank: (name, rows, columns) => {
          const show = get().currentShow
          if (!show) return ''
          
          const bank: CueBank = {
            id: generateId(),
            name,
            label: String.fromCharCode(65 + show.cueBanks.length),
            rows,
            columns,
            slots: [],
            isActive: false,
          }
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
              bank.slots.push({
                row,
                column: col,
                isEmpty: true,
                isActive: false,
                isArmed: false,
              })
            }
          }
          
          show.cueBanks.push(bank)
          set({ currentShow: { ...show } })
          
          return bank.id
        },
        
        assignCueToSlot: (cueId, bankId, row, column) => {
          const show = get().currentShow
          if (!show) return
          
          const bank = show.cueBanks.find(b => b.id === bankId)
          if (!bank) return
          
          const slot = bank.slots.find(s => s.row === row && s.column === column)
          if (!slot) return
          
          slot.cueId = cueId
          slot.isEmpty = false
          
          set({ currentShow: { ...show } })
        },
        
        clearSlot: (bankId, row, column) => {
          const show = get().currentShow
          if (!show) return
          
          const bank = show.cueBanks.find(b => b.id === bankId)
          if (!bank) return
          
          const slot = bank.slots.find(s => s.row === row && s.column === column)
          if (!slot) return
          
          slot.cueId = undefined
          slot.isEmpty = true
          slot.isActive = false
          slot.isArmed = false
          
          set({ currentShow: { ...show } })
        },
        
        switchBank: (bankId) => {
          const show = get().currentShow
          if (!show) return
          
          show.cueBanks.forEach(bank => {
            bank.isActive = bank.id === bankId
          })
          
          show.activeBankId = bankId
          set({ 
            currentShow: { ...show },
            selectedBankId: bankId,
          })
        },
        
        // External trigger handlers
        handleOscTrigger: (address: string, args: any[]) => {
          const show = get().currentShow
          if (!show) return
          
          // Find all cues with OSC triggers matching this address
          for (const list of show.cueLists) {
            for (const cue of list.cues) {
              const oscTrigger = cue.triggers.find(t => 
                t.type === 'osc' && 
                t.enabled && 
                t.oscAddress === address
              )
              
              if (oscTrigger) {
                // Trigger the cue with velocity from first OSC arg if available
                const velocity = typeof args[0] === 'number' ? args[0] : 1
                get().triggerCue(cue.id, velocity)
              }
            }
          }
        },
        
        handleMidiTrigger: (note: number, velocity: number, channel: number) => {
          // MIDI support removed - method kept for backward compatibility
          console.warn('MIDI triggers are no longer supported')
        },
        
        // Utilities
        getCueById: (cueId) => {
          const show = get().currentShow
          if (!show) return undefined
          
          for (const list of show.cueLists) {
            const cue = list.cues.find(c => c.id === cueId)
            if (cue) return cue
          }
          
          return undefined
        },
        
        getCueBankById: (bankId) => {
          const show = get().currentShow
          if (!show) return undefined
          
          return show.cueBanks.find(b => b.id === bankId)
        },
        
        getActiveCues: () => {
          const cueIds = Array.from(get().activeCues.keys())
          return cueIds.map(id => get().getCueById(id)).filter(Boolean) as Cue[]
        },
      }),
      {
        name: 'cue-store',
        partialize: (state) => ({
          currentShow: state.currentShow,
          templates: state.templates,
          settings: state.settings,
        }),
      }
    )
  )
)
