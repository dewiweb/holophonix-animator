import React, { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useOSCStore } from '@/stores/oscStore'
import { cn } from '@/utils'
import { Track } from '@/types'
import { Play, Pause, Square, Volume2, VolumeX, Plus, Trash2, Download, Loader2, RefreshCw, CheckSquare, Square as CheckboxSquare, Ban } from 'lucide-react'

export const TrackList: React.FC = () => {
  const {
    tracks,
    groups,
    selectedTracks,
    selectTrack,
    updateTrack,
    addTrack,
    removeTrack,
  } = useProjectStore()

  const { playAnimation, pauseAnimation, stopAnimation, isPlaying: isGlobalPlaying } = useAnimationStore()
  const { discoverTracks, isDiscoveringTracks, discoveredTracks, getActiveConnection, refreshTrackPosition, sendMessage } = useOSCStore()

  const [newTrackName, setNewTrackName] = useState('')
  const [newTrackIndex, setNewTrackIndex] = useState('')

  const handleCreateTrack = () => {
    if (newTrackName.trim()) {
      const trackIndex = newTrackIndex.trim() ? parseInt(newTrackIndex.trim()) : undefined
      addTrack({
        name: newTrackName.trim(),
        type: 'sound-source',
        holophonixIndex: trackIndex,
        position: { x: 0, y: 0, z: 0 },
        animationState: null,
        isMuted: false,
        isSolo: false,
        isSelected: false,
        volume: 1.0,
      })
      setNewTrackName('')
      setNewTrackIndex('')
    }
  }

  const handleTrackSelect = (trackId: string, event: React.MouseEvent) => {
    const multiSelect = event.ctrlKey || event.metaKey
    selectTrack(trackId, multiSelect)
  }

  const handlePlayTrack = (track: Track) => {
    if (track.animationState?.animation) {
      // Check if this track's animation is currently playing
      const isThisTrackPlaying = isGlobalPlaying && track.animationState.isPlaying

      if (isThisTrackPlaying) {
        console.log('⏸️ Pausing track animation:', track.name)
        pauseAnimation()
      } else {
        console.log('▶️ Playing track animation:', track.name)
        playAnimation(track.animationState.animation.id, [track.id])
      }
    }
  }

  const handleStopTrack = (track: Track) => {
    if (track.animationState?.animation) {
      console.log('⏹️ Stopping track animation:', track.name)
      stopAnimation()
    }
  }

  const handleMuteTrack = (track: Track) => {
    const newMutedState = !track.isMuted
    console.log(`${newMutedState ? '🔇' : '🔊'} Track ${track.name} ${newMutedState ? 'muted' : 'unmuted'} for animations`)

    // Update local track state - animations will respect this state
    updateTrack(track.id, { isMuted: newMutedState })

    // Note: OSC audio control removed - mute/solo now control animation playback only
  }

  const handleSoloTrack = (track: Track) => {
    const newSoloState = !track.isSolo
    console.log(`${newSoloState ? '🎯' : '👥'} Track ${track.name} ${newSoloState ? 'soloed' : 'unsoloed'} for animations`)

    // Update local track state - animations will respect this state
    updateTrack(track.id, { isSolo: newSoloState })

    // Note: OSC audio control removed - mute/solo now control animation playback only
  }

  const handleRemoveTrack = (trackId: string) => {
    removeTrack(trackId)
  }

  const handleRefreshPosition = async (track: Track) => {
    const activeConnection = getActiveConnection()
    if (!activeConnection?.isConnected) {
      alert('Please connect to a Holophonix device first')
      return
    }
    
    if (!track.holophonixIndex) {
      alert('Track has no Holophonix index assigned')
      return
    }
    
    console.log('🔄 Refreshing position for track:', track.name)
    await refreshTrackPosition(track.id)
  }

  const handleImportFromHolophonix = async () => {
    const activeConnection = getActiveConnection()
    if (!activeConnection?.isConnected) {
      alert('Please connect to a Holophonix device first')
      return
    }

    console.log('🔍 Starting track import from Holophonix...')
    await discoverTracks(64) // Query up to 64 tracks

    // Tracks are created immediately as responses arrive in oscStore
    // Just show completion message
    if (discoveredTracks.length > 0) {
      console.log(`✅ Discovery completed: ${discoveredTracks.length} tracks found`)
    } else {
      console.log('ℹ️ No tracks found on Holophonix device')
    }
  }

  const renderTrack = (track: Track) => {
    const isSelected = selectedTracks.includes(track.id)
    const hasAnimation = !!track.animationState?.animation

    return (
      <div
        key={track.id}
        className={cn(
          "flex items-center p-3 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
          isSelected && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
        )}
      >
        {/* Selection Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            selectTrack(track.id, true)
          }}
          className="mr-3 flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-1 transition-colors"
          title="Select track (hold Ctrl to select multiple)"
        >
          {isSelected ? (
            <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
          ) : (
            <CheckboxSquare size={18} className="text-gray-400 dark:text-gray-500" />
          )}
        </button>

        {/* Track type indicator */}
        <div
          className={cn(
            "w-3 h-3 rounded-full mr-3 flex-shrink-0 cursor-pointer",
            // Use track color if available, otherwise fallback to type-based colors
            !track.color && track.type === 'sound-source' && "bg-green-500 dark:bg-green-400",
            !track.color && track.type === 'group' && "bg-blue-500 dark:bg-blue-400",
            !track.color && track.type === 'aux' && "bg-yellow-500 dark:bg-yellow-400",
            !track.color && track.type === 'master' && "bg-purple-500 dark:bg-purple-400"
          )}
          style={track.color ? {
            backgroundColor: `rgba(${Math.round(track.color.r * 255)}, ${Math.round(track.color.g * 255)}, ${Math.round(track.color.b * 255)}, ${track.color.a})`
          } : undefined}
          onClick={(e) => handleTrackSelect(track.id, e)}
        />

        {/* Track name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {track.name}
            </div>
            {track.holophonixIndex && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-mono">
                #{track.holophonixIndex}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {track.position.x.toFixed(1)}, {track.position.y.toFixed(1)}, {track.position.z.toFixed(1)}
          </div>
        </div>

        {/* Animation indicator */}
        {hasAnimation && (
          <div className="flex items-center mr-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full mr-1",
                track.animationState?.isPlaying ? "bg-green-500 dark:bg-green-400 animate-pulse" : "bg-gray-400 dark:bg-gray-500"
              )}
            />
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center space-x-1">
          {/* Play/Pause */}
          {hasAnimation && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePlayTrack(track)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={track.animationState?.isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {track.animationState?.isPlaying ? (
                <Pause size={14} className="text-blue-600 dark:text-blue-400" />
              ) : (
                <Play size={14} className="text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Stop */}
          {hasAnimation && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStopTrack(track)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Stop animation"
            >
              <Ban size={14} className="text-red-600 dark:text-red-400" />
            </button>
          )}

          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMuteTrack(track)
            }}
            className={cn(
              "p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors",
              track.isMuted && "bg-red-100 dark:bg-red-900/20"
            )}
            title={track.isMuted ? 'Unmute track' : 'Mute track'}
          >
            {track.isMuted ? (
              <VolumeX size={14} className="text-red-600 dark:text-red-400" />
            ) : (
              <Volume2 size={14} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Solo */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSoloTrack(track)
            }}
            className={cn(
              "p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors",
              track.isSolo && "bg-yellow-100 dark:bg-yellow-900/20"
            )}
            title={track.isSolo ? 'Unsolo track' : 'Solo track'}
          >
            <Square size={14} className={cn(
              track.isSolo ? "text-yellow-600 dark:text-yellow-400" : "text-gray-600 dark:text-gray-400"
            )} />
          </button>

          {/* Refresh Position */}
          {track.holophonixIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRefreshPosition(track)
              }}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Refresh position from Holophonix"
            >
              <RefreshCw size={14} className="text-blue-600 dark:text-blue-400" />
            </button>
          )}

          {/* Remove */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveTrack(track.id)
            }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Remove track"
          >
            <Trash2 size={14} className="text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 lg:mb-4 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Tracks</h1>
        <div className="flex items-center gap-2">
          {/* Import from Holophonix button */}
          <button
            onClick={handleImportFromHolophonix}
            className="px-3 lg:px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm lg:text-base whitespace-nowrap"
            disabled={isDiscoveringTracks || !getActiveConnection()?.isConnected}
            title="Import tracks from connected Holophonix device"
          >
            {isDiscoveringTracks ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                <span className="hidden sm:inline">Discovering...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                <span className="hidden sm:inline">Import from Holophonix</span>
                <span className="sm:hidden">Import</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual track creation */}
      <div className="mb-1.5 lg:mb-4 flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3 flex-shrink-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">Or create manually:</div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Track name"
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTrack()}
          />
          <input
            type="number"
            placeholder="Index"
            value={newTrackIndex}
            onChange={(e) => setNewTrackIndex(e.target.value)}
            min="1"
            className="w-full sm:w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTrack()}
            title="Holophonix track index (1-based). Leave empty for auto-assignment."
          />
          <button
            onClick={handleCreateTrack}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm whitespace-nowrap"
            disabled={!newTrackName.trim()}
          >
            <Plus size={16} className="mr-2" />
            Add Track
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200">
              Sound Sources ({tracks.length})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedTracks.length > 0 && `${selectedTracks.length} selected`}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {tracks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Volume2 size={48} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tracks yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first track to start animating sound sources
              </p>
            </div>
          ) : (
            <div>
              {tracks.map(renderTrack)}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-1.5 lg:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-1.5 lg:gap-3 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 p-1.5 lg:p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">{tracks.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tracks</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-1.5 lg:p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tracks.filter(t => t.animationState?.animation).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Animated</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-1.5 lg:p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
            {tracks.filter(t => t.isMuted).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Muted</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-1.5 lg:p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {tracks.filter(t => t.isSolo).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Solo</div>
        </div>
      </div>
    </div>
  )
}
