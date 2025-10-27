import { cn } from '@/utils'
import { themeColors } from '@/theme'
import { AnimationType } from '@/types'

interface MultiTrackModeSelectorProps {
  animationType: AnimationType
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  phaseOffsetSeconds: number
  centerPoint?: { x: number; y: number; z: number }
  onModeChange: (mode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered') => void
  onPhaseOffsetChange: (seconds: number) => void
  onCenterPointChange?: (point: { x: number; y: number; z: number }) => void
  getCompatibleModes: (type: AnimationType) => {
    identical: { compatible: boolean; reason: string }
    'phase-offset': { compatible: boolean; reason: string }
    'position-relative': { compatible: boolean; reason: string }
    'phase-offset-relative': { compatible: boolean; reason: string }
    'isobarycenter': { compatible: boolean; reason: string }
    'centered': { compatible: boolean; reason: string }
  }
}

export const MultiTrackModeSelector: React.FC<MultiTrackModeSelectorProps> = ({
  animationType,
  multiTrackMode,
  phaseOffsetSeconds,
  centerPoint = { x: 0, y: 0, z: 0 },
  onModeChange,
  onPhaseOffsetChange,
  onCenterPointChange,
  getCompatibleModes
}) => {
  const compatibleModes = getCompatibleModes(animationType)

  return (
    <div className={`mb-4 ${themeColors.multiTrackMode.background} border ${themeColors.multiTrackMode.border} rounded-lg p-4`}>
      <h3 className={`text-sm font-semibold ${themeColors.text.primary} mb-3`}>Multi-Track Application Mode</h3>
      
      <div className="space-y-3">
        {/* Mode Selection - Identical mode hidden but kept in code */}
        <div className="grid grid-cols-3 gap-2">

          <button
            onClick={() => onModeChange('phase-offset')}
            disabled={!compatibleModes['phase-offset'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'phase-offset'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : compatibleModes['phase-offset'].compatible
                ? `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.secondary} opacity-50 cursor-not-allowed`
            )}
            title={!compatibleModes['phase-offset'].compatible ? compatibleModes['phase-offset'].reason : ''}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🔄 Phase Offset</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Staggered start times creating wave effect</div>
            {!compatibleModes['phase-offset'].compatible && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {compatibleModes['phase-offset'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('position-relative')}
            disabled={!compatibleModes['position-relative'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'position-relative'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : compatibleModes['position-relative'].compatible
                ? `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.secondary} opacity-50 cursor-not-allowed`
            )}
            title={!compatibleModes['position-relative'].compatible ? compatibleModes['position-relative'].reason : ''}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>📍 Position Relative</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Each track animates from its own position</div>
            {!compatibleModes['position-relative'].compatible && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {compatibleModes['position-relative'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('phase-offset-relative')}
            disabled={!compatibleModes['phase-offset-relative'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'phase-offset-relative'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : compatibleModes['phase-offset-relative'].compatible
                ? `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.secondary} opacity-50 cursor-not-allowed`
            )}
            title={!compatibleModes['phase-offset-relative'].compatible ? compatibleModes['phase-offset-relative'].reason : ''}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🔄📍 Offset + Relative</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Own position + staggered timing</div>
            {!compatibleModes['phase-offset-relative'].compatible && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {compatibleModes['phase-offset-relative'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('isobarycenter')}
            disabled={!compatibleModes['isobarycenter'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'isobarycenter'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : compatibleModes['isobarycenter'].compatible
                ? `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.secondary} opacity-50 cursor-not-allowed`
            )}
            title={!compatibleModes['isobarycenter'].compatible ? compatibleModes['isobarycenter'].reason : ''}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🎯 Formation</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Tracks move as rigid formation (barycenter)</div>
            {!compatibleModes['isobarycenter'].compatible && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {compatibleModes['isobarycenter'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('centered')}
            disabled={!compatibleModes['centered'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'centered'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : compatibleModes['centered'].compatible
                ? `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.secondary} opacity-50 cursor-not-allowed`
            )}
            title={!compatibleModes['centered'].compatible ? compatibleModes['centered'].reason : ''}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>⭕ Centered</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>All tracks animate around a center point</div>
            {!compatibleModes['centered'].compatible && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ {compatibleModes['centered'].reason}</div>
            )}
          </button>
        </div>

        {/* Center Point Controls - Show for centered mode */}
        {multiTrackMode === 'centered' && onCenterPointChange && (
          <div className={`${themeColors.background.primary} border border-blue-200 dark:border-gray-600 rounded-lg p-3`}>
            <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
              Animation Center Point (x, y, z)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={`text-xs ${themeColors.text.muted}`}>X</label>
                <input
                  type="number"
                  step="0.5"
                  value={centerPoint.x}
                  onChange={(e) => onCenterPointChange({ ...centerPoint, x: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className={`text-xs ${themeColors.text.muted}`}>Y</label>
                <input
                  type="number"
                  step="0.5"
                  value={centerPoint.y}
                  onChange={(e) => onCenterPointChange({ ...centerPoint, y: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className={`text-xs ${themeColors.text.muted}`}>Z</label>
                <input
                  type="number"
                  step="0.5"
                  value={centerPoint.z}
                  onChange={(e) => onCenterPointChange({ ...centerPoint, z: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <p className={`text-xs ${themeColors.text.muted} mt-2`}>
              💡 All tracks will animate around this center point. Use 0,0,0 for world origin or set custom coordinates.
            </p>
          </div>
        )}

        {/* Phase Offset Controls - Show for phase-offset modes */}
        {(multiTrackMode === 'phase-offset' || multiTrackMode === 'phase-offset-relative') && (
          <div className={`${themeColors.background.primary} border border-blue-200 dark:border-gray-600 rounded-lg p-3`}>
            <label className={`block text-sm font-medium ${themeColors.text.secondary} mb-2`}>
              Time Offset Between Tracks (seconds)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={phaseOffsetSeconds}
              onChange={(e) => onPhaseOffsetChange(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className={`text-xs ${themeColors.text.muted} mt-1`}>
              Track 1 starts at 0s, Track 2 at {phaseOffsetSeconds}s, Track 3 at {(phaseOffsetSeconds * 2).toFixed(1)}s, etc.
            </p>
          </div>
        )}

        {/* Mode Descriptions */}
        <div className={`${themeColors.background.primary} border ${themeColors.multiTrackMode.border} rounded-lg p-3`}>
          <div className={`text-xs ${themeColors.text.secondary}`}>
            {multiTrackMode === 'identical' && (
              <span>💡 <strong>Use case:</strong> Synchronized movement - all sources move together as a group</span>
            )}
            {multiTrackMode === 'phase-offset' && (
              <span>💡 <strong>Use case:</strong> Creating waves, cascades, or sequential effects across multiple sources</span>
            )}
            {multiTrackMode === 'position-relative' && (
              <span>💡 <strong>Use case:</strong> Each source follows the same pattern but relative to its own position</span>
            )}
            {multiTrackMode === 'phase-offset-relative' && (
              <span>💡 <strong>Use case:</strong> Staggered waves where each source has its own path - ideal for distributed spatial effects</span>
            )}
            {multiTrackMode === 'isobarycenter' && (
              <span>💡 <strong>Use case:</strong> Move speaker arrays or groups while maintaining their geometry - perfect for dome/immersive formations</span>
            )}
            {multiTrackMode === 'centered' && (
              <span>💡 <strong>Use case:</strong> All tracks orbit or move around a specific point in space - great for circular scans, orbits, and radial effects</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
