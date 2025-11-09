import { cn } from '@/utils'
import { themeColors } from '@/theme'
import { AnimationType } from '@/types'

interface MultiTrackModeSelectorProps {
  animationType: AnimationType
  multiTrackMode: 'shared' | 'relative' | 'formation'
  phaseOffsetSeconds: number
  onModeChange: (mode: 'shared' | 'relative' | 'formation') => void
  onPhaseOffsetChange: (seconds: number) => void
  getCompatibleModes: (type: AnimationType) => {
    shared: { compatible: boolean; reason: string }
    relative: { compatible: boolean; reason: string }
    formation: { compatible: boolean; reason: string }
  }
}

export const MultiTrackModeSelector: React.FC<MultiTrackModeSelectorProps> = ({
  multiTrackMode,
  phaseOffsetSeconds,
  onModeChange,
  onPhaseOffsetChange
}) => {
  return (
    <div className={`mb-4 ${themeColors.multiTrackMode.background} border ${themeColors.multiTrackMode.border} rounded-lg p-4`}>
      <h3 className={`text-sm font-semibold ${themeColors.text.primary} mb-3`}>Multi-Track Mode</h3>
      <p className={`text-xs ${themeColors.text.muted} mb-3`}>
        <strong>Shared:</strong> same params (absolute) | <strong>Relative:</strong> per-track params (offset by track position) | <strong>Formation:</strong> rigid group
      </p>
      
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onModeChange('shared')}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'shared'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
            )}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🎯 Shared</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Same path, absolute coords</div>
          </button>

          <button
            onClick={() => onModeChange('relative')}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'relative'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
            )}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>📍 Relative</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Per-track, relative to position</div>
          </button>

          <button
            onClick={() => onModeChange('formation')}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'formation'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
            )}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🎯 Formation</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Rigid group (barycenter)</div>
          </button>
        </div>

        {/* Phase Offset Control - works with any mode */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={phaseOffsetSeconds > 0}
                onChange={(e) => onPhaseOffsetChange(e.target.checked ? 1.0 : 0)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              Phase Offset
            </label>
            {phaseOffsetSeconds > 0 && (
              <span className="text-xs text-gray-500">
                {phaseOffsetSeconds.toFixed(1)}s
              </span>
            )}
          </div>
          {phaseOffsetSeconds > 0 && (
            <>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={phaseOffsetSeconds}
                onChange={(e) => onPhaseOffsetChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                Staggers track start times (works with any mode)
              </p>
            </>
          )}
        </div>
        {phaseOffsetSeconds > 0 && (
          <p className={`text-xs ${themeColors.text.muted} mt-1`}>
            Track 1: 0s, Track 2: {phaseOffsetSeconds}s, Track 3: {phaseOffsetSeconds * 2}s...
          </p>
        )}
      </div>
    </div>
  )
}
