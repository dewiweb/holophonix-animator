/**
 * Position Cue Fields
 * 
 * Form fields for editing position cue data.
 * Used within CueEditorV2.
 */

import React, { useState } from 'react'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils'
import { Home, Play, Settings as SettingsIcon } from 'lucide-react'
import type { InterpolationMode, EasingFunction } from '@/types/positionPreset'

interface PositionCueFieldsProps {
  presetId: string
  duration: number
  easing: EasingFunction
  mode: InterpolationMode
  interruptAnimations: boolean
  onPresetChange: (presetId: string) => void
  onDurationChange: (duration: number) => void
  onEasingChange: (easing: EasingFunction) => void
  onModeChange: (mode: InterpolationMode) => void
  onInterruptAnimationsChange: (interrupt: boolean) => void
}

export const PositionCueFields: React.FC<PositionCueFieldsProps> = ({
  presetId,
  duration,
  easing,
  mode,
  interruptAnimations,
  onPresetChange,
  onDurationChange,
  onEasingChange,
  onModeChange,
  onInterruptAnimationsChange
}) => {
  const { presets, getPreset } = usePositionPresetStore()

  const preset = getPreset(presetId)

  const easingOptions: Array<{ value: EasingFunction; label: string }> = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease-in-out', label: 'Ease In-Out' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out-cubic', label: 'Cubic In-Out' },
    { value: 'ease-in-out-expo', label: 'Exponential' }
  ]

  const modeOptions: Array<{ value: InterpolationMode; label: string }> = [
    { value: 'cartesian', label: 'Cartesian' },
    { value: 'spherical', label: 'Spherical' },
    { value: 'bezier', label: 'Bezier' },
    { value: 'circular', label: 'Circular' }
  ]

  return (
    <div className="space-y-4">
      {/* Preset Selection */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          Position Preset *
        </label>
        <select
          value={presetId}
          onChange={(e) => onPresetChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 border rounded-md text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
            'text-gray-900 dark:text-gray-100'
          )}
        >
          <option value="">Select a preset...</option>
          {presets.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.trackIds.length} tracks)
            </option>
          ))}
        </select>

        {preset && (
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
            <p className="text-gray-700 dark:text-gray-300">
              {preset.trackIds.length} tracks • {preset.category || 'custom'}
            </p>
            {preset.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {preset.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Transition Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <SettingsIcon size={14} />
          Transition
        </h4>

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
            onChange={(e) => onDurationChange(parseFloat(e.target.value))}
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
            onChange={(e) => onEasingChange(e.target.value as EasingFunction)}
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
                type="button"
                onClick={() => onModeChange(opt.value)}
                className={cn(
                  'px-2 py-1.5 rounded text-xs font-medium transition-colors',
                  mode === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Options
        </h4>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={interruptAnimations}
            onChange={(e) => onInterruptAnimationsChange(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Interrupt running animations
          </span>
        </label>
      </div>

      {/* Info */}
      {preset && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
          <p className="text-blue-900 dark:text-blue-200">
            Will move {preset.trackIds.length} tracks over {duration.toFixed(1)}s using {mode} interpolation
          </p>
        </div>
      )}
    </div>
  )
}
