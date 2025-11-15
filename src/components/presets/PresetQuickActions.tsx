/**
 * Preset Quick Actions
 * 
 * Quick access buttons for position preset operations.
 * Can be added to toolbar, sidebar, or as floating panel.
 */

import React, { useState } from 'react'
import { Button } from '@/components/common/Button'
import { PresetManager } from './PresetManager'
import { CapturePresetDialog } from './CapturePresetDialog'
import { ApplyPresetDialog } from './ApplyPresetDialog'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { Camera, Home, Play, FolderOpen } from 'lucide-react'

interface PresetQuickActionsProps {
  layout?: 'horizontal' | 'vertical'
  showLabels?: boolean
}

export const PresetQuickActions: React.FC<PresetQuickActionsProps> = ({
  layout = 'horizontal',
  showLabels = true
}) => {
  const [showManager, setShowManager] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const { presets } = usePositionPresetStore()

  const handleApplyClick = () => {
    // If there are presets, show apply dialog
    if (presets.length > 0) {
      // Pre-select "Initial Positions" if it exists (optional)
      const initialPreset = presets.find(p => p.name === 'Initial Positions')
      setSelectedPresetId(initialPreset?.id || presets[0].id)
      setShowApply(true)
    } else {
      alert('No presets available. Capture some positions first!')
    }
  }

  const containerClass = layout === 'horizontal' 
    ? 'flex items-center gap-2'
    : 'flex flex-col gap-2'

  return (
    <>
      <div className={containerClass}>
        {/* Capture Current Positions */}
        <Button
          icon={Camera}
          size="sm"
          onClick={() => setShowCapture(true)}
          title="Capture current track positions as a preset"
        >
          {showLabels && 'Capture'}
        </Button>

        {/* Apply Preset */}
        <Button
          icon={Play}
          size="sm"
          variant="secondary"
          onClick={handleApplyClick}
          disabled={presets.length === 0}
          title="Apply a saved preset"
        >
          {showLabels && 'Apply'}
        </Button>

        {/* Manage Presets */}
        <Button
          icon={FolderOpen}
          size="sm"
          variant="secondary"
          onClick={() => setShowManager(true)}
          title="Manage all presets"
        >
          {showLabels && 'Manage'}
        </Button>

        {/* Preset Count Badge */}
        {presets.length > 0 && (
          <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {presets.length} preset{presets.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Dialogs */}
      {showCapture && (
        <CapturePresetDialog
          onClose={() => setShowCapture(false)}
        />
      )}

      {showApply && (
        <ApplyPresetDialog
          presetId={selectedPresetId || undefined}
          onClose={() => {
            setShowApply(false)
            setSelectedPresetId(null)
          }}
          onApplied={() => {
            setShowApply(false)
            setSelectedPresetId(null)
          }}
        />
      )}

      {showManager && (
        <PresetManager
          onClose={() => setShowManager(false)}
          onCapture={() => {
            setShowManager(false)
            setShowCapture(true)
          }}
          onApply={(presetId) => {
            setShowManager(false)
            setSelectedPresetId(presetId)
            setShowApply(true)
          }}
        />
      )}
    </>
  )
}

/**
 * Floating preset panel that can be toggled
 */
export const PresetFloatingPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Position Presets"
      >
        <Home size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-40 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Home size={16} />
          Position Presets
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      <PresetQuickActions layout="vertical" showLabels={true} />
    </div>
  )
}
