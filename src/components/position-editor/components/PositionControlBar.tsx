/**
 * Position Control Bar
 * 
 * Top control bar for Position Editor
 * Matches AnimationEditor PlaybackControlBar style
 */

import React from 'react'
import { Button } from '@/components/common/Button'
import {
  Camera,
  Grid3X3,
  Circle,
  Minus,
  Grid,
  Undo2,
  PanelRightOpen,
  PanelRightClose,
  Eye,
  EyeOff,
  Library,
  Save,
  Edit,
  X
} from 'lucide-react'
import { cn } from '@/utils'

export type ViewMode = 'perspective' | 'top' | 'front' | 'side'

interface PositionControlBarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  showGrid: boolean
  onToggleGrid: () => void
  snapToGrid: boolean
  onToggleSnap: () => void
  selectedCount: number
  onCircle: () => void
  onLine: () => void
  onGrid: () => void
  onReset: () => void
  onCapture: () => void
  onUpdatePreset?: () => void
  onClearActivePreset?: () => void
  onOpenPresetManager: () => void
  activePresetName?: string | null
  isSidePanelOpen: boolean
  onToggleSidePanel: () => void
  hasPresets: boolean
}

export const PositionControlBar: React.FC<PositionControlBarProps> = ({
  viewMode,
  onViewModeChange,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  selectedCount,
  onCircle,
  onLine,
  onGrid,
  onReset,
  onCapture,
  onUpdatePreset,
  onClearActivePreset,
  onOpenPresetManager,
  activePresetName,
  isSidePanelOpen,
  onToggleSidePanel,
  hasPresets
}) => {
  const viewModes: Array<{ value: ViewMode; label: string; key: string }> = [
    { value: 'perspective', label: 'Perspective', key: 'Q' },
    { value: 'top', label: 'Top', key: 'W' },
    { value: 'front', label: 'Front', key: 'E' },
    { value: 'side', label: 'Side', key: 'R' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-3 mb-4">
      {/* Main controls row */}
      <div className="flex items-center justify-between gap-4">
        {/* View Mode */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            View:
          </span>
          {viewModes.map(({ value, label, key }) => (
            <button
              key={value}
              onClick={() => onViewModeChange(value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                viewMode === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
              title={`${label} (${key})`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid & Snap */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showGrid ? 'primary' : 'secondary'}
            icon={showGrid ? Eye : EyeOff}
            onClick={onToggleGrid}
            title="Toggle grid visibility"
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant={snapToGrid ? 'primary' : 'secondary'}
            icon={Grid3X3}
            onClick={onToggleSnap}
            title="Toggle snap to grid"
          >
            Snap
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Active preset indicator */}
          {activePresetName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
              <Edit size={14} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Editing: {activePresetName}
              </span>
              {onClearActivePreset && (
                <button
                  onClick={onClearActivePreset}
                  className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                  title="Stop editing this preset (start fresh)"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            icon={Library}
            onClick={onOpenPresetManager}
            title="Open preset library to view and edit presets"
            disabled={!hasPresets}
          >
            Preset Library
          </Button>
          
          {/* Update Preset button (only when editing existing preset) */}
          {activePresetName && onUpdatePreset && (
            <Button
              size="sm"
              variant="secondary"
              icon={Save}
              onClick={onUpdatePreset}
              title={`Update "${activePresetName}" with current positions`}
            >
              Update Preset
            </Button>
          )}
          
          <Button
            size="sm"
            icon={Camera}
            onClick={onCapture}
            title="Capture current positions as new preset"
          >
            Capture New
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            icon={isSidePanelOpen ? PanelRightClose : PanelRightOpen}
            onClick={onToggleSidePanel}
            title={isSidePanelOpen ? 'Close side panel' : 'Open side panel'}
          />
        </div>
      </div>

      {/* Quick formations (when tracks selected) */}
      {selectedCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {selectedCount} track{selectedCount !== 1 ? 's' : ''} selected:
            </span>
            <Button size="sm" variant="secondary" icon={Circle} onClick={onCircle}>
              Circle
            </Button>
            <Button size="sm" variant="secondary" icon={Minus} onClick={onLine}>
              Line
            </Button>
            <Button size="sm" variant="secondary" icon={Grid} onClick={onGrid}>
              Grid
            </Button>
            <Button size="sm" variant="secondary" icon={Undo2} onClick={onReset} title="Reset selected tracks to their initial positions">
              Reset to Initial
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
