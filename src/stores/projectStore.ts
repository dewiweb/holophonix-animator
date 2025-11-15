import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  Project,
  Track,
  Group,
  Animation,
  Timeline,
  AnimationPreset,
  OSCConnection,
  CoordinateSystem,
  EngineState,
  PerformanceMetrics,
} from '@/types'
import { generateId } from '@/utils'
import { serializeProject, deserializeProject, validateProject } from '@/utils/projectSerializer'

interface ProjectState {
  // Current project
  currentProject: Project | null
  currentFilePath: string | null

  // Project management
  createProject: (name: string, coordinateSystem: CoordinateSystem) => void
  loadProject: (project: Project) => void
  saveProject: () => Promise<void>
  saveProjectAs: () => Promise<void>
  openProject: () => Promise<void>
  closeProject: () => void

  // Project data
  tracks: Track[]
  groups: Group[]
  animations: Animation[]
  timelines: Timeline[]
  presets: AnimationPreset[]
  oscConnections: OSCConnection[]

  // Data management
  addTrack: (track: Omit<Track, 'id'>) => void
  updateTrack: (id: string, updates: Partial<Track>) => void
  removeTrack: (id: string) => void

  addGroup: (group: Omit<Group, 'id'>) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  removeGroup: (id: string) => void

  addAnimation: (animationData: Omit<Animation, 'id'> | Animation) => void
  updateAnimation: (id: string, updates: Partial<Animation>) => void
  removeAnimation: (id: string) => void

  // Selection
  selectedTracks: string[]
  selectedGroups: string[]
  selectTrack: (id: string, multiSelect?: boolean) => void
  selectTracks: (ids: string[]) => void  // Set multiple tracks in specific order
  selectGroup: (id: string, multiSelect?: boolean) => void
  clearSelection: () => void
}

export const useProjectStore = create<ProjectState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentProject: null,
    currentFilePath: null,
    tracks: [],
    groups: [],
    animations: [],
    timelines: [],
    presets: [],
    oscConnections: [],
    selectedTracks: [],
    selectedGroups: [],

    // Project management
    createProject: (name: string, coordinateSystem: CoordinateSystem) => {
      const project: Project = {
        id: generateId(),
        name,
        tracks: [],
        groups: [],
        animations: [],
        timelines: [],
        presets: [],
        coordinateSystem,
        oscConnections: [],
        show: undefined, // Will be created by user in cue system
        metadata: {
          created: new Date(),
          modified: new Date(),
          version: '2.0.0',
        },
      }

      set({
        currentProject: project,
        tracks: project.tracks,
        groups: project.groups,
        animations: project.animations,
        timelines: project.timelines,
        presets: project.presets,
        oscConnections: project.oscConnections,
      })
    },

    loadProject: async (project: Project) => {
      set({
        currentProject: project,
        tracks: project.tracks,
        groups: project.groups,
        animations: project.animations,
        timelines: project.timelines,
        presets: project.presets,
        oscConnections: project.oscConnections,
      })
      
      // Load show into cueStoreV2 if present
      if (project.show) {
        const cueStore = await import('../cues/storeV2').then(m => m.useCueStoreV2.getState())
        cueStore.loadShow(project.show)
        console.log('✅ Loaded show:', project.show.name)
      }
    },

    saveProject: async () => {
      const state = get()
      try {
        if (!state.currentProject) {
          console.warn('⚠️ No current project to save')
          return
        }

        // Check if running in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          let filePath = state.currentFilePath

          // If no file path or user wants to save as new file
          if (!filePath) {
            const saveResult = await (window as any).electronAPI.projectShowSaveDialog()
            if (saveResult.canceled) {
              return // User cancelled save dialog
            }
            filePath = saveResult.filePath
          }

          // CRITICAL FIX: Merge current state data into project before saving
          // Also sync OSC connections from oscStore and show from cueStoreV2
          const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
          const cueStore = await import('../cues/storeV2').then(m => m.useCueStoreV2.getState())
          
          const updatedProject: Project = {
            ...state.currentProject,
            tracks: state.tracks,
            groups: state.groups,
            animations: state.animations,
            timelines: state.timelines,
            presets: state.presets,
            oscConnections: oscStore.connections, // Use actual connections from oscStore
            show: cueStore.currentShow, // Include cue show data
            metadata: {
              ...state.currentProject.metadata,
              modified: new Date(),
            },
          }
          
          console.log('💾 Saving project with:', {
            tracks: updatedProject.tracks.length,
            animations: updatedProject.animations.length,
            oscConnections: updatedProject.oscConnections.length,
            show: updatedProject.show ? `"${updatedProject.show.name}"` : 'none',
          })

          // Serialize project with all current data
          const projectData = serializeProject(updatedProject)

          // Write file
          const writeResult = await (window as any).electronAPI.projectWriteFile(filePath, projectData)

          if (writeResult.success) {
            console.log('✅ Project saved to:', filePath)
            set({ currentFilePath: filePath })
          } else {
            console.error('❌ Failed to write project:', writeResult.error)
            alert(`Failed to save project: ${writeResult.error}`)
          }
        } else {
          console.warn('⚠️ Electron API not available - cannot save project files')
          alert('Project file operations are only available in the Electron app')
        }
      } catch (error) {
        console.error('❌ Error saving project:', error)
        alert(`Error saving project: ${(error as Error).message}`)
      }
    },

    saveProjectAs: async () => {
      const state = get()
      if (!state.currentProject) return

      // Sync OSC connections from oscStore and show from cueStoreV2
      const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
      const cueStore = await import('../cues/storeV2').then(m => m.useCueStoreV2.getState())

      const updatedProject: Project = {
        ...state.currentProject,
        tracks: state.tracks,
        groups: state.groups,
        animations: state.animations,
        timelines: state.timelines,
        presets: state.presets,
        oscConnections: oscStore.connections, // Use actual connections from oscStore
        show: cueStore.currentShow, // Include cue show data
        metadata: {
          ...state.currentProject.metadata,
          modified: new Date(),
        },
      }

      try {
        // Show save dialog
        const result = await (window as any).electronAPI.projectShowSaveDialog()
        
        if (!result.canceled && result.filePath) {
          const jsonData = serializeProject(updatedProject)
          const writeResult = await (window as any).electronAPI.projectWriteFile(result.filePath, jsonData)
          
          if (writeResult.success) {
            console.log('✅ Project saved to:', result.filePath)
            set({ 
              currentProject: updatedProject,
              currentFilePath: result.filePath
            })
          } else {
            console.error('❌ Failed to save project:', writeResult.error)
            alert(`Failed to save project: ${writeResult.error}`)
          }
        }
      } catch (error) {
        console.error('❌ Error saving project:', error)
        alert(`Error saving project: ${(error as Error).message}`)
      }
    },

    openProject: async () => {
      try {
        // Check if running in Electron environment
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          // Show open dialog
          const result = await (window as any).electronAPI.projectShowOpenDialog()

          if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0]

            // Read file
            const readResult = await (window as any).electronAPI.projectReadFile(filePath)

            if (readResult.success) {
              // Deserialize and validate
              const project = deserializeProject(readResult.data)

              if (validateProject(project)) {
                console.log('✅ Project loaded:', project.name)
                console.log('📂 Restored:', {
                  tracks: project.tracks.length,
                  animations: project.animations.length,
                  oscConnections: project.oscConnections.length,
                  show: project.show ? `"${project.show.name}"` : 'none',
                })

                // Load project into state
                set({
                  currentProject: project,
                  currentFilePath: filePath,
                  tracks: project.tracks,
                  groups: project.groups,
                  animations: project.animations,
                  timelines: project.timelines,
                  presets: project.presets,
                  oscConnections: project.oscConnections,
                })
                
                // Load show into cueStoreV2 if present
                if (project.show) {
                  const cueStore = await import('../cues/storeV2').then(m => m.useCueStoreV2.getState())
                  cueStore.loadShow(project.show)
                  console.log('✅ Loaded show:', project.show.name)
                }
                
                // Restore OSC connections to oscStore
                const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
                
                // Note: OSC connections need to be re-established (not just restored to state)
                // The connection objects contain runtime state that can't be serialized
                console.log('⚠️  Note: OSC connections need to be manually re-established')
                console.log('   Saved connection info:', project.oscConnections.map(c => `${c.host}:${c.port}`))
              } else {
                console.error('❌ Invalid project structure')
                alert('Invalid project file structure')
              }
            } else {
              console.error('❌ Failed to read project:', readResult.error)
              alert(`Failed to read project: ${readResult.error}`)
            }
          }
        } else {
          console.warn('⚠️ Electron API not available - cannot open project files')
          alert('Project file operations are only available in the Electron app')
        }
      } catch (error) {
        console.error('❌ Error opening project:', error)
        alert(`Error opening project: ${(error as Error).message}`)
      }
    },

    closeProject: () => {
      const state = get()
      if (state.currentProject) {
        // Save before closing
        get().saveProject()
      }

      set({
        currentProject: null,
        tracks: [],
        groups: [],
        animations: [],
        timelines: [],
        presets: [],
        oscConnections: [],
        selectedTracks: [],
        selectedGroups: [],
      })
    },

    // Track management
    addTrack: (trackData: Omit<Track, 'id'>) => {
      const newTrack: Track = {
        ...trackData,
        id: generateId(),
      }

      set(state => ({
        tracks: [...state.tracks, newTrack],
      }))
      
      // Update "Initial Positions" preset if it exists
      // (debounced to avoid excessive updates during batch adds)
      const updatePreset = async () => {
        try {
          const { updateInitialPositionsPreset } = await import('@/utils/osc/createInitialPreset')
          updateInitialPositionsPreset()
        } catch (error) {
          // Silently fail - preset system is optional
        }
      }
      
      // Debounce: only update after 1 second of no new tracks
      if ((globalThis as any)._initialPresetUpdateTimer) {
        clearTimeout((globalThis as any)._initialPresetUpdateTimer)
      }
      (globalThis as any)._initialPresetUpdateTimer = setTimeout(updatePreset, 1000)
    },

    updateTrack: (id: string, updates: Partial<Track>) => {
      // DEBUG: Log animationState updates
      if (updates.animationState) {
        console.log(`🔧 projectStore.updateTrack: Updating track ${id} animationState:`, {
          hasAnimation: !!updates.animationState.animation,
          animationId: updates.animationState.animation?.id,
          isPlaying: updates.animationState.isPlaying
        })
      }
      
      set(state => {
        // Find the track
        const trackIndex = state.tracks.findIndex(t => t.id === id)
        if (trackIndex === -1) return state
        
        const existingTrack = state.tracks[trackIndex]
        
        // If only position is being updated, check if it's significantly different
        // This prevents massive memory churn from 60 FPS updates
        if (updates.position && Object.keys(updates).length === 1) {
          const oldPos = existingTrack.position
          const newPos = updates.position
          const threshold = 0.0001 // Ignore sub-millimeter changes
          
          const deltaX = Math.abs(newPos.x - oldPos.x)
          const deltaY = Math.abs(newPos.y - oldPos.y)
          const deltaZ = Math.abs(newPos.z - oldPos.z)
          
          // Skip update if position hasn't changed significantly
          if (deltaX < threshold && deltaY < threshold && deltaZ < threshold) {
            return state // No change needed
          }
        }
        
        // Create new tracks array only when necessary
        const newTracks = [...state.tracks]
        newTracks[trackIndex] = { ...existingTrack, ...updates }
        
        return { tracks: newTracks }
      })
    },

    removeTrack: (id: string) => {
      set(state => ({
        tracks: state.tracks.filter(track => track.id !== id),
        selectedTracks: state.selectedTracks.filter(trackId => trackId !== id),
      }))
    },

    // Group management
    addGroup: (groupData: Omit<Group, 'id'>) => {
      const newGroup: Group = {
        ...groupData,
        id: generateId(),
      }

      set(state => ({
        groups: [...state.groups, newGroup],
      }))
    },

    updateGroup: (id: string, updates: Partial<Group>) => {
      set(state => ({
        groups: state.groups.map(group =>
          group.id === id ? { ...group, ...updates } : group
        ),
      }))
    },

    removeGroup: (id: string) => {
      set(state => ({
        groups: state.groups.filter(group => group.id !== id),
        selectedGroups: state.selectedGroups.filter(groupId => groupId !== id),
      }))
    },

    // Animation management
    addAnimation: (animationData: Omit<Animation, 'id'> | Animation) => {
      // If the animation already has an ID, use it; otherwise generate one
      const newAnimation: Animation = 'id' in animationData 
        ? { ...animationData } as Animation
        : { ...animationData, id: generateId() }

      set(state => {
        // Check if animation with this ID already exists
        const existingIndex = state.animations.findIndex(a => a.id === newAnimation.id)
        
        if (existingIndex !== -1) {
          // ID exists - update instead of adding duplicate
          console.warn('⚠️ Animation with ID already exists, updating instead:', newAnimation.id)
          const updatedAnimations = [...state.animations]
          updatedAnimations[existingIndex] = newAnimation
          return { animations: updatedAnimations }
        }
        
        // ID doesn't exist - add new animation
        return {
          animations: [...state.animations, newAnimation],
        }
      })
    },

    updateAnimation: (id: string, updates: Partial<Animation>) => {
      set(state => {
        const newAnimations = [...state.animations]
        const animationIndex = newAnimations.findIndex(animation => animation.id === id)
        if (animationIndex === -1) return state
        
        newAnimations[animationIndex] = { ...newAnimations[animationIndex], ...updates }
        
        return { animations: newAnimations }
      })
    },

    removeAnimation: (id: string) => {
      set(state => ({
        animations: state.animations.filter(animation => animation.id !== id),
      }))
    },

    // Selection management
    selectTrack: (id: string, multiSelect = false) => {
      set(state => {
        if (multiSelect) {
          const isSelected = state.selectedTracks.includes(id)
          return {
            selectedTracks: isSelected
              ? state.selectedTracks.filter(trackId => trackId !== id)
              : [...state.selectedTracks, id],
          }
        }
        return { selectedTracks: [id] }
      })
    },

    selectTracks: (ids: string[]) => {
      set({ selectedTracks: ids })
    },

    selectGroup: (id: string, multiSelect = false) => {
      set(state => {
        if (multiSelect) {
          const isSelected = state.selectedGroups.includes(id)
          return {
            selectedGroups: isSelected
              ? state.selectedGroups.filter(groupId => groupId !== id)
              : [...state.selectedGroups, id],
          }
        }
        return { selectedGroups: [id] }
      })
    },

    clearSelection: () => {
      set({
        selectedTracks: [],
        selectedGroups: [],
      })
    },
  }))
)
