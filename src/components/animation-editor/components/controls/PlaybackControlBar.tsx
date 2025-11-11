/**
 * Playback Control Bar
 * 
 * Unified, clean control bar for animation playback with:
 * - Left: Playback controls (Play/Pause, Stop)
 * - Center: Timing indicator (when playing - shows loop, direction, progress)
 * - Right: Animation management (Load, Save, Presets), Settings toggle
 * 
 * Note: Preview/Edit mode toggle is handled by Tab key in unified editor
 */

import React from 'react'
import { cn } from '@/utils'
import { Play, Pause, Square, Download, Upload, Save, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { AnimationTimingIndicator } from './AnimationTimingIndicator'

interface PlaybackControlBarProps {
  // Playback state
  isPlaying: boolean
  hasAnimation: boolean
  onPlay: () => void
  onStop: () => void
  currentAnimationId?: string | null
  
  // Animation management
  onLoadAnimation: () => void
  onSaveAnimation: () => void
  canSave: boolean
  
  // Preset management
  onLoadPreset: () => void
  onSaveAsPreset: () => void
  
  // Settings panel
  isSettingsPanelOpen: boolean
  onToggleSettingsPanel: () => void
  
  // Additional actions
  onContextMenu?: (e: React.MouseEvent, action: string) => void
}

export const PlaybackControlBar: React.FC<PlaybackControlBarProps> = ({
  isPlaying,
  hasAnimation,
  onPlay,
  onStop,
  currentAnimationId,
  onLoadAnimation,
  onSaveAnimation,
  canSave,
  onLoadPreset,
  onSaveAsPreset,
  isSettingsPanelOpen,
  onToggleSettingsPanel,
  onContextMenu
}) => {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* LEFT SECTION: Playback Controls */}
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          onClick={onPlay}
          onContextMenu={(e) => onContextMenu?.(e, 'PLAY')}
          disabled={!hasAnimation}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            isPlaying
              ? "bg-yellow-600 dark:bg-yellow-700 text-white hover:bg-yellow-700 dark:hover:bg-yellow-600"
              : "bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600",
            !hasAnimation && "opacity-50 cursor-not-allowed"
          )}
          title={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Play</span>
            </>
          )}
        </button>

        {/* Stop */}
        <button
          onClick={onStop}
          onContextMenu={(e) => onContextMenu?.(e, 'STOP')}
          disabled={!hasAnimation}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            "bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600",
            !hasAnimation && "opacity-50 cursor-not-allowed"
          )}
          title="Stop animation"
        >
          <Square className="w-4 h-4" />
          <span className="hidden md:inline">Stop</span>
        </button>
      </div>

      {/* CENTER SECTION: Timing Indicator */}
      <div className="flex-1 flex justify-center">
        {isPlaying && currentAnimationId && (
          <AnimationTimingIndicator
            animationId={currentAnimationId}
          />
        )}
      </div>

      {/* RIGHT SECTION: Animation Management + Settings */}
      <div className="flex items-center gap-2">
        {/* Load Animation */}
        <button
          onClick={onLoadAnimation}
          onContextMenu={(e) => onContextMenu?.(e, 'LOAD')}
          className="px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
          title="Load saved animation"
        >
          <Download className="w-4 h-4" />
          <span className="hidden lg:inline">Load</span>
        </button>

        {/* Save Animation */}
        <button
          onClick={onSaveAnimation}
          onContextMenu={(e) => onContextMenu?.(e, 'SAVE')}
          disabled={!canSave}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            "bg-primary-600 dark:bg-primary-700 text-white hover:bg-primary-700 dark:hover:bg-primary-600",
            !canSave && "opacity-50 cursor-not-allowed"
          )}
          title="Save current animation"
        >
          <Save className="w-4 h-4" />
          <span className="hidden lg:inline">Save</span>
        </button>
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        {/* Preset Actions - Compact dropdown */}
        <div className="flex items-center gap-1">
          <button
            onClick={onLoadPreset}
            onContextMenu={(e) => onContextMenu?.(e, 'LOAD_PRESET')}
            className="px-2 py-2 rounded-l-md text-sm font-medium transition-colors flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Load preset"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={onSaveAsPreset}
            onContextMenu={(e) => onContextMenu?.(e, 'SAVE_PRESET')}
            className="px-2 py-2 rounded-r-md text-sm font-medium transition-colors flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            title="Save as preset"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        {/* Separator */}
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Settings Panel Toggle */}
        <button
          onClick={onToggleSettingsPanel}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            "border border-gray-300 dark:border-gray-600",
            isSettingsPanelOpen
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          )}
          title={isSettingsPanelOpen ? "Hide settings panel" : "Show settings panel"}
        >
          {isSettingsPanelOpen ? (
            <>
              <PanelRightClose className="w-4 h-4" />
              <span className="hidden xl:inline">Hide</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="w-4 h-4" />
              <span className="hidden xl:inline">Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
