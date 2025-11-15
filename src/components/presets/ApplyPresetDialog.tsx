/**
 * Apply Preset Dialog
 * 
 * Dialog for applying a position preset with transition settings.
 */

import React, { useState, useMemo } from 'react'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils'
import {
  X,
  Play,
  Settings as SettingsIcon
} from 'lucide-react'
import type { 
  PositionPreset, 
  InterpolationMode, 
  EasingFunction,
  StaggerMode 
} from '@/types/positionPreset'

interface ApplyPresetDialogProps {
  presetId?: string
  onClose: () => void
  onApplied?: () => void
}

export const ApplyPresetDialog: React.FC<ApplyPresetDialogProps> = ({
  presetId: initialPresetId,
  onClose,
  onApplied
}) => {
  const { presets, getPreset, applyPreset, isApplying } = usePositionPresetStore()
  const { tracks } = useProjectStore()

  // Allow user to select preset
  const [selectedPresetId, setSelectedPresetId] = useState(
    initialPresetId || presets[0]?.id || ''
  )

  const preset = getPreset(selectedPresetId)

  // Transition settings
  const [duration, setDuration] = useState(2.0)
  const [easing, setEasing] = useState<EasingFunction>('ease-in-out')
  const [mode, setMode] = useState<InterpolationMode>('cartesian')
  
  // Stagger settings
  const [staggerEnabled, setStaggerEnabled] = useState(false)
  const [staggerMode, setStaggerMode] = useState<StaggerMode>('sequential')
  const [staggerDelay, setStaggerDelay] = useState(0.15)
  const [staggerOverlap, setStaggerOverlap] = useState(0.5)
  
  // Options
  const [interruptAnimations, setInterruptAnimations] = useState(true)
  const [respectBounds, setRespectBounds] = useState(true)
  const [validateBeforeApply, setValidateBeforeApply] = useState(false)

  const easingOptions: Array<{ value: EasingFunction; label: string }> = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in-out', label: 'Ease In-Out' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out-cubic', label: 'Cubic In-Out' },
    { value: 'ease-in-out-expo', label: 'Exponential' },
    { value: 'ease-out-elastic', label: 'Elastic' },
    { value: 'ease-out-back', label: 'Back' }
  ]

  const modeOptions: Array<{ value: InterpolationMode; label: string; description: string }> = [
    { value: 'cartesian', label: 'Cartesian', description: 'Linear XYZ' },
    { value: 'spherical', label: 'Spherical', description: 'Smooth arcs' },
    { value: 'bezier', label: 'Bezier', description: 'Curved paths' },
    { value: 'circular', label: 'Circular', description: 'Constant radius' }
  ]

  const staggerModeOptions: Array<{ value: StaggerMode; label: string }> = [
    { value: 'sequential', label: 'Sequential' },
    { value: 'random', label: 'Random' },
    { value: 'inside-out', label: 'Inside-Out' },
    { value: 'outside-in', label: 'Outside-In' },
    { value: 'distance', label: 'By Distance' }
  ]

  // Calculate estimated time
  const estimatedTime = useMemo(() => {
    if (!preset) return 0
    
    let time = duration
    if (staggerEnabled) {
      const trackCount = preset.trackIds.length
      const staggerTime = (trackCount - 1) * staggerDelay * (1 - staggerOverlap)
      time += staggerTime
    }
    return time
  }, [preset, duration, staggerEnabled, staggerDelay, staggerOverlap])

  // Track count
  const trackCount = preset?.trackIds.length || 0

  const handleApply = async () => {
    if (!preset) return

    await applyPreset(selectedPresetId, {
      transition: {
        duration,
        easing,
        mode,
        stagger: staggerEnabled ? {
          enabled: true,
          mode: staggerMode,
          delay: staggerDelay,
          overlap: staggerOverlap
        } : undefined
      },
      interruptAnimations,
      respectBounds
      // validateBeforeApply handled internally by store
    })

    if (onApplied) onApplied()
    onClose()
  }

  if (!preset) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <p className="text-gray-900 dark:text-gray-100">Preset not found</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Play size={20} />
            Apply Preset
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Select Preset to Apply
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100'
              )}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.trackIds.length} tracks)
                </option>
              ))}
            </select>
          </div>

          {/* Preset Info */}
          {preset && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                {preset.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {trackCount} tracks • {preset.category || 'custom'} • {preset.scope}
              </p>
              {preset.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {preset.description}
                </p>
              )}
            </div>
          )}

          {/* Transition Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Transition
            </h3>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-700 dark:text-gray-300">
                  Duration: {duration.toFixed(1)}s
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Easing */}
            <div className="space-y-1">
              <label className="text-xs text-gray-700 dark:text-gray-300">
                Easing
              </label>
              <select
                value={easing}
                onChange={(e) => setEasing(e.target.value as EasingFunction)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                  'text-gray-900 dark:text-gray-100'
                )}
              >
                {easingOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode */}
            <div className="space-y-1">
              <label className="text-xs text-gray-700 dark:text-gray-300">
                Interpolation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {modeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-md text-xs font-medium transition-colors text-left',
                      mode === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-[10px] opacity-75">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stagger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="stagger-enabled"
                checked={staggerEnabled}
                onChange={(e) => setStaggerEnabled(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="stagger-enabled" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                Enable Stagger
              </label>
            </div>

            {staggerEnabled && (
              <div className="space-y-3 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                {/* Stagger Mode */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-700 dark:text-gray-300">
                    Pattern
                  </label>
                  <select
                    value={staggerMode}
                    onChange={(e) => setStaggerMode(e.target.value as StaggerMode)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-md text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                      'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {staggerModeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delay */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-700 dark:text-gray-300">
                      Delay: {staggerDelay.toFixed(2)}s
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={staggerDelay}
                    onChange={(e) => setStaggerDelay(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Overlap */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-700 dark:text-gray-300">
                      Overlap: {(staggerOverlap * 100).toFixed(0)}%
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={staggerOverlap}
                    onChange={(e) => setStaggerOverlap(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Options
            </h3>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={interruptAnimations}
                onChange={(e) => setInterruptAnimations(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Interrupt running animations
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={respectBounds}
                onChange={(e) => setRespectBounds(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Respect safety bounds
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={validateBeforeApply}
                onChange={(e) => setValidateBeforeApply(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Validate before apply
              </span>
            </label>
          </div>

          {/* Summary */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Will move:</strong> {trackCount} tracks
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              <strong>Estimated time:</strong> {estimatedTime.toFixed(1)}s
              {staggerEnabled && ' (with stagger)'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            icon={Play}
            onClick={handleApply}
            loading={isApplying}
          >
            Apply Preset
          </Button>
        </div>
      </div>
    </div>
  )
}
