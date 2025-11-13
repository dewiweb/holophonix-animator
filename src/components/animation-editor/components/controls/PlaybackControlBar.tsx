/**
 * Playback Control Bar
 * 
 * Clean, focused control bar for animation playback:
 * - Left: Playback controls (Play/Pause, Stop)
 * - Center: Timing indicator (when playing - shows loop, direction, progress)
 * - Right: Animation menu + Settings toggle
 * 
 * Animation management (load/save) is in a dropdown menu to avoid clutter
 */

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils'
import { Play, Pause, Square, Home, PanelRightOpen, PanelRightClose, FolderOpen, BookOpen, Save, ChevronDown, Menu, Plus } from 'lucide-react'
import { AnimationTimingIndicator } from './AnimationTimingIndicator'

interface PlaybackControlBarProps {
  // Playback state
  isPlaying: boolean
  hasAnimation: boolean
  onPlay: () => void
  onStop: () => void
  currentAnimationId?: string | null
  
  // Animation management
  onNewAnimation: () => void
  onLoadAnimation: () => void
  onSaveAnimation: () => void
  canSave: boolean
  
  // Preset management
  onLoadPreset: () => void
  onSaveAsPreset: () => void
  
  // Settings panel
  isSettingsPanelOpen: boolean
  onToggleSettingsPanel: () => void
  
  // Home/Reset
  onReturnToInitial: () => void
  
  // Additional actions
  onContextMenu?: (e: React.MouseEvent, action: string) => void
}

export const PlaybackControlBar: React.FC<PlaybackControlBarProps> = ({
  isPlaying,
  hasAnimation,
  onPlay,
  onStop,
  currentAnimationId,
  onNewAnimation,
  onLoadAnimation,
  onSaveAnimation,
  canSave,
  onLoadPreset,
  onSaveAsPreset,
  isSettingsPanelOpen,
  onToggleSettingsPanel,
  onReturnToInitial,
  onContextMenu
}) => {
  const [isAnimationMenuOpen, setIsAnimationMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAnimationMenuOpen(false)
      }
    }

    if (isAnimationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAnimationMenuOpen])

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

        {/* Return to Initial (Home) */}
        <button
          onClick={onReturnToInitial}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
            "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
          )}
          title="Return all tracks to initial positions"
        >
          <Home className="w-4 h-4" />
          <span className="hidden lg:inline">Home</span>
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

      {/* RIGHT SECTION: Animation Menu + Settings */}
      <div className="flex items-center gap-2">
        {/* Animation Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsAnimationMenuOpen(!isAnimationMenuOpen)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            title="Animation management menu"
          >
            <Menu className="w-4 h-4" />
            <span>Animation</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isAnimationMenuOpen && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {isAnimationMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-600 z-50 overflow-hidden backdrop-blur-sm">
              {/* Project Section */}
              <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Project Animations</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                  Saved in project file • Used in timeline/cues
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    onNewAnimation()
                    setIsAnimationMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium">New Animation</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Start fresh (clear form)</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLoadAnimation()
                    setIsAnimationMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <FolderOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="font-medium">Load from Project</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Browse saved animations</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSaveAnimation()
                    setIsAnimationMenuOpen(false)
                  }}
                  disabled={!canSave}
                  className={cn(
                    "w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3",
                    canSave ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  )}
                >
                  <Save className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <div>
                    <div className="font-medium">Save to Project</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Save with track bindings</div>
                  </div>
                </button>
              </div>

              {/* Library Section */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Template Library</span>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 px-2">
                  Global presets • Reusable across projects
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    onLoadPreset()
                    setIsAnimationMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-sm text-left rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="font-medium">Load from Library</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Browse preset templates</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSaveAsPreset()
                    setIsAnimationMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-sm text-left rounded hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <Save className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="font-medium">Save to Library</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Create reusable template</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

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
