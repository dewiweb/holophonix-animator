import React from 'react'
import { cn } from '@/utils'
import { AnimationType } from '@/types'

interface MultiTrackModeSelectorProps {
  animationType: AnimationType
  multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative'
  phaseOffsetSeconds: number
  onModeChange: (mode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative') => void
  onPhaseOffsetChange: (seconds: number) => void
  getCompatibleModes: (type: AnimationType) => {
    identical: { compatible: boolean; reason: string }
    'phase-offset': { compatible: boolean; reason: string }
    'position-relative': { compatible: boolean; reason: string }
    'phase-offset-relative': { compatible: boolean; reason: string }
  }
}

export const MultiTrackModeSelector: React.FC<MultiTrackModeSelectorProps> = ({
  animationType,
  multiTrackMode,
  phaseOffsetSeconds,
  onModeChange,
  onPhaseOffsetChange,
  getCompatibleModes
}) => {
  const compatibleModes = getCompatibleModes(animationType)

  return (
    <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Multi-Track Application Mode</h3>
      
      <div className="space-y-3">
        {/* Mode Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange('identical')}
            disabled={!compatibleModes.identical.compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'identical'
                ? "border-purple-500 bg-purple-100 shadow-sm"
                : compatibleModes.identical.compatible
                ? "border-gray-300 bg-white hover:bg-gray-50"
                : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
            )}
            title={!compatibleModes.identical.compatible ? compatibleModes.identical.reason : ''}
          >
            <div className="font-medium text-sm mb-1">🔁 Identical</div>
            <div className="text-xs text-gray-600">All tracks play the same animation simultaneously</div>
            {!compatibleModes.identical.compatible && (
              <div className="text-xs text-red-600 mt-1">⚠️ {compatibleModes.identical.reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('phase-offset')}
            disabled={!compatibleModes['phase-offset'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'phase-offset'
                ? "border-purple-500 bg-purple-100 shadow-sm"
                : compatibleModes['phase-offset'].compatible
                ? "border-gray-300 bg-white hover:bg-gray-50"
                : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
            )}
            title={!compatibleModes['phase-offset'].compatible ? compatibleModes['phase-offset'].reason : ''}
          >
            <div className="font-medium text-sm mb-1">🔄 Phase Offset</div>
            <div className="text-xs text-gray-600">Staggered start times creating wave effect</div>
            {!compatibleModes['phase-offset'].compatible && (
              <div className="text-xs text-red-600 mt-1">⚠️ {compatibleModes['phase-offset'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('position-relative')}
            disabled={!compatibleModes['position-relative'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'position-relative'
                ? "border-purple-500 bg-purple-100 shadow-sm"
                : compatibleModes['position-relative'].compatible
                ? "border-gray-300 bg-white hover:bg-gray-50"
                : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
            )}
            title={!compatibleModes['position-relative'].compatible ? compatibleModes['position-relative'].reason : ''}
          >
            <div className="font-medium text-sm mb-1">📍 Position Relative</div>
            <div className="text-xs text-gray-600">Each track animates from its own position</div>
            {!compatibleModes['position-relative'].compatible && (
              <div className="text-xs text-red-600 mt-1">⚠️ {compatibleModes['position-relative'].reason}</div>
            )}
          </button>

          <button
            onClick={() => onModeChange('phase-offset-relative')}
            disabled={!compatibleModes['phase-offset-relative'].compatible}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'phase-offset-relative'
                ? "border-purple-500 bg-purple-100 shadow-sm"
                : compatibleModes['phase-offset-relative'].compatible
                ? "border-gray-300 bg-white hover:bg-gray-50"
                : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
            )}
            title={!compatibleModes['phase-offset-relative'].compatible ? compatibleModes['phase-offset-relative'].reason : ''}
          >
            <div className="font-medium text-sm mb-1">🔄📍 Offset + Relative</div>
            <div className="text-xs text-gray-600">Own position + staggered timing</div>
            {!compatibleModes['phase-offset-relative'].compatible && (
              <div className="text-xs text-red-600 mt-1">⚠️ {compatibleModes['phase-offset-relative'].reason}</div>
            )}
          </button>
        </div>

        {/* Phase Offset Controls - Show for phase-offset modes */}
        {(multiTrackMode === 'phase-offset' || multiTrackMode === 'phase-offset-relative') && (
          <div className="bg-white border border-purple-200 rounded-lg p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Offset Between Tracks (seconds)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={phaseOffsetSeconds}
              onChange={(e) => onPhaseOffsetChange(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Track 1 starts at 0s, Track 2 at {phaseOffsetSeconds}s, Track 3 at {(phaseOffsetSeconds * 2).toFixed(1)}s, etc.
            </p>
          </div>
        )}

        {/* Mode Descriptions */}
        <div className="bg-white border border-purple-200 rounded-lg p-3">
          <div className="text-xs text-gray-600">
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
          </div>
        </div>
      </div>
    </div>
  )
}
