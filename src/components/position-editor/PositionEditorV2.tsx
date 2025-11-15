/**
 * Position Editor V2
 * 
 * Unified position editing workspace with Three.js 3D view
 * Matches AnimationEditor style and structure
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { Button } from '@/components/common/Button'
import { CapturePresetDialog, PresetManager } from '@/components/presets'
import {
  Camera,
  Grid3X3,
  Move3D,
  Target,
  Save,
  Undo2,
  PanelRightOpen,
  PanelRightClose,
  Circle,
  Minus,
  Grid,
  Library
} from 'lucide-react'
import { cn } from '@/utils'

// Import Three.js editor components
import { 
  PositionThreeJsView,
  PositionControlBar,
  PositionSidePanel 
} from './components'

import type { Track, Position } from '@/types'

export type ViewMode = 'perspective' | 'top' | 'front' | 'side'

export const PositionEditorV2: React.FC = () => {
  const { tracks: storeTracks, updateTrack, selectedTracks, selectTracks } = useProjectStore()
  const { presets } = usePositionPresetStore()

  // Local track positions (staging area - not synced to store until preset capture)
  // Initialize with current store positions
  const [localTrackPositions, setLocalTrackPositions] = useState<Record<string, Position>>(() => {
    const positions: Record<string, Position> = {}
    storeTracks.forEach(track => {
      positions[track.id] = { ...track.position }
    })
    return positions
  })
  
  // Update local positions when new tracks are added (but preserve existing edits)
  useEffect(() => {
    const newPositions: Record<string, Position> = {}
    storeTracks.forEach(track => {
      // Only set if we don't have a local position yet (preserve edits)
      if (!localTrackPositions[track.id]) {
        newPositions[track.id] = { ...track.position }
      }
    })
    if (Object.keys(newPositions).length > 0) {
      setLocalTrackPositions(prev => ({ ...prev, ...newPositions }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeTracks.length]) // ONLY when tracks count changes, NOT on localTrackPositions change

  // Create tracks with local positions for rendering
  const tracks = useMemo(() => {
    return storeTracks.map(track => ({
      ...track,
      position: localTrackPositions[track.id] || track.position
    }))
  }, [storeTracks, localTrackPositions])

  // View settings
  const [viewMode, setViewMode] = useState<ViewMode>('perspective')
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(0.5)
  
  // UI state
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true)
  const [showCaptureDialog, setShowCaptureDialog] = useState(false)
  const [showPresetManager, setShowPresetManager] = useState(false)
  const [activePresetId, setActivePresetId] = useState<string | null>(null) // Track which preset is being edited
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    [] // Start with no selection to avoid transform errors before meshes are created
  )

  // Track selection
  const handleTrackSelect = useCallback((trackId: string, addToSelection: boolean = false) => {
    if (addToSelection) {
      setSelectedTrackIds(prev => 
        prev.includes(trackId) 
          ? prev.filter(id => id !== trackId)
          : [...prev, trackId]
      )
    } else {
      setSelectedTrackIds([trackId])
    }
  }, [])

  // Position update from 3D view - update LOCAL state only
  const handlePositionChange = useCallback((trackId: string, position: Position) => {
    setLocalTrackPositions(prev => ({
      ...prev,
      [trackId]: position
    }))
  }, [])

  // Quick formations - update LOCAL positions
  const handleQuickFormation = useCallback((type: 'circle' | 'line' | 'grid') => {
    const selected = tracks.filter(t => selectedTrackIds.includes(t.id))
    if (selected.length === 0) return

    const radius = 3.0
    const spacing = 1.0
    const height = 1.5

    const newPositions: Record<string, Position> = {}

    selected.forEach((track, index) => {
      let position: Position

      switch (type) {
        case 'circle':
          const angle = (index / selected.length) * 2 * Math.PI
          position = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            z: height
          }
          break

        case 'line':
          const offset = -(selected.length - 1) * spacing / 2
          position = {
            x: offset + index * spacing,
            y: 0,
            z: height
          }
          break

        case 'grid':
          const cols = Math.ceil(Math.sqrt(selected.length))
          const row = Math.floor(index / cols)
          const col = index % cols
          position = {
            x: (col - cols / 2) * spacing,
            y: (row - Math.ceil(selected.length / cols) / 2) * spacing,
            z: height
          }
          break
      }

      newPositions[track.id] = position
    })

    setLocalTrackPositions(prev => ({ ...prev, ...newPositions }))
  }, [selectedTrackIds, tracks])

  // Reset selected tracks to initial positions (from store)
  const handleResetToInitial = useCallback(() => {
    const newPositions: Record<string, Position> = {}
    selectedTrackIds.forEach(trackId => {
      const track = storeTracks.find(t => t.id === trackId)
      if (track) {
        newPositions[trackId] = { ...track.position }
      }
    })
    setLocalTrackPositions(prev => ({ ...prev, ...newPositions }))
  }, [selectedTrackIds, storeTracks])

  // Apply preset - recalls preset positions to local state and visualizes
  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) return

    // Apply preset positions to local state
    const newPositions: Record<string, Position> = {}
    Object.entries(preset.positions).forEach(([trackId, position]) => {
      // Only apply if track exists in project
      if (storeTracks.some(t => t.id === trackId)) {
        newPositions[trackId] = { ...position }
      }
    })

    setLocalTrackPositions(prev => ({ ...prev, ...newPositions }))

    // Select the tracks that were updated
    const updatedTrackIds = Object.keys(newPositions)
    if (updatedTrackIds.length > 0) {
      setSelectedTrackIds(updatedTrackIds)
    }

    // Mark this preset as the active one being edited
    setActivePresetId(presetId)

    // Close preset manager after applying
    setShowPresetManager(false)
  }, [presets, storeTracks])

  // Update active preset with current positions
  const handleUpdatePreset = useCallback(() => {
    if (!activePresetId) return

    const { updatePreset } = usePositionPresetStore.getState()
    
    // Build positions from current local state
    const positions: Record<string, Position> = {}
    Object.entries(localTrackPositions).forEach(([trackId, position]) => {
      if (storeTracks.some(t => t.id === trackId)) {
        positions[trackId] = { ...position }
      }
    })

    // Update the preset
    updatePreset(activePresetId, {
      positions,
      trackIds: Object.keys(positions),
      modified: new Date()
    })
  }, [activePresetId, localTrackPositions, storeTracks])

  // Get active preset info
  const activePreset = activePresetId ? presets.find(p => p.id === activePresetId) : null

  // No tracks state
  if (tracks.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Position Editor
        </h1>
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Target className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Tracks Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Add tracks to your project to start positioning them
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              💡 Tip: Connect to Holophonix and discover tracks, or add manually
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Position Editor
        </h1>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center gap-2 bg-blue-900/70 text-blue-200 text-xs px-3 py-1.5 rounded backdrop-blur-sm mb-3">
        <span>
          💡 Press <kbd className="px-1 bg-gray-700 rounded">Q/W/E/R</kbd> for views | 
          <kbd className="px-1 bg-gray-700 rounded mx-1">Shift+Click</kbd> multi-select | 
          <kbd className="px-1 bg-gray-700 rounded mx-1">Drag</kbd> to move
        </span>
      </div>

      {/* Control Bar */}
      <PositionControlBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        selectedCount={selectedTrackIds.length}
        onCircle={() => handleQuickFormation('circle')}
        onLine={() => handleQuickFormation('line')}
        onGrid={() => handleQuickFormation('grid')}
        onReset={handleResetToInitial}
        onCapture={() => {
          // Open capture dialog with current local positions
          // Clear active preset since we're creating a new one
          setActivePresetId(null)
          setShowCaptureDialog(true)
        }}
        onUpdatePreset={activePreset ? handleUpdatePreset : undefined}
        onClearActivePreset={() => setActivePresetId(null)}
        onOpenPresetManager={() => setShowPresetManager(true)}
        activePresetName={activePreset?.name}
        isSidePanelOpen={isSidePanelOpen}
        onToggleSidePanel={() => setIsSidePanelOpen(!isSidePanelOpen)}
        hasPresets={presets.length > 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 3D View */}
        <div className="flex-1 min-w-0 flex flex-col bg-gray-900 rounded-lg overflow-hidden">
          <PositionThreeJsView
            tracks={tracks}
            selectedTrackIds={selectedTrackIds}
            onTrackSelect={handleTrackSelect}
            onPositionChange={handlePositionChange}
            viewMode={viewMode}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
          />
          
          {/* Status Bar */}
          <div className="border-t border-gray-700 px-4 py-2 bg-gray-800/50 text-xs text-gray-300">
            <span>
              {selectedTrackIds.length > 0 
                ? `${selectedTrackIds.length} track${selectedTrackIds.length > 1 ? 's' : ''} selected`
                : 'No tracks selected'
              } • {viewMode} view • Grid: {showGrid ? 'On' : 'Off'}
            </span>
          </div>
        </div>

        {/* Side Panel */}
        {isSidePanelOpen && (
          <PositionSidePanel
            tracks={tracks}
            selectedTrackIds={selectedTrackIds}
            onTrackSelect={handleTrackSelect}
            onPositionChange={handlePositionChange}
            presets={presets}
            onClose={() => setIsSidePanelOpen(false)}
          />
        )}
      </div>

      {/* Capture Dialog */}
      {showCaptureDialog && (
        <CapturePresetDialog
          onClose={() => setShowCaptureDialog(false)}
          preSelectedTrackIds={selectedTrackIds.length > 0 ? selectedTrackIds : tracks.map(t => t.id)}
          currentPositions={localTrackPositions}
        />
      )}

      {/* Preset Manager */}
      {showPresetManager && (
        <PresetManager
          onClose={() => setShowPresetManager(false)}
          onApply={handleApplyPreset}
        />
      )}
    </div>
  )
}
