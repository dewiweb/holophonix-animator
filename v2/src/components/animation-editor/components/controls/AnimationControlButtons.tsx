import React from 'react'
import { cn } from '@/utils'
import { Play, Pause, Square, Eye, EyeOff, Clock, Download, Upload } from 'lucide-react'

interface AnimationControlButtonsProps {
  previewMode: boolean
  isAnimationPlaying: boolean
  hasAnimation: boolean
  isCustomAnimation: boolean
  showKeyframeEditor: boolean
  onTogglePreview: () => void
  onPlay: () => void
  onStop: () => void
  onToggleKeyframeEditor: () => void
  onLoadPreset: () => void
  onSaveAsPreset: () => void
  canSavePreset: boolean
}

export const AnimationControlButtons: React.FC<AnimationControlButtonsProps> = ({
  previewMode,
  isAnimationPlaying,
  hasAnimation,
  isCustomAnimation,
  showKeyframeEditor,
  onTogglePreview,
  onPlay,
  onStop,
  onToggleKeyframeEditor,
  onLoadPreset,
  onSaveAsPreset,
  canSavePreset
}) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onTogglePreview}
        className={cn(
          "px-3 py-2 rounded-md text-sm transition-colors flex items-center",
          previewMode ? "bg-blue-600 dark:bg-blue-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        )}
      >
        {previewMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        {previewMode ? 'Hide Preview' : 'Show Preview'}
      </button>

      <button
        onClick={onPlay}
        disabled={!hasAnimation}
        className={cn(
          "px-3 py-2 rounded-md text-sm transition-colors flex items-center",
          isAnimationPlaying 
            ? "bg-yellow-600 dark:bg-yellow-700 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600" 
            : "bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600",
          !hasAnimation && "opacity-50 cursor-not-allowed"
        )}
      >
        {isAnimationPlaying ? (
          <>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Play
          </>
        )}
      </button>

      <button
        onClick={onStop}
        disabled={!hasAnimation}
        className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Square className="w-4 h-4 mr-2" />
        Stop
      </button>

      {isCustomAnimation && (
        <button
          onClick={onToggleKeyframeEditor}
          className={cn(
            "px-3 py-2 rounded-md text-sm transition-colors flex items-center",
            showKeyframeEditor ? "bg-purple-600 dark:bg-purple-700 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          )}
        >
          <Clock className="w-4 h-4 mr-2" />
          Keyframe Editor
        </button>
      )}

      <button
        onClick={onLoadPreset}
        className="px-3 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Load Preset
      </button>

      <button
        onClick={onSaveAsPreset}
        disabled={!canSavePreset}
        className="px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Upload className="w-4 h-4 mr-2" />
        Save as Preset
      </button>
    </div>
  )
}
