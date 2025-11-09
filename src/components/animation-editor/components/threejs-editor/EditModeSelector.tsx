import React from 'react'
import { Eye, Edit3 } from 'lucide-react'

export type EditMode = 'preview' | 'edit'

interface EditModeSelectorProps {
  currentMode: EditMode
  onChange: (mode: EditMode) => void
  disabled?: boolean
}

/**
 * Edit Mode Selector Component
 * Switches between Preview Mode (show tracks/paths) and Edit Mode (edit control points)
 */
export const EditModeSelector: React.FC<EditModeSelectorProps> = ({
  currentMode,
  onChange,
  disabled = false,
}) => {
  const modes: Array<{
    mode: EditMode
    label: string
    icon: React.ReactNode
    tooltip: string
    description: string
  }> = [
    {
      mode: 'preview',
      label: 'Preview',
      icon: <Eye size={18} />,
      tooltip: 'Preview Mode (Tab)',
      description: 'View tracks and animation paths',
    },
    {
      mode: 'edit',
      label: 'Edit',
      icon: <Edit3 size={18} />,
      tooltip: 'Edit Mode (Tab)',
      description: 'Edit control points with gizmo',
    },
  ]

  return (
    <div className="flex gap-1 border-r border-gray-700 pr-2">
      {modes.map(({ mode, label, icon, tooltip, description }) => (
        <button
          key={mode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all ${
            currentMode === mode
              ? mode === 'preview'
                ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-500/50'
                : 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => onChange(mode)}
          title={`${tooltip}\n${description}`}
          disabled={disabled}
        >
          {icon}
          <span>{label}</span>
          <kbd className="hidden md:inline text-[10px] px-1 py-0.5 bg-gray-800/50 rounded border border-gray-600">
            Tab
          </kbd>
        </button>
      ))}
    </div>
  )
}
