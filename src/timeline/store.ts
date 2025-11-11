import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { persist } from 'zustand/middleware'
import { 
  Timeline, 
  TimelineTrack, 
  TimelineItem,
  TimelineMarker,
  TimelineRegion,
  TimelineTransport,
  TimelineSelection,
  TimelineEdit,
  TimelineSnapshot,
  TimelineViewSettings,
  ClipData,
  AutomationPoint,
  CueData
} from './types'
import { generateId } from '@/utils'

/**
 * Timeline Store
 * Manages the advanced timeline system state
 */
interface TimelineStore {
  // Current timeline
  currentTimeline: Timeline | null
  
  // Selection state
  selection: TimelineSelection
  
  // Edit history
  undoStack: TimelineEdit[]
  redoStack: TimelineEdit[]
  
  // Snapshots
  snapshots: TimelineSnapshot[]
  
  // Clipboard
  clipboard: {
    items: TimelineItem[]
    tracks: TimelineTrack[]
  } | null
  
  // Playback state (mirrors transport)
  isPlaying: boolean
  currentTime: number
  
  // Actions - Timeline Management
  createTimeline: (name: string, duration?: number) => Timeline
  loadTimeline: (timeline: Timeline) => void
  deleteTimeline: () => void
  duplicateTimeline: () => Timeline | null
  
  // Actions - Tracks
  addTrack: (track: Omit<TimelineTrack, 'id'>) => string
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void
  deleteTrack: (trackId: string) => void
  moveTrack: (trackId: string, newIndex: number) => void
  duplicateTrack: (trackId: string) => string | null
  
  // Actions - Items
  addItem: (item: Omit<TimelineItem, 'id'>) => string
  updateItem: (itemId: string, updates: Partial<TimelineItem>) => void
  deleteItem: (itemId: string) => void
  moveItem: (itemId: string, newTime: number, newTrackId?: string) => void
  splitItem: (itemId: string, splitTime: number) => string | null
  trimItem: (itemId: string, newStart: number, newEnd: number) => void
  
  // Actions - Selection
  selectTracks: (trackIds: string[], additive?: boolean) => void
  selectItems: (itemIds: string[], additive?: boolean) => void
  selectTimeRange: (start: number, end: number) => void
  clearSelection: () => void
  
  // Actions - Clipboard
  cut: () => void
  copy: () => void
  paste: (time?: number, trackId?: string) => void
  
  // Actions - Transport
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setLoopPoints: (start: number, end: number) => void
  toggleLoop: () => void
  
  // Actions - Markers & Regions
  addMarker: (marker: Omit<TimelineMarker, 'id'>) => string
  updateMarker: (markerId: string, updates: Partial<TimelineMarker>) => void
  deleteMarker: (markerId: string) => void
  addRegion: (region: Omit<TimelineRegion, 'id'>) => string
  updateRegion: (regionId: string, updates: Partial<TimelineRegion>) => void
  deleteRegion: (regionId: string) => void
  
  // Actions - View
  updateViewSettings: (updates: Partial<TimelineViewSettings>) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: () => void
  scrollToTime: (time: number) => void
  
  // Actions - History
  undo: () => void
  redo: () => void
  createSnapshot: (name: string, description?: string) => void
  restoreSnapshot: (snapshotId: string) => void
  
  // Actions - Import/Export
  exportTimeline: (format?: string) => any
  importTimeline: (data: any, format?: string) => void
  
  // Utility
  getTrackById: (trackId: string) => TimelineTrack | undefined
  getItemById: (itemId: string) => TimelineItem | undefined
  getItemsInRange: (start: number, end: number, trackId?: string) => TimelineItem[]
  getItemsAtTime: (time: number, trackId?: string) => TimelineItem[]
}

export const useTimelineStore = create<TimelineStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentTimeline: null,
        selection: {
          tracks: [],
          items: [],
        },
        undoStack: [],
        redoStack: [],
        snapshots: [],
        clipboard: null,
        isPlaying: false,
        currentTime: 0,
        
        // Timeline Management
        createTimeline: (name, duration = 60) => {
          const timeline: Timeline = {
            id: generateId(),
            name,
            duration,
            frameRate: 60,
            timeFormat: 'seconds',
            tracks: [],
            viewSettings: {
              visibleStartTime: 0,
              visibleEndTime: Math.min(duration, 30),
              horizontalZoom: 100,
              verticalZoom: 1,
              snapToGrid: true,
              gridSize: 1,
              gridType: 'seconds',
              showWaveforms: true,
              showAutomation: true,
              showMarkers: true,
              showRegions: true,
              showTimecodeRuler: true,
              trackHeight: 'medium',
              showTrackHeaders: true,
              showTrackControls: true,
            },
            markers: [],
            regions: [],
            transport: {
              isPlaying: false,
              isPaused: false,
              isLooping: false,
              isRecording: false,
              currentTime: 0,
              playbackSpeed: 1,
              isSynced: false,
            },
            created: new Date(),
            modified: new Date(),
          }
          
          set({ currentTimeline: timeline })
          return timeline
        },
        
        loadTimeline: (timeline) => {
          set({ 
            currentTimeline: timeline,
            selection: { tracks: [], items: [] },
            currentTime: 0,
            isPlaying: false
          })
        },
        
        deleteTimeline: () => {
          set({ currentTimeline: null })
        },
        
        duplicateTimeline: () => {
          const current = get().currentTimeline
          if (!current) return null
          
          const duplicate: Timeline = {
            ...current,
            id: generateId(),
            name: `${current.name} (Copy)`,
            created: new Date(),
            modified: new Date(),
            tracks: current.tracks.map(track => ({
              ...track,
              id: generateId(),
              items: track.items.map(item => ({
                ...item,
                id: generateId(),
              }))
            })),
            markers: current.markers.map(m => ({ ...m, id: generateId() })),
            regions: current.regions.map(r => ({ ...r, id: generateId() })),
          }
          
          set({ currentTimeline: duplicate })
          return duplicate
        },
        
        // Track Management
        addTrack: (trackData) => {
          const timeline = get().currentTimeline
          if (!timeline) return ''
          
          const track: TimelineTrack = {
            ...trackData,
            id: generateId(),
            items: trackData.items || [],
          }
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: [...timeline.tracks, track],
              modified: new Date(),
            }
          })
          
          return track.id
        },
        
        updateTrack: (trackId, updates) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.map(track =>
                track.id === trackId ? { ...track, ...updates } : track
              ),
              modified: new Date(),
            }
          })
        },
        
        deleteTrack: (trackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.filter(track => track.id !== trackId),
              modified: new Date(),
            },
            selection: {
              ...get().selection,
              tracks: get().selection.tracks.filter(id => id !== trackId),
            }
          })
        },
        
        moveTrack: (trackId, newIndex) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          const tracks = [...timeline.tracks]
          const currentIndex = tracks.findIndex(t => t.id === trackId)
          if (currentIndex === -1) return
          
          const [track] = tracks.splice(currentIndex, 1)
          tracks.splice(newIndex, 0, track)
          
          set({
            currentTimeline: {
              ...timeline,
              tracks,
              modified: new Date(),
            }
          })
        },
        
        duplicateTrack: (trackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return null
          
          const track = timeline.tracks.find(t => t.id === trackId)
          if (!track) return null
          
          const duplicate: TimelineTrack = {
            ...track,
            id: generateId(),
            name: `${track.name} (Copy)`,
            items: track.items.map(item => ({
              ...item,
              id: generateId(),
            }))
          }
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: [...timeline.tracks, duplicate],
              modified: new Date(),
            }
          })
          
          return duplicate.id
        },
        
        // Item Management
        addItem: (itemData) => {
          const timeline = get().currentTimeline
          if (!timeline) return ''
          
          const item: TimelineItem = {
            ...itemData,
            id: generateId(),
          }
          
          const trackIndex = timeline.tracks.findIndex(t => t.id === item.trackId)
          if (trackIndex === -1) return ''
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.map(track =>
                track.id === item.trackId
                  ? { ...track, items: [...track.items, item] }
                  : track
              ),
              modified: new Date(),
            }
          })
          
          return item.id
        },
        
        updateItem: (itemId, updates) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.map(track => ({
                ...track,
                items: track.items.map(item =>
                  item.id === itemId ? { ...item, ...updates } : item
                )
              })),
              modified: new Date(),
            }
          })
        },
        
        deleteItem: (itemId) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.map(track => ({
                ...track,
                items: track.items.filter(item => item.id !== itemId)
              })),
              modified: new Date(),
            },
            selection: {
              ...get().selection,
              items: get().selection.items.filter(id => id !== itemId),
            }
          })
        },
        
        moveItem: (itemId, newTime, newTrackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          let movedItem: TimelineItem | undefined
          
          // Remove item from current track
          const tracks = timeline.tracks.map(track => ({
            ...track,
            items: track.items.filter(item => {
              if (item.id === itemId) {
                movedItem = { ...item, startTime: newTime }
                if (newTrackId) {
                  movedItem.trackId = newTrackId
                }
                return false
              }
              return true
            })
          }))
          
          // Add item to new track (or same track)
          if (movedItem) {
            const targetTrackId = newTrackId || movedItem.trackId
            const updatedTracks = tracks.map(track =>
              track.id === targetTrackId
                ? { ...track, items: [...track.items, movedItem!] }
                : track
            )
            
            set({
              currentTimeline: {
                ...timeline,
                tracks: updatedTracks,
                modified: new Date(),
              }
            })
          }
        },
        
        splitItem: (itemId, splitTime) => {
          const timeline = get().currentTimeline
          if (!timeline) return null
          
          let newItemId: string | null = null
          
          const tracks = timeline.tracks.map(track => {
            const items = [...track.items]
            const itemIndex = items.findIndex(item => item.id === itemId)
            
            if (itemIndex !== -1) {
              const item = items[itemIndex]
              const itemEnd = item.startTime + item.duration
              
              if (splitTime > item.startTime && splitTime < itemEnd) {
                // Create first part
                const firstPart = {
                  ...item,
                  duration: splitTime - item.startTime,
                }
                
                // Create second part
                const secondPart = {
                  ...item,
                  id: generateId(),
                  startTime: splitTime,
                  duration: itemEnd - splitTime,
                }
                
                newItemId = secondPart.id
                
                // Replace original with two parts
                items.splice(itemIndex, 1, firstPart, secondPart)
              }
            }
            
            return { ...track, items }
          })
          
          if (newItemId) {
            set({
              currentTimeline: {
                ...timeline,
                tracks,
                modified: new Date(),
              }
            })
          }
          
          return newItemId
        },
        
        trimItem: (itemId, newStart, newEnd) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              tracks: timeline.tracks.map(track => ({
                ...track,
                items: track.items.map(item =>
                  item.id === itemId
                    ? {
                        ...item,
                        startTime: newStart,
                        duration: newEnd - newStart,
                      }
                    : item
                )
              })),
              modified: new Date(),
            }
          })
        },
        
        // Selection
        selectTracks: (trackIds, additive = false) => {
          set({
            selection: {
              ...get().selection,
              tracks: additive
                ? [...new Set([...get().selection.tracks, ...trackIds])]
                : trackIds,
            }
          })
        },
        
        selectItems: (itemIds, additive = false) => {
          set({
            selection: {
              ...get().selection,
              items: additive
                ? [...new Set([...get().selection.items, ...itemIds])]
                : itemIds,
            }
          })
        },
        
        selectTimeRange: (start, end) => {
          set({
            selection: {
              ...get().selection,
              timeRange: { start, end },
            }
          })
        },
        
        clearSelection: () => {
          set({
            selection: {
              tracks: [],
              items: [],
              timeRange: undefined,
            }
          })
        },
        
        // Clipboard operations
        cut: () => {
          const state = get()
          const timeline = state.currentTimeline
          if (!timeline) return
          
          const selectedItems: TimelineItem[] = []
          timeline.tracks.forEach(track => {
            track.items.forEach(item => {
              if (state.selection.items.includes(item.id)) {
                selectedItems.push(item)
              }
            })
          })
          
          set({ clipboard: { items: selectedItems, tracks: [] } })
          
          // Delete cut items
          selectedItems.forEach(item => {
            get().deleteItem(item.id)
          })
        },
        
        copy: () => {
          const state = get()
          const timeline = state.currentTimeline
          if (!timeline) return
          
          const selectedItems: TimelineItem[] = []
          timeline.tracks.forEach(track => {
            track.items.forEach(item => {
              if (state.selection.items.includes(item.id)) {
                selectedItems.push({ ...item })
              }
            })
          })
          
          set({ clipboard: { items: selectedItems, tracks: [] } })
        },
        
        paste: (time, trackId) => {
          const clipboard = get().clipboard
          if (!clipboard || clipboard.items.length === 0) return
          
          const pasteTime = time ?? get().currentTime
          const targetTrackId = trackId ?? get().selection.tracks[0]
          
          if (!targetTrackId) return
          
          clipboard.items.forEach(item => {
            get().addItem({
              ...item,
              trackId: targetTrackId,
              startTime: pasteTime + (item.startTime - clipboard.items[0].startTime),
            })
          })
        },
        
        // Transport
        play: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            isPlaying: true,
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                isPlaying: true,
                isPaused: false,
              }
            }
          })
        },
        
        pause: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            isPlaying: false,
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                isPlaying: false,
                isPaused: true,
              }
            }
          })
        },
        
        stop: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            isPlaying: false,
            currentTime: 0,
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                isPlaying: false,
                isPaused: false,
                currentTime: 0,
              }
            }
          })
        },
        
        seek: (time) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          const clampedTime = Math.max(0, Math.min(time, timeline.duration))
          
          set({
            currentTime: clampedTime,
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                currentTime: clampedTime,
              }
            }
          })
        },
        
        setLoopPoints: (start, end) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                loopStart: start,
                loopEnd: end,
              }
            }
          })
        },
        
        toggleLoop: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              transport: {
                ...timeline.transport,
                isLooping: !timeline.transport.isLooping,
              }
            }
          })
        },
        
        // Markers & Regions
        addMarker: (markerData) => {
          const timeline = get().currentTimeline
          if (!timeline) return ''
          
          const marker: TimelineMarker = {
            ...markerData,
            id: generateId(),
          }
          
          set({
            currentTimeline: {
              ...timeline,
              markers: [...timeline.markers, marker],
              modified: new Date(),
            }
          })
          
          return marker.id
        },
        
        updateMarker: (markerId, updates) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              markers: timeline.markers.map(marker =>
                marker.id === markerId ? { ...marker, ...updates } : marker
              ),
              modified: new Date(),
            }
          })
        },
        
        deleteMarker: (markerId) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              markers: timeline.markers.filter(marker => marker.id !== markerId),
              modified: new Date(),
            }
          })
        },
        
        addRegion: (regionData) => {
          const timeline = get().currentTimeline
          if (!timeline) return ''
          
          const region: TimelineRegion = {
            ...regionData,
            id: generateId(),
          }
          
          set({
            currentTimeline: {
              ...timeline,
              regions: [...timeline.regions, region],
              modified: new Date(),
            }
          })
          
          return region.id
        },
        
        updateRegion: (regionId, updates) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              regions: timeline.regions.map(region =>
                region.id === regionId ? { ...region, ...updates } : region
              ),
              modified: new Date(),
            }
          })
        },
        
        deleteRegion: (regionId) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              regions: timeline.regions.filter(region => region.id !== regionId),
              modified: new Date(),
            }
          })
        },
        
        // View settings
        updateViewSettings: (updates) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              viewSettings: {
                ...timeline.viewSettings,
                ...updates,
              }
            }
          })
        },
        
        zoomIn: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              viewSettings: {
                ...timeline.viewSettings,
                horizontalZoom: timeline.viewSettings.horizontalZoom * 1.2,
              }
            }
          })
        },
        
        zoomOut: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          set({
            currentTimeline: {
              ...timeline,
              viewSettings: {
                ...timeline.viewSettings,
                horizontalZoom: timeline.viewSettings.horizontalZoom / 1.2,
              }
            }
          })
        },
        
        zoomToFit: () => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          // Calculate zoom to fit entire timeline
          // This would need the actual viewport width
          const viewportWidth = 1200 // Placeholder
          const zoom = viewportWidth / timeline.duration
          
          set({
            currentTimeline: {
              ...timeline,
              viewSettings: {
                ...timeline.viewSettings,
                horizontalZoom: zoom,
                visibleStartTime: 0,
                visibleEndTime: timeline.duration,
              }
            }
          })
        },
        
        scrollToTime: (time) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          const viewDuration = timeline.viewSettings.visibleEndTime - timeline.viewSettings.visibleStartTime
          
          set({
            currentTimeline: {
              ...timeline,
              viewSettings: {
                ...timeline.viewSettings,
                visibleStartTime: time,
                visibleEndTime: time + viewDuration,
              }
            }
          })
        },
        
        // History
        undo: () => {
          const edit = get().undoStack.pop()
          if (!edit) return
          
          // Apply inverse of edit
          // Implementation would depend on edit type
          
          set({
            undoStack: get().undoStack.filter(e => e !== edit),
            redoStack: [...get().redoStack, edit],
          })
        },
        
        redo: () => {
          const edit = get().redoStack.pop()
          if (!edit) return
          
          // Apply edit
          // Implementation would depend on edit type
          
          set({
            redoStack: get().redoStack.filter(e => e !== edit),
            undoStack: [...get().undoStack, edit],
          })
        },
        
        createSnapshot: (name, description) => {
          const timeline = get().currentTimeline
          if (!timeline) return
          
          const snapshot: TimelineSnapshot = {
            id: generateId(),
            name,
            timeline: JSON.parse(JSON.stringify(timeline)), // Deep clone
            timestamp: new Date(),
            description,
          }
          
          set({
            snapshots: [...get().snapshots, snapshot],
          })
        },
        
        restoreSnapshot: (snapshotId) => {
          const snapshot = get().snapshots.find(s => s.id === snapshotId)
          if (!snapshot) return
          
          set({
            currentTimeline: JSON.parse(JSON.stringify(snapshot.timeline)),
          })
        },
        
        // Import/Export
        exportTimeline: (format = 'json') => {
          const timeline = get().currentTimeline
          if (!timeline) return null
          
          // For now, just return JSON
          return JSON.parse(JSON.stringify(timeline))
        },
        
        importTimeline: (data, format = 'json') => {
          // For now, just handle JSON
          if (format === 'json') {
            set({ currentTimeline: data })
          }
        },
        
        // Utilities
        getTrackById: (trackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return undefined
          
          return timeline.tracks.find(track => track.id === trackId)
        },
        
        getItemById: (itemId) => {
          const timeline = get().currentTimeline
          if (!timeline) return undefined
          
          for (const track of timeline.tracks) {
            const item = track.items.find(item => item.id === itemId)
            if (item) return item
          }
          
          return undefined
        },
        
        getItemsInRange: (start, end, trackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return []
          
          const items: TimelineItem[] = []
          const tracks = trackId 
            ? timeline.tracks.filter(t => t.id === trackId)
            : timeline.tracks
          
          tracks.forEach(track => {
            track.items.forEach(item => {
              const itemEnd = item.startTime + item.duration
              if (
                (item.startTime >= start && item.startTime < end) ||
                (itemEnd > start && itemEnd <= end) ||
                (item.startTime < start && itemEnd > end)
              ) {
                items.push(item)
              }
            })
          })
          
          return items
        },
        
        getItemsAtTime: (time, trackId) => {
          const timeline = get().currentTimeline
          if (!timeline) return []
          
          const items: TimelineItem[] = []
          const tracks = trackId 
            ? timeline.tracks.filter(t => t.id === trackId)
            : timeline.tracks
          
          tracks.forEach(track => {
            track.items.forEach(item => {
              const itemEnd = item.startTime + item.duration
              if (time >= item.startTime && time < itemEnd) {
                items.push(item)
              }
            })
          })
          
          return items
        },
      }),
      {
        name: 'timeline-store',
        partialize: (state) => ({
          currentTimeline: state.currentTimeline,
          snapshots: state.snapshots,
        }),
      }
    )
  )
)
