import React from 'react'
import { Box, Eye, Square, Grid3X3 } from 'lucide-react'

export type ViewMode = 'perspective' | 'top' | 'front' | 'side'

interface ViewModeSelectorProps {
  currentMode: ViewMode
  onChange: (mode: ViewMode) => void
  disabled?: boolean
}

/**
 * View Mode Selector Component
 * Allows switching between Perspective, Top, Front, and Side views
 */
export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentMode,
  onChange,
  disabled = false,
}) => {
  const viewModes: Array<{ mode: ViewMode; label: string; icon: React.ReactNode; tooltip: string; hotkey: string }> = [
    {
      mode: 'perspective',
      label: 'Perspective',
      icon: <Box size={18} />,
      tooltip: 'Perspective view (3D)',
      hotkey: 'Q',
    },
    {
      mode: 'top',
      label: 'Top',
      icon: <Grid3X3 size={18} />,
      tooltip: 'Top view (XZ plane)',
      hotkey: 'W',
    },
    {
      mode: 'front',
      label: 'Front',
      icon: <Square size={18} />,
      tooltip: 'Front view (XY plane)',
      hotkey: 'E',
    },
    {
      mode: 'side',
      label: 'Side',
      icon: <Eye size={18} />,
      tooltip: 'Side view (YZ plane)',
      hotkey: 'R',
    },
  ]

  return (
    <div className="flex gap-1 border-r border-gray-700 pr-2">
      {viewModes.map(({ mode, label, icon, tooltip, hotkey }) => (
        <button
          key={mode}
          className={`flex items-center gap-1.5 px-2 py-2 rounded text-xs font-medium transition-colors ${
            currentMode === mode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => onChange(mode)}
          title={`${tooltip} (${hotkey})`}
          disabled={disabled}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
          <kbd className="hidden md:inline text-[10px] px-1 py-0.5 bg-gray-800/50 rounded border border-gray-600">
            {hotkey}
          </kbd>
        </button>
      ))}
    </div>
  )
}
