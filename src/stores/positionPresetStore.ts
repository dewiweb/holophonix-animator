/**
 * Position Preset Store
 * 
 * Manages position presets and their application to tracks.
 * Integrates with project store for track data and animation store for transitions.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useProjectStore } from './projectStore'
import { useAnimationStore } from './animationStore'
import {
  PositionPreset,
  PositionPresetLibrary,
  PresetFolder,
  CaptureOptions,
  ApplyPresetOptions,
  PresetDiff,
  PresetStats,
  PresetValidation,
  PresetSortOptions,
  PresetSearchOptions,
  TransitionTarget,
  PresetCategory
} from '@/types/positionPreset'
import { Position } from '@/types'
import { generateId } from '@/utils'
import { calculateDistance } from '@/utils/interpolation/positionInterpolation'

// ========================================
// STORE INTERFACE
// ========================================

interface PositionPresetStore {
  // State
  presets: PositionPreset[]
  library: PositionPresetLibrary
  activePresetId: string | null
  isApplying: boolean
  
  // UI State
  selectedFolderId: string | null
  searchQuery: string
  sortOptions: PresetSortOptions
  
  // CRUD Operations
  createPreset: (data: Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'>) => string
  updatePreset: (id: string, updates: Partial<PositionPreset>) => void
  deletePreset: (id: string) => void
  duplicatePreset: (id: string, newName?: string) => string
  getPreset: (id: string) => PositionPreset | null
  
  // Capture
  captureCurrentPositions: (
    trackIds: string[],
    name: string,
    options?: Partial<CaptureOptions>
  ) => string
  
  // Apply
  applyPreset: (
    presetId: string,
    options?: ApplyPresetOptions
  ) => Promise<void>
  
  // Comparison & Analysis
  comparePresets: (presetId1: string, presetId2: string) => PresetDiff | null
  calculatePresetStats: (presetId: string) => PresetStats | null
  validatePreset: (presetId: string) => PresetValidation
  
  // Import/Export
  exportPreset: (id: string) => string
  importPreset: (json: string) => string | null
  exportLibrary: () => string
  importLibrary: (json: string, merge: boolean) => void
  
  // Organization
  createFolder: (name: string, parentId?: string) => string
  moveToFolder: (presetId: string, folderId: string) => void
  deleteFolder: (folderId: string) => void
  toggleFavorite: (presetId: string) => void
  addRecentlyUsed: (presetId: string) => void
  
  // Search & Filter
  searchPresets: (options: PresetSearchOptions) => PositionPreset[]
  setSearchQuery: (query: string) => void
  setSortOptions: (options: PresetSortOptions) => void
  
  // UI State
  setActivePreset: (id: string | null) => void
  setSelectedFolder: (id: string | null) => void
}

// ========================================
// STORE IMPLEMENTATION
// ========================================

export const usePositionPresetStore = create<PositionPresetStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    presets: [],
    library: {
      presets: [],
      categories: ['scene', 'formation', 'effect', 'safety', 'custom'],
      folders: [],
      favorites: [],
      recentlyUsed: []
    },
    activePresetId: null,
    isApplying: false,
    selectedFolderId: null,
    searchQuery: '',
    sortOptions: {
      by: 'modified',
      order: 'desc'
    },

    // ========================================
    // CRUD OPERATIONS
    // ========================================

    createPreset: (data) => {
      const now = new Date()
      const preset: PositionPreset = {
        ...data,
        id: generateId(),
        created: now,
        modified: now,
        version: 1
      }

      set(state => ({
        presets: [...state.presets, preset],
        library: {
          ...state.library,
          presets: [...state.library.presets, preset]
        }
      }))

      return preset.id
    },

    updatePreset: (id, updates) => {
      const now = new Date()
      
      set(state => ({
        presets: state.presets.map(preset =>
          preset.id === id
            ? { ...preset, ...updates, modified: now }
            : preset
        ),
        library: {
          ...state.library,
          presets: state.library.presets.map(preset =>
            preset.id === id
              ? { ...preset, ...updates, modified: now }
              : preset
          )
        }
      }))
    },

    deletePreset: (id) => {
      set(state => ({
        presets: state.presets.filter(p => p.id !== id),
        library: {
          ...state.library,
          presets: state.library.presets.filter(p => p.id !== id),
          favorites: state.library.favorites?.filter(fid => fid !== id),
          recentlyUsed: state.library.recentlyUsed?.filter(rid => rid !== id),
          folders: state.library.folders?.map(folder => ({
            ...folder,
            presetIds: folder.presetIds.filter(pid => pid !== id)
          }))
        },
        activePresetId: state.activePresetId === id ? null : state.activePresetId
      }))
    },

    duplicatePreset: (id, newName) => {
      const original = get().presets.find(p => p.id === id)
      if (!original) return ''

      const duplicate: PositionPreset = {
        ...original,
        id: generateId(),
        name: newName || `${original.name} (Copy)`,
        created: new Date(),
        modified: new Date()
      }

      set(state => ({
        presets: [...state.presets, duplicate],
        library: {
          ...state.library,
          presets: [...state.library.presets, duplicate]
        }
      }))

      return duplicate.id
    },

    getPreset: (id) => {
      return get().presets.find(p => p.id === id) || null
    },

    // ========================================
    // CAPTURE
    // ========================================

    captureCurrentPositions: (trackIds, name, options = {}) => {
      // Get current track positions from project store
      const projectStore = useProjectStore.getState()
      
      const positions: Record<string, Position> = {}
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find((t: any) => t.id === trackId)
        if (track) {
          positions[trackId] = { ...track.position }
        }
      })

      const preset: Omit<PositionPreset, 'id' | 'created' | 'modified' | 'version'> = {
        name,
        description: options.description,
        positions,
        trackIds,
        category: options.category || 'custom',
        tags: options.tags || [],
        scope: options.scope || 'project',
        mode: options.mode || 'absolute',
        referencePosition: options.referencePosition,
        projectId: projectStore.currentProject?.id
      }

      return get().createPreset(preset)
    },

    // ========================================
    // APPLY
    // ========================================

    applyPreset: async (presetId, options = {}) => {
      const preset = get().getPreset(presetId)
      if (!preset) {
        console.error(`Preset not found: ${presetId}`)
        return
      }

      set({ isApplying: true })

      try {
        const projectStore = useProjectStore.getState()
        const animationStore = useAnimationStore.getState()

        // Determine target tracks
        const targetTrackIds = options.trackIds || preset.trackIds

        // Stop animations if requested
        if (options.interruptAnimations) {
          targetTrackIds.forEach(trackId => {
            // Check if track has active animation
            animationStore.playingAnimations.forEach((anim: any, animId: string) => {
              if (anim.trackIds.includes(trackId)) {
                animationStore.stopAnimation(animId)
              }
            })
          })
        }

        // Build transition targets
        const targets: TransitionTarget[] = []
        targetTrackIds.forEach(trackId => {
          const track = projectStore.tracks.find((t: any) => t.id === trackId)
          const targetPos = preset.positions[trackId]
          
          if (track && targetPos) {
            targets.push({
              trackId,
              from: { ...track.position },
              to: { ...targetPos },
              distance: calculateDistance(track.position, targetPos),
              duration: options.transition?.duration || 1.0,
              easing: options.transition?.easing || 'ease-in-out'
            })
          }
        })

        // Apply transition
        if (options.transition && options.transition.duration > 0) {
          // Use animation store's _easeToPositions method for smooth transition
          const easeTargets = targets.map(t => ({
            trackId: t.trackId,
            from: t.from,
            to: t.to
          }))
          
          await animationStore._easeToPositions(
            easeTargets,
            options.transition.duration * 1000  // Convert to ms
          )
        } else {
          // Instant apply
          targets.forEach(target => {
            projectStore.updateTrack(target.trackId, { position: target.to })
          })
        }

        // Mark as recently used
        get().addRecentlyUsed(presetId)

      } catch (error) {
        console.error('Error applying preset:', error)
      } finally {
        set({ isApplying: false })
      }
    },

    // ========================================
    // COMPARISON & ANALYSIS
    // ========================================

    comparePresets: (presetId1, presetId2) => {
      const preset1 = get().getPreset(presetId1)
      const preset2 = get().getPreset(presetId2)
      
      if (!preset1 || !preset2) return null

      const allTrackIds = new Set([...preset1.trackIds, ...preset2.trackIds])
      const added: string[] = []
      const removed: string[] = []
      const moved: PresetDiff['moved'] = []
      const unchanged: string[] = []

      let totalDistance = 0

      allTrackIds.forEach(trackId => {
        const inPreset1 = preset1.trackIds.includes(trackId)
        const inPreset2 = preset2.trackIds.includes(trackId)

        if (!inPreset1 && inPreset2) {
          added.push(trackId)
        } else if (inPreset1 && !inPreset2) {
          removed.push(trackId)
        } else if (inPreset1 && inPreset2) {
          const pos1 = preset1.positions[trackId]
          const pos2 = preset2.positions[trackId]
          const distance = calculateDistance(pos1, pos2)

          if (distance > 0.001) {
            const dx = pos2.x - pos1.x
            const dy = pos2.y - pos1.y
            const dz = pos2.z - pos1.z
            const length = Math.sqrt(dx * dx + dy * dy + dz * dz)

            moved.push({
              trackId,
              trackName: trackId,  // Would look up actual name
              from: pos1,
              to: pos2,
              distance,
              direction: {
                x: length > 0 ? dx / length : 0,
                y: length > 0 ? dy / length : 0,
                z: length > 0 ? dz / length : 0
              }
            })
            totalDistance += distance
          } else {
            unchanged.push(trackId)
          }
        }
      })

      return {
        added,
        removed,
        moved,
        unchanged,
        stats: {
          totalTracks: allTrackIds.size,
          movedCount: moved.length,
          averageDistance: moved.length > 0 ? totalDistance / moved.length : 0,
          maxDistance: moved.length > 0 ? Math.max(...moved.map(m => m.distance)) : 0,
          minDistance: moved.length > 0 ? Math.min(...moved.map(m => m.distance)) : 0
        }
      }
    },

    calculatePresetStats: (presetId) => {
      const preset = get().getPreset(presetId)
      if (!preset) return null

      const positions = Object.values(preset.positions)
      if (positions.length === 0) {
        return {
          trackCount: 0,
          bounds: {
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 },
            center: { x: 0, y: 0, z: 0 }
          },
          averageDistanceFromOrigin: 0,
          maxDistanceFromOrigin: 0,
          averageDistanceBetweenTracks: 0,
          spatialDensity: 0,
          spreadFactor: 0
        }
      }

      // Calculate bounds
      const min = { x: Infinity, y: Infinity, z: Infinity }
      const max = { x: -Infinity, y: -Infinity, z: -Infinity }

      positions.forEach(pos => {
        min.x = Math.min(min.x, pos.x)
        min.y = Math.min(min.y, pos.y)
        min.z = Math.min(min.z, pos.z)
        max.x = Math.max(max.x, pos.x)
        max.y = Math.max(max.y, pos.y)
        max.z = Math.max(max.z, pos.z)
      })

      const center = {
        x: (min.x + max.x) / 2,
        y: (min.y + max.y) / 2,
        z: (min.z + max.z) / 2
      }

      // Calculate distances from origin
      const distancesFromOrigin = positions.map(pos =>
        Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)
      )
      const averageDistanceFromOrigin = distancesFromOrigin.reduce((a, b) => a + b, 0) / positions.length
      const maxDistanceFromOrigin = Math.max(...distancesFromOrigin)

      // Calculate average distance between tracks
      let totalDistance = 0
      let pairCount = 0
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          totalDistance += calculateDistance(positions[i], positions[j])
          pairCount++
        }
      }
      const averageDistanceBetweenTracks = pairCount > 0 ? totalDistance / pairCount : 0

      // Calculate volume and density
      const volume = (max.x - min.x) * (max.y - min.y) * (max.z - min.z)
      const spatialDensity = volume > 0 ? positions.length / volume : 0

      // Spread factor (0 = all at same point, 1 = maximally spread)
      const maxPossibleDistance = Math.sqrt(
        Math.pow(max.x - min.x, 2) +
        Math.pow(max.y - min.y, 2) +
        Math.pow(max.z - min.z, 2)
      )
      const spreadFactor = maxPossibleDistance > 0 ? averageDistanceBetweenTracks / maxPossibleDistance : 0

      return {
        trackCount: positions.length,
        bounds: { min, max, center },
        averageDistanceFromOrigin,
        maxDistanceFromOrigin,
        averageDistanceBetweenTracks,
        spatialDensity,
        spreadFactor
      }
    },

    validatePreset: (presetId) => {
      const preset = get().getPreset(presetId)
      const errors: string[] = []
      const warnings: string[] = []

      if (!preset) {
        errors.push('Preset not found')
        return {
          valid: false,
          errors,
          warnings,
          safetyChecks: {
            boundsCheck: false,
            collisionCheck: false,
            velocityCheck: false
          }
        }
      }

      // Check for empty preset
      if (preset.trackIds.length === 0) {
        errors.push('Preset has no tracks')
      }

      // Check for missing positions
      preset.trackIds.forEach(trackId => {
        if (!preset.positions[trackId]) {
          errors.push(`Missing position for track: ${trackId}`)
        }
      })

      // TODO: Implement actual safety checks
      const safetyChecks = {
        boundsCheck: true,
        collisionCheck: true,
        velocityCheck: true
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        safetyChecks
      }
    },

    // ========================================
    // IMPORT/EXPORT
    // ========================================

    exportPreset: (id) => {
      const preset = get().getPreset(id)
      if (!preset) return ''

      const exportData = {
        version: '1.0',
        exportDate: new Date(),
        preset,
        appVersion: '2.0.0'  // Would get from package.json
      }

      return JSON.stringify(exportData, null, 2)
    },

    importPreset: (json) => {
      try {
        const data = JSON.parse(json)
        const preset = data.preset

        // Generate new ID
        const newId = get().createPreset({
          ...preset,
          scope: 'project'  // Imported presets are project-scoped by default
        })

        return newId
      } catch (error) {
        console.error('Error importing preset:', error)
        return null
      }
    },

    exportLibrary: () => {
      const library = get().library

      const exportData = {
        version: '1.0',
        exportDate: new Date(),
        library,
        appVersion: '2.0.0'
      }

      return JSON.stringify(exportData, null, 2)
    },

    importLibrary: (json, merge) => {
      try {
        const data = JSON.parse(json)
        const importedLibrary = data.library

        if (merge) {
          // Merge with existing library
          set(state => ({
            library: {
              ...state.library,
              presets: [...state.library.presets, ...importedLibrary.presets],
              folders: [...(state.library.folders || []), ...(importedLibrary.folders || [])]
            },
            presets: [...state.presets, ...importedLibrary.presets]
          }))
        } else {
          // Replace library
          set({
            library: importedLibrary,
            presets: importedLibrary.presets
          })
        }
      } catch (error) {
        console.error('Error importing library:', error)
      }
    },

    // ========================================
    // ORGANIZATION
    // ========================================

    createFolder: (name, parentId) => {
      const folder: PresetFolder = {
        id: generateId(),
        name,
        presetIds: [],
        parentId,
        isExpanded: true
      }

      set(state => ({
        library: {
          ...state.library,
          folders: [...(state.library.folders || []), folder]
        }
      }))

      return folder.id
    },

    moveToFolder: (presetId, folderId) => {
      set(state => ({
        library: {
          ...state.library,
          folders: state.library.folders?.map(folder => {
            // Remove from all folders first
            const newPresetIds = folder.presetIds.filter(id => id !== presetId)
            
            // Add to target folder
            if (folder.id === folderId) {
              return { ...folder, presetIds: [...newPresetIds, presetId] }
            }
            
            return { ...folder, presetIds: newPresetIds }
          })
        }
      }))
    },

    deleteFolder: (folderId) => {
      set(state => ({
        library: {
          ...state.library,
          folders: state.library.folders?.filter(f => f.id !== folderId)
        },
        selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId
      }))
    },

    toggleFavorite: (presetId) => {
      set(state => {
        const favorites = state.library.favorites || []
        const isFavorite = favorites.includes(presetId)

        return {
          library: {
            ...state.library,
            favorites: isFavorite
              ? favorites.filter(id => id !== presetId)
              : [...favorites, presetId]
          }
        }
      })
    },

    addRecentlyUsed: (presetId) => {
      set(state => {
        const recentlyUsed = state.library.recentlyUsed || []
        const filtered = recentlyUsed.filter(id => id !== presetId)
        
        return {
          library: {
            ...state.library,
            recentlyUsed: [presetId, ...filtered].slice(0, 10)  // Keep last 10
          }
        }
      })
    },

    // ========================================
    // SEARCH & FILTER
    // ========================================

    searchPresets: (options) => {
      let results = [...get().presets]

      // Filter by query
      if (options.query) {
        const query = options.query.toLowerCase()
        results = results.filter(preset =>
          preset.name.toLowerCase().includes(query) ||
          preset.description?.toLowerCase().includes(query) ||
          preset.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Filter by categories
      if (options.categories && options.categories.length > 0) {
        results = results.filter(preset =>
          preset.category && options.categories!.includes(preset.category)
        )
      }

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        results = results.filter(preset =>
          preset.tags?.some(tag => options.tags!.includes(tag))
        )
      }

      // Filter by scope
      if (options.scope && options.scope !== 'all') {
        results = results.filter(preset => preset.scope === options.scope)
      }

      // Filter by track count
      if (options.minTracks !== undefined) {
        results = results.filter(preset => preset.trackIds.length >= options.minTracks!)
      }
      if (options.maxTracks !== undefined) {
        results = results.filter(preset => preset.trackIds.length <= options.maxTracks!)
      }

      return results
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query })
    },

    setSortOptions: (options) => {
      set({ sortOptions: options })
    },

    // ========================================
    // UI STATE
    // ========================================

    setActivePreset: (id) => {
      set({ activePresetId: id })
    },

    setSelectedFolder: (id) => {
      set({ selectedFolderId: id })
    }
  }))
)
