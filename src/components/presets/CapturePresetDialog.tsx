/**
 * Capture Preset Dialog
 * 
 * Dialog for capturing current track positions as a new preset.
 */

import React, { useState, useMemo } from 'react'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/common/Button'
import { FormInput } from '@/components/common/FormInput'
import { cn } from '@/utils'
import {
  X,
  Save,
  Camera,
  Check,
  Square
} from 'lucide-react'
import type { PresetCategory } from '@/types/positionPreset'

interface CapturePresetDialogProps {
  onClose: () => void
  preSelectedTrackIds?: string[]
  currentPositions?: Record<string, { x: number; y: number; z: number }> // Show current positions, not initial
}

export const CapturePresetDialog: React.FC<CapturePresetDialogProps> = ({
  onClose,
  preSelectedTrackIds,
  currentPositions
}) => {
  const { captureCurrentPositions, presets } = usePositionPresetStore()
  const { tracks } = useProjectStore()

  // Generate default name based on preset count
  const defaultName = useMemo(() => {
    const count = Object.keys(presets).length + 1
    const date = new Date()
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `Preset ${count} - ${dateStr} ${timeStr}`
  }, [presets])

  const [name, setName] = useState(defaultName)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PresetCategory>('custom')
  const [scope, setScope] = useState<'project' | 'global'>('project')
  const [tags, setTags] = useState('')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    preSelectedTrackIds || tracks.map(t => t.id)
  )
  const [nameError, setNameError] = useState('')

  const categories: Array<{ value: PresetCategory; label: string; icon: string }> = [
    { value: 'scene', label: 'Scene', icon: '🎭' },
    { value: 'formation', label: 'Formation', icon: '📐' },
    { value: 'effect', label: 'Effect', icon: '✨' },
    { value: 'safety', label: 'Safety', icon: '🏠' },
    { value: 'custom', label: 'Custom', icon: '📦' }
  ]

  const toggleTrack = (trackId: string) => {
    setSelectedTrackIds(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    )
  }

  const selectAll = () => {
    setSelectedTrackIds(tracks.map(t => t.id))
  }

  const clearAll = () => {
    setSelectedTrackIds([])
  }

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }

    if (selectedTrackIds.length === 0) {
      alert('Please select at least one track')
      return
    }

    // If currentPositions are provided, use them directly instead of reading from store
    if (currentPositions) {
      // Build positions object from currentPositions
      const positions: Record<string, { x: number; y: number; z: number }> = {}
      selectedTrackIds.forEach(trackId => {
        if (currentPositions[trackId]) {
          positions[trackId] = { ...currentPositions[trackId] }
        }
      })
      
      // Create preset directly using createPreset with our positions
      const { createPreset } = usePositionPresetStore.getState()
      const projectStore = useProjectStore.getState()
      
      const tagList = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      
      const preset = {
        name: name.trim(),
        description: description.trim() || undefined,
        positions,
        trackIds: selectedTrackIds,
        category: category || 'custom',
        tags: tagList.length > 0 ? tagList : undefined,
        scope: scope || 'project',
        mode: 'absolute' as const,
        projectId: projectStore.currentProject?.id
      }
      
      createPreset(preset)
    } else {
      // Fallback to original method if no currentPositions provided
      const tagList = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      captureCurrentPositions(
        selectedTrackIds,
        name.trim(),
        {
          description: description.trim() || undefined,
          category,
          scope,
          tags: tagList.length > 0 ? tagList : undefined
        }
      )
    }

    onClose()
  }

  const selectedTracks = useMemo(() => {
    return tracks.filter(t => selectedTrackIds.includes(t.id))
  }, [tracks, selectedTrackIds])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Camera size={20} />
            Capture Position Preset
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <FormInput
            label="Preset Name *"
            value={name}
            onChange={(val) => setName(String(val))}
            placeholder="e.g., Scene 1 - Opening"
            error={nameError}
          />

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm transition-colors resize-none',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100'
              )}
            />
          </div>

          {/* Category and Scope */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      'px-3 py-2 rounded-md text-xs font-medium transition-colors',
                      'flex items-center justify-center gap-1.5',
                      category === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Scope
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setScope('project')}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
                    scope === 'project'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <div className="font-semibold">Project</div>
                  <div className="text-[10px] opacity-75">This project only</div>
                </button>
                <button
                  onClick={() => setScope('global')}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
                    scope === 'global'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <div className="font-semibold">Global</div>
                  <div className="text-[10px] opacity-75">All projects</div>
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <FormInput
            label="Tags"
            value={tags}
            onChange={(val) => setTags(String(val))}
            placeholder="comma, separated, tags"
            hint="Separate tags with commas"
          />

          {/* Track Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                Tracks ({selectedTrackIds.length} selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className={cn(
              'border rounded-md max-h-48 overflow-y-auto',
              'border-gray-200 dark:border-gray-600'
            )}>
              {tracks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tracks in project
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tracks.map(track => {
                    const isSelected = selectedTrackIds.includes(track.id)
                    // Use current positions if provided, otherwise use initial track position
                    const position = currentPositions?.[track.id] || track.position
                    return (
                      <button
                        key={track.id}
                        onClick={() => toggleTrack(track.id)}
                        className={cn(
                          'w-full px-3 py-2 flex items-center gap-2 text-left text-sm transition-colors',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">
                          {track.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ({position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)})
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Preview Summary */}
          {selectedTracks.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-xs text-blue-900 dark:text-blue-200">
                <strong>Will capture:</strong> {selectedTracks.length} track positions
              </p>
              {selectedTracks.length > 3 && (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {selectedTracks.slice(0, 3).map(t => t.name).join(', ')} and {selectedTracks.length - 3} more...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            icon={Save}
            onClick={handleSave}
            disabled={!name.trim() || selectedTrackIds.length === 0}
          >
            Save Preset
          </Button>
        </div>
      </div>
    </div>
  )
}
