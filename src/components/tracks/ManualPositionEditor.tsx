/**
 * Manual Position Editor
 * 
 * Allows users to manually set track positions without needing OSC connection.
 * Useful for offline preset creation and testing.
 */

import React, { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/common/Button'
import { FormInput } from '@/components/common/FormInput'
import { X, Save, Move } from 'lucide-react'
import type { Position } from '@/types'

interface ManualPositionEditorProps {
  trackId: string
  onClose: () => void
  onSaved?: () => void
}

export const ManualPositionEditor: React.FC<ManualPositionEditorProps> = ({
  trackId,
  onClose,
  onSaved
}) => {
  const { tracks, updateTrack } = useProjectStore()
  const track = tracks.find(t => t.id === trackId)
  
  const [x, setX] = useState(track?.position.x.toString() || '0')
  const [y, setY] = useState(track?.position.y.toString() || '0')
  const [z, setZ] = useState(track?.position.z.toString() || '0')

  if (!track) {
    return null
  }

  const handleSave = () => {
    const newPosition: Position = {
      x: parseFloat(x) || 0,
      y: parseFloat(y) || 0,
      z: parseFloat(z) || 0
    }

    updateTrack(trackId, { position: newPosition })
    
    if (onSaved) onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Move size={20} />
            Set Position: {track.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Position Inputs */}
        <div className="space-y-4">
          <FormInput
            label="X Position (meters)"
            type="number"
            value={x}
            onChange={(val) => setX(String(val))}
            step={0.1}
            placeholder="0.0"
          />

          <FormInput
            label="Y Position (meters)"
            type="number"
            value={y}
            onChange={(val) => setY(String(val))}
            step={0.1}
            placeholder="0.0"
          />

          <FormInput
            label="Z Position (meters)"
            type="number"
            value={z}
            onChange={(val) => setZ(String(val))}
            step={0.1}
            placeholder="0.0"
          />

          {/* Current position display */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Current:</strong> ({track.position.x.toFixed(2)}, {track.position.y.toFixed(2)}, {track.position.z.toFixed(2)})
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              <strong>New:</strong> ({parseFloat(x) || 0}, {parseFloat(y) || 0}, {parseFloat(z) || 0})
            </p>
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-900 dark:text-blue-200">
            💡 Tip: Use this to set positions when offline. Changes are immediate and can be captured as presets.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={Save} onClick={handleSave}>
            Set Position
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Batch Position Editor
 * Set positions for multiple tracks at once
 */
interface BatchPositionEditorProps {
  trackIds: string[]
  onClose: () => void
}

export const BatchPositionEditor: React.FC<BatchPositionEditorProps> = ({
  trackIds,
  onClose
}) => {
  const { tracks, updateTrack } = useProjectStore()
  const [layout, setLayout] = useState<'circle' | 'line' | 'grid'>('circle')
  const [radius, setRadius] = useState('3.0')
  const [spacing, setSpacing] = useState('1.0')
  const [height, setHeight] = useState('1.5')

  const handleApplyLayout = () => {
    const r = parseFloat(radius) || 3.0
    const s = parseFloat(spacing) || 1.0
    const h = parseFloat(height) || 1.5

    trackIds.forEach((trackId, index) => {
      let position: Position

      switch (layout) {
        case 'circle':
          const angle = (index / trackIds.length) * 2 * Math.PI
          position = {
            x: r * Math.cos(angle),
            y: r * Math.sin(angle),
            z: h
          }
          break

        case 'line':
          const offset = -(trackIds.length - 1) * s / 2
          position = {
            x: offset + index * s,
            y: 0,
            z: h
          }
          break

        case 'grid':
          const cols = Math.ceil(Math.sqrt(trackIds.length))
          const row = Math.floor(index / cols)
          const col = index % cols
          position = {
            x: (col - cols / 2) * s,
            y: (row - Math.ceil(trackIds.length / cols) / 2) * s,
            z: h
          }
          break

        default:
          position = { x: 0, y: 0, z: h }
      }

      updateTrack(trackId, { position })
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Arrange {trackIds.length} Tracks
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Layout Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Layout Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['circle', 'line', 'grid'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setLayout(type)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    layout === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          {layout === 'circle' && (
            <FormInput
              label="Radius (meters)"
              type="number"
              value={radius}
              onChange={(val) => setRadius(String(val))}
              step={0.5}
            />
          )}

          {(layout === 'line' || layout === 'grid') && (
            <FormInput
              label="Spacing (meters)"
              type="number"
              value={spacing}
              onChange={(val) => setSpacing(String(val))}
              step={0.5}
            />
          )}

          <FormInput
            label="Height (meters)"
            type="number"
            value={height}
            onChange={(val) => setHeight(String(val))}
            step={0.1}
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyLayout}>
            Apply Layout
          </Button>
        </div>
      </div>
    </div>
  )
}
