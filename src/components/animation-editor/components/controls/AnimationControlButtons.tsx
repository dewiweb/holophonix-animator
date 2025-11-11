import React, { useState } from 'react'
import { cn } from '@/utils'
import { Play, Pause, Square, Eye, EyeOff, Clock, Download, Upload, Copy } from 'lucide-react'
import { OSC_INPUT_SPEC, formatOSCPath } from '@/constants/oscInputSpec'
import { useProjectStore } from '@/stores/projectStore'

interface AnimationControlButtonsProps {
  previewMode: boolean
  isAnimationPlaying: boolean
  hasAnimation: boolean
  showKeyframeEditor: boolean
  onTogglePreview: () => void
  onPlay: () => void
  onStop: () => void
  onToggleKeyframeEditor: () => void
  onLoadPreset: () => void
  onSaveAsPreset: () => void
  canSavePreset: boolean
  currentAnimationId?: string | null
}

export const AnimationControlButtons: React.FC<AnimationControlButtonsProps> = ({
  previewMode,
  isAnimationPlaying,
  hasAnimation,
  showKeyframeEditor,
  onTogglePreview,
  onPlay,
  onStop,
  onToggleKeyframeEditor,
  onLoadPreset,
  onSaveAsPreset,
  canSavePreset,
  currentAnimationId
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, oscPath: string) => {
    e.preventDefault()
    
    if (!currentAnimationId) {
      console.warn('No animation is currently selected')
      return
    }
    
    // Get the animation from the project store
    const projectStore = useProjectStore.getState()
    const animation = projectStore.animations.find(a => a.id === currentAnimationId)
    
    if (!animation) {
      console.warn(`Animation with ID ${currentAnimationId} not found`)
      return
    }
    
    if (!animation.name) {
      console.warn('Cannot create OSC path: Animation has no name. Please name your animation first.')
      return
    }
    
    // Use the animation name in the OSC path
    const pathWithArgs = formatOSCPath(oscPath, animation.name)
    setContextMenu({ x: e.clientX, y: e.clientY, path: pathWithArgs })
  }

  const copyToClipboard = async () => {
    if (!contextMenu) return
    try {
      await navigator.clipboard.writeText(contextMenu.path)
      // TODO: Show toast notification
      console.log('OSC path copied:', contextMenu.path)
    } catch (err) {
      console.error('Failed to copy OSC path:', err)
    }
    setContextMenu(null)
  }

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])
  return (
    <React.Fragment>
      <div className="flex items-center space-x-2">
      <button
        onClick={onTogglePreview}
        onContextMenu={(e) => handleContextMenu(e, OSC_INPUT_SPEC.UI.TOGGLE_PREVIEW)}
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
        onContextMenu={(e) => handleContextMenu(e, OSC_INPUT_SPEC.ANIMATION.PLAY)}
        disabled={!hasAnimation}
        className={cn(
          "px-4 py-2 rounded-l-md text-sm font-medium transition-colors flex items-center",
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
        onContextMenu={(e) => handleContextMenu(e, OSC_INPUT_SPEC.ANIMATION.STOP)}
        disabled={!hasAnimation}
        className="px-3 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Square className="w-4 h-4 mr-2" />
        Stop
      </button>

      <button
        onClick={onLoadPreset}
        onContextMenu={(e) => handleContextMenu(e, OSC_INPUT_SPEC.PRESETS.LOAD)}
        className="px-3 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-md text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center"
      >
        <Download className="w-4 h-4 mr-2" />
        Load Preset
      </button>

      <button
        onClick={onSaveAsPreset}
        onContextMenu={(e) => handleContextMenu(e, OSC_INPUT_SPEC.PRESETS.SAVE)}
        disabled={!canSavePreset}
        className="px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        <Upload className="w-4 h-4 mr-2" />
        Save as Preset
      </button>
    </div>

    {/* Context Menu for Copy OSC Path */}
    {contextMenu && (
      <div
        className="fixed bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl py-2 z-50 min-w-[200px]"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          onClick={copyToClipboard}
          className="flex items-center px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 w-full transition-colors"
        >
          <Copy className="w-4 h-4 mr-3 text-gray-600 dark:text-gray-400" />
          Copy OSC Path
        </button>
        <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="font-mono break-all">{contextMenu.path}</div>
        </div>
      </div>
    )}
  </React.Fragment>
)}
