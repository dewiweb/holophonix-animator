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

  addAnimation: (animation: Omit<Animation, 'id'>) => void
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

    loadProject: (project: Project) => {
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

    saveProject: async () => {
      const state = get()
      if (!state.currentProject) return

      const updatedProject: Project = {
        ...state.currentProject,
        tracks: state.tracks,
        groups: state.groups,
        animations: state.animations,
        timelines: state.timelines,
        presets: state.presets,
        oscConnections: state.oscConnections,
        metadata: {
          ...state.currentProject.metadata,
          modified: new Date(),
        },
      }

      // If no file path exists, show save dialog
      if (!state.currentFilePath) {
        await get().saveProjectAs()
        return
      }

      // Save to existing file
      try {
        const jsonData = serializeProject(updatedProject)
        const result = await (window as any).electronAPI.projectWriteFile(state.currentFilePath, jsonData)
        
        if (result.success) {
          console.log('✅ Project saved to:', state.currentFilePath)
          set({ currentProject: updatedProject })
        } else {
          console.error('❌ Failed to save project:', result.error)
          alert(`Failed to save project: ${result.error}`)
        }
      } catch (error) {
        console.error('❌ Error saving project:', error)
        alert(`Error saving project: ${(error as Error).message}`)
      }
    },

    saveProjectAs: async () => {
      const state = get()
      if (!state.currentProject) return

      const updatedProject: Project = {
        ...state.currentProject,
        tracks: state.tracks,
        groups: state.groups,
        animations: state.animations,
        timelines: state.timelines,
        presets: state.presets,
        oscConnections: state.oscConnections,
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
              console.log('✅ Project loaded from:', filePath)
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
            } else {
              console.error('❌ Invalid project structure')
              alert('Invalid project file format')
            }
          } else {
            console.error('❌ Failed to read project:', readResult.error)
            alert(`Failed to read project: ${readResult.error}`)
          }
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
    },

    updateTrack: (id: string, updates: Partial<Track>) => {
      set(state => ({
        tracks: state.tracks.map(track =>
          track.id === id ? { ...track, ...updates } : track
        ),
      }))
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
    addAnimation: (animationData: Omit<Animation, 'id'>) => {
      const newAnimation: Animation = {
        ...animationData,
        id: generateId(),
      }

      set(state => ({
        animations: [...state.animations, newAnimation],
      }))
    },

    updateAnimation: (id: string, updates: Partial<Animation>) => {
      set(state => ({
        animations: state.animations.map(animation =>
          animation.id === id ? { ...animation, ...updates } : animation
        ),
      }))
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
