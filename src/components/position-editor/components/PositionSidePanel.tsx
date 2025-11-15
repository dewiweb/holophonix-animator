/**
 * Position Side Panel
 * 
 * Side panel for track list and position controls
 * Matches AnimationEditor side panel style
 */

import React from 'react'
import { FormInput } from '@/components/common/FormInput'
import { X } from 'lucide-react'
import { cn } from '@/utils'
import type { Track, Position, PositionPreset } from '@/types'

interface PositionSidePanelProps {
  tracks: Track[]
  selectedTrackIds: string[]
  onTrackSelect: (trackId: string, addToSelection: boolean) => void
  onPositionChange: (trackId: string, position: Position) => void
  presets: PositionPreset[]
  onClose: () => void
}

export const PositionSidePanel: React.FC<PositionSidePanelProps> = ({
  tracks,
  selectedTrackIds,
  onTrackSelect,
  onPositionChange,
  presets,
  onClose
}) => {
  const selectedTrack = selectedTrackIds.length === 1 
    ? tracks.find(t => t.id === selectedTrackIds[0])
    : null

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Tracks ({tracks.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Track Chips - Compact pill style like Animation Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
            {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'} • Click to select
          </div>
          {selectedTrackIds.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {selectedTrackIds.length} selected
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tracks.map(track => {
            const isSelected = selectedTrackIds.includes(track.id)
            
            // Convert color object to hex string
            let bgColor = '#10B981'
            if (track.color && typeof track.color === 'object') {
              const r = Math.round(track.color.r * 255)
              const g = Math.round(track.color.g * 255)
              const b = Math.round(track.color.b * 255)
              bgColor = `rgb(${r}, ${g}, ${b})`
            }
            
            return (
              <div
                key={track.id}
                onClick={(e) => onTrackSelect(track.id, e.shiftKey)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 border rounded-md text-xs font-medium transition-all cursor-pointer',
                  isSelected
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-600 shadow-md ring-2 ring-blue-300 dark:ring-blue-700 scale-105'
                    : 'bg-gray-100/60 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200/70 dark:hover:bg-gray-800/60 hover:shadow-lg hover:scale-105'
                )}
                title={`${track.name}\nx: ${track.position.x.toFixed(2)} | y: ${track.position.y.toFixed(2)} | z: ${track.position.z.toFixed(2)}\nShift+Click for multi-select`}
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-500"
                  style={{ backgroundColor: bgColor }}
                />
                
                <span>{track.name}</span>
                
                {track.holophonixIndex && (
                  <span className="font-mono text-[10px] opacity-60">#{track.holophonixIndex}</span>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Selected tracks positions */}
        {selectedTrackIds.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Positions:
            </div>
            <div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
              {tracks.filter(t => selectedTrackIds.includes(t.id)).map(track => (
                <div key={track.id} className="flex justify-between">
                  <span className="font-medium">{track.name}:</span>
                  <span>
                    x:{track.position.x.toFixed(2)} y:{track.position.y.toFixed(2)} z:{track.position.z.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Position Editor (when single track selected) */}
      {selectedTrack && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Edit Position
          </h4>
          <div className="space-y-2">
            <FormInput
              label="X (meters)"
              type="number"
              value={selectedTrack.position.x.toString()}
              onChange={(val) => onPositionChange(selectedTrack.id, {
                ...selectedTrack.position,
                x: parseFloat(String(val)) || 0
              })}
              step={0.1}
              className="text-sm"
            />
            <FormInput
              label="Y (meters)"
              type="number"
              value={selectedTrack.position.y.toString()}
              onChange={(val) => onPositionChange(selectedTrack.id, {
                ...selectedTrack.position,
                y: parseFloat(String(val)) || 0
              })}
              step={0.1}
              className="text-sm"
            />
            <FormInput
              label="Z (meters)"
              type="number"
              value={selectedTrack.position.z.toString()}
              onChange={(val) => onPositionChange(selectedTrack.id, {
                ...selectedTrack.position,
                z: parseFloat(String(val)) || 0
              })}
              step={0.1}
              className="text-sm"
            />
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <p className="text-xs text-blue-900 dark:text-blue-200">
          💡 <strong>Tip:</strong> Click to select, Shift+click for multi-select
        </p>
      </div>
    </div>
  )
}
