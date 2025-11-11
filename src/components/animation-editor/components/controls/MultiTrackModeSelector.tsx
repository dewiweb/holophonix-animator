import { cn } from '@/utils'
import { themeColors } from '@/theme'
import { AnimationType, Position, Track } from '@/types'
import { useState } from 'react'

interface MultiTrackModeSelectorProps {
  animationType: AnimationType
  multiTrackMode: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  customCenter?: Position
  preserveOffsets?: boolean
  phaseOffsetSeconds: number
  tracks?: Track[]
  onModeChange: (mode: 'relative' | 'barycentric') => void
  onVariantChange?: (variant: 'shared' | 'isobarycentric' | 'centered' | 'custom') => void
  onCustomCenterChange?: (center: Position | undefined) => void
  onPreserveOffsetsChange?: (preserve: boolean | undefined) => void
  onPhaseOffsetChange: (seconds: number) => void
  getCompatibleModes?: (type: AnimationType) => {
    relative: { compatible: boolean; reason: string }
    barycentric: { compatible: boolean; reason: string }
  }
}

export const MultiTrackModeSelector: React.FC<MultiTrackModeSelectorProps> = ({
  multiTrackMode,
  barycentricVariant = 'shared',
  customCenter,
  preserveOffsets,
  phaseOffsetSeconds,
  tracks = [],
  onModeChange,
  onVariantChange,
  onCustomCenterChange,
  onPreserveOffsetsChange,
  onPhaseOffsetChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  return (
    <div className={`mb-4 ${themeColors.multiTrackMode.background} border ${themeColors.multiTrackMode.border} rounded-lg p-4`}>
      <h3 className={`text-sm font-semibold ${themeColors.text.primary} mb-3`}>Multi-Track Mode</h3>
      <p className={`text-xs ${themeColors.text.muted} mb-3`}>
        <strong>Relative:</strong> per-track params (offset by position) | <strong>Barycentric:</strong> formation around center (variants: shared, isobarycentric, centered)
      </p>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
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
            <div className={`text-xs ${themeColors.text.secondary}`}>Per-track, offset by position</div>
          </button>

          <button
            onClick={() => onModeChange('barycentric')}
            className={cn(
              "p-3 border rounded-lg text-left transition-all",
              multiTrackMode === 'barycentric'
                ? `border-blue-500 ${themeColors.accent.background.medium} shadow-sm`
                : `border-gray-200 dark:border-gray-600 ${themeColors.background.primary} hover:bg-gray-50 dark:hover:bg-gray-700`
            )}
          >
            <div className={`font-medium text-sm mb-1 ${themeColors.text.secondary}`}>🎯 Barycentric</div>
            <div className={`text-xs ${themeColors.text.secondary}`}>Formation around center</div>
          </button>
        </div>

        {/* Barycentric Variant Selector */}
        {multiTrackMode === 'barycentric' && onVariantChange && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Variant</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onVariantChange('shared')}
                className={cn(
                  "px-3 py-2 text-xs rounded border",
                  barycentricVariant === 'shared'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Shared
              </button>
              <button
                onClick={() => onVariantChange('isobarycentric')}
                className={cn(
                  "px-3 py-2 text-xs rounded border",
                  barycentricVariant === 'isobarycentric'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Isobarycentric
              </button>
              <button
                onClick={() => onVariantChange('centered')}
                className={cn(
                  "px-3 py-2 text-xs rounded border",
                  barycentricVariant === 'centered'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Centered
              </button>
              <button
                onClick={() => onVariantChange('custom')}
                className={cn(
                  "px-3 py-2 text-xs rounded border",
                  barycentricVariant === 'custom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Custom
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {barycentricVariant === 'shared' && '🟢 User-defined center, radius=0 (all tracks at center, moving identically)'}
              {barycentricVariant === 'isobarycentric' && '🟠 Auto-calculated center, preserves original track offsets (rigid formation)'}
              {barycentricVariant === 'centered' && '🟢 User-defined center, preserves original track offsets (rigid formation)'}
              {barycentricVariant === 'custom' && '🎯 User-defined center + orbital radius (arrange tracks in circle around center)'}
            </p>

            {/* Orbital Radius Control - only for custom variant */}
            {barycentricVariant === 'custom' && (
              <div className="mt-3 p-3 bg-indigo-900/20 rounded border border-indigo-700/30">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-indigo-300">
                    Orbital Radius
                  </label>
                  <span className="text-xs text-indigo-400 font-mono">
                    {customCenter?.radius ?? 5.0} m
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={customCenter?.radius ?? 5.0}
                  onChange={(e) => {
                    const radius = parseFloat(e.target.value)
                    onCustomCenterChange?.({
                      x: customCenter?.x ?? 0,
                      y: customCenter?.y ?? 0,
                      z: customCenter?.z ?? 0,
                      radius: radius
                    })
                  }}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="mt-2 text-xs text-gray-500">
                  🌐 Tracks are distributed on a sphere at this distance from the center.
                  <br/>
                  • Radius = 0 → All tracks at center (like shared)
                  <br/>
                  • Radius &gt; 0 → Tracks distributed evenly on 3D sphere surface
                  <br/>
                  • Uses spherical coordinates for uniform distribution
                </p>
              </div>
            )}
            
            {/* Barycentric Center Position Display & Editor */}
            {(barycentricVariant === 'custom' || barycentricVariant === 'centered' || barycentricVariant === 'shared') && (
              <div className="mt-3 p-3 bg-purple-900/30 rounded border border-purple-700/30">
                <div className="text-xs font-medium text-purple-300 mb-2">
                  Center Position
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">X</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(customCenter?.x ?? 0).toFixed(2)}
                      onChange={(e) => {
                        const newCenter = { 
                          x: parseFloat(e.target.value) || 0,
                          y: customCenter?.y ?? 0,
                          z: customCenter?.z ?? 0
                        }
                        onCustomCenterChange?.(newCenter)
                      }}
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Y</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(customCenter?.y ?? 0).toFixed(2)}
                      onChange={(e) => {
                        const newCenter = { 
                          x: customCenter?.x ?? 0,
                          y: parseFloat(e.target.value) || 0,
                          z: customCenter?.z ?? 0
                        }
                        onCustomCenterChange?.(newCenter)
                      }}
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Z</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(customCenter?.z ?? 0).toFixed(2)}
                      onChange={(e) => {
                        const newCenter = { 
                          x: customCenter?.x ?? 0,
                          y: customCenter?.y ?? 0,
                          z: parseFloat(e.target.value) || 0
                        }
                        onCustomCenterChange?.(newCenter)
                      }}
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <span>💡</span>
                  <span>Drag center in 3D view or edit coordinates here</span>
                </div>
              </div>
            )}
            
            {/* Isobarycentric Auto-Calculated Center Display (Read-Only) */}
            {barycentricVariant === 'isobarycentric' && tracks.length > 0 && (() => {
              const center = {
                x: tracks.reduce((sum, t) => sum + (t.initialPosition?.x ?? t.position.x), 0) / tracks.length,
                y: tracks.reduce((sum, t) => sum + (t.initialPosition?.y ?? t.position.y), 0) / tracks.length,
                z: tracks.reduce((sum, t) => sum + (t.initialPosition?.z ?? t.position.z), 0) / tracks.length,
              }
              return (
                <div className="mt-3 p-3 bg-orange-900/20 rounded border border-orange-700/30">
                  <div className="text-xs font-medium text-orange-300 mb-2">
                    Auto-Calculated Center (Read-Only)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">X</div>
                      <div className="text-sm font-mono text-orange-400">{center.x.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Y</div>
                      <div className="text-sm font-mono text-orange-400">{center.y.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Z</div>
                      <div className="text-sm font-mono text-orange-400">{center.z.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ℹ️ Automatically calculated from {tracks.length} track{tracks.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

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
