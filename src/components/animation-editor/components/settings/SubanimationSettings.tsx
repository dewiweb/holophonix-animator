/**
 * Subanimation Settings
 * 
 * UI controls for configuring fade-in and fade-out subanimations
 */

import React from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'

interface SubanimationSettingsProps {
  // Fade-in settings
  fadeInEnabled: boolean
  fadeInDuration: number
  fadeInEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  onFadeInEnabledChange: (enabled: boolean) => void
  onFadeInDurationChange: (duration: number) => void
  onFadeInEasingChange: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
  
  // Fade-out settings
  fadeOutEnabled: boolean
  fadeOutDuration: number
  fadeOutEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  onFadeOutEnabledChange: (enabled: boolean) => void
  onFadeOutDurationChange: (duration: number) => void
  onFadeOutEasingChange: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
}

export const SubanimationSettings: React.FC<SubanimationSettingsProps> = ({
  fadeInEnabled,
  fadeInDuration,
  fadeInEasing,
  onFadeInEnabledChange,
  onFadeInDurationChange,
  onFadeInEasingChange,
  fadeOutEnabled,
  fadeOutDuration,
  fadeOutEasing,
  onFadeOutEnabledChange,
  onFadeOutDurationChange,
  onFadeOutEasingChange
}) => {
  const [fadeInExpanded, setFadeInExpanded] = React.useState(false)
  const [fadeOutExpanded, setFadeOutExpanded] = React.useState(false)

  return (
    <div className="space-y-4">

      {/* Fade-In Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setFadeInExpanded(!fadeInExpanded)}
          className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            {fadeInExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Fade-In</span>
            {fadeInEnabled && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">
                ({fadeInDuration}s)
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={fadeInEnabled}
              onChange={(e) => onFadeInEnabledChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Enabled</span>
          </label>
        </button>

        {/* Content */}
        {fadeInExpanded && (
          <div className="p-3 space-y-3 bg-white dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Smoothly ease tracks to start position before animation begins
            </p>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={fadeInDuration}
                  onChange={(e) => onFadeInDurationChange(parseFloat(e.target.value))}
                  disabled={!fadeInEnabled}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={fadeInDuration}
                  onChange={(e) => onFadeInDurationChange(parseFloat(e.target.value))}
                  disabled={!fadeInEnabled}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Easing */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Easing Function
              </label>
              <select
                value={fadeInEasing}
                onChange={(e) => onFadeInEasingChange(e.target.value as any)}
                disabled={!fadeInEnabled}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-50"
              >
                <option value="ease-out">Ease Out (smooth start)</option>
                <option value="ease-in">Ease In (smooth end)</option>
                <option value="ease-in-out">Ease In-Out (smooth both)</option>
                <option value="linear">Linear (constant speed)</option>
              </select>
            </div>

            {/* Preview */}
            {fadeInEnabled && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <span className="font-medium text-blue-700 dark:text-blue-400">Preview:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {fadeInDuration}s {fadeInEasing} transition to start position
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fade-Out Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setFadeOutExpanded(!fadeOutExpanded)}
          className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            {fadeOutExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Fade-Out</span>
            {fadeOutEnabled && (
              <span className="text-xs text-purple-600 dark:text-purple-400 font-normal">
                ({fadeOutDuration}s)
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={fadeOutEnabled}
              onChange={(e) => onFadeOutEnabledChange(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">Enabled</span>
          </label>
        </button>

        {/* Content */}
        {fadeOutExpanded && (
          <div className="p-3 space-y-3 bg-white dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Smoothly return tracks to initial position after animation stops
            </p>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={fadeOutDuration}
                  onChange={(e) => onFadeOutDurationChange(parseFloat(e.target.value))}
                  disabled={!fadeOutEnabled}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={fadeOutDuration}
                  onChange={(e) => onFadeOutDurationChange(parseFloat(e.target.value))}
                  disabled={!fadeOutEnabled}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Easing */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Easing Function
              </label>
              <select
                value={fadeOutEasing}
                onChange={(e) => onFadeOutEasingChange(e.target.value as any)}
                disabled={!fadeOutEnabled}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 disabled:opacity-50"
              >
                <option value="ease-in">Ease In (smooth end)</option>
                <option value="ease-out">Ease Out (smooth start)</option>
                <option value="ease-in-out">Ease In-Out (smooth both)</option>
                <option value="linear">Linear (constant speed)</option>
              </select>
            </div>

            {/* Preview */}
            {fadeOutEnabled && (
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs">
                <span className="font-medium text-purple-700 dark:text-purple-400">Preview:</span>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  {fadeOutDuration}s {fadeOutEasing} transition to initial position
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total Duration Info */}
      {(fadeInEnabled || fadeOutEnabled) && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Total Duration
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {fadeInEnabled && <span>Fade-in: {fadeInDuration}s</span>}
            {fadeInEnabled && fadeOutEnabled && <span className="mx-2">+</span>}
            <span>Animation: [duration]s</span>
            {fadeOutEnabled && <span className="mx-2">+</span>}
            {fadeOutEnabled && <span>Fade-out: {fadeOutDuration}s</span>}
          </div>
        </div>
      )}
    </div>
  )
}
