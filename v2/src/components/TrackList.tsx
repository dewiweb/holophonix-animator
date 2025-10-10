import React, { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useOSCStore } from '@/stores/oscStore'
import { cn } from '@/utils'
import { Track } from '@/types'
import { Play, Pause, Square, Volume2, VolumeX, Plus, Trash2, Download, Loader2, RefreshCw, CheckSquare, Square as CheckboxSquare } from 'lucide-react'

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

  const { playAnimation, pauseAnimation, isPlaying: isGlobalPlaying } = useAnimationStore()
  const { discoverTracks, isDiscoveringTracks, discoveredTracks, getActiveConnection, refreshTrackPosition } = useOSCStore()

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

  const handleMuteTrack = (track: Track) => {
    updateTrack(track.id, { isMuted: !track.isMuted })
  }

  const handleSoloTrack = (track: Track) => {
    updateTrack(track.id, { isSolo: !track.isSolo })
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

    // After discovery, import the discovered tracks
    if (discoveredTracks.length > 0) {
      console.log(`✅ Found ${discoveredTracks.length} tracks, importing...`)
      discoveredTracks.forEach(discoveredTrack => {
        // Check if track already exists
        const existingTrack = tracks.find(t => t.holophonixIndex === discoveredTrack.index)
        if (!existingTrack) {
          addTrack({
            name: discoveredTrack.name,
            type: 'sound-source',
            holophonixIndex: discoveredTrack.index,
            position: discoveredTrack.position || { x: 0, y: 0, z: 0 },
            animationState: null,
            isMuted: false,
            isSolo: false,
            isSelected: false,
            volume: 1.0,
          })
        }
      })
      console.log(`✅ Imported ${discoveredTracks.length} tracks from Holophonix`)
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
          "flex items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors",
          isSelected && "bg-blue-50 border-blue-200"
        )}
      >
        {/* Selection Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            selectTrack(track.id, true)
          }}
          className="mr-3 flex-shrink-0 hover:bg-gray-200 rounded p-1 transition-colors"
          title="Select track (hold Ctrl to select multiple)"
        >
          {isSelected ? (
            <CheckSquare size={18} className="text-blue-600" />
          ) : (
            <CheckboxSquare size={18} className="text-gray-400" />
          )}
        </button>

        {/* Track type indicator */}
        <div
          className={cn(
            "w-3 h-3 rounded-full mr-3 flex-shrink-0 cursor-pointer",
            track.type === 'sound-source' && "bg-green-500",
            track.type === 'group' && "bg-blue-500",
            track.type === 'aux' && "bg-yellow-500",
            track.type === 'master' && "bg-purple-500"
          )}
          onClick={(e) => handleTrackSelect(track.id, e)}
        />

        {/* Track name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900 truncate">
              {track.name}
            </div>
            {track.holophonixIndex && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                #{track.holophonixIndex}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {track.position.x.toFixed(1)}, {track.position.y.toFixed(1)}, {track.position.z.toFixed(1)}
          </div>
        </div>

        {/* Animation indicator */}
        {hasAnimation && (
          <div className="flex items-center mr-2">
            <div className={cn(
              "w-2 h-2 rounded-full mr-1",
              track.animationState?.isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
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
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={track.animationState?.isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {track.animationState?.isPlaying ? (
                <Pause size={14} className="text-blue-600" />
              ) : (
                <Play size={14} className="text-gray-600" />
              )}
            </button>
          )}

          {/* Mute */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleMuteTrack(track)
            }}
            className={cn(
              "p-1 hover:bg-gray-200 rounded transition-colors",
              track.isMuted && "bg-red-100"
            )}
            title={track.isMuted ? 'Unmute track' : 'Mute track'}
          >
            {track.isMuted ? (
              <VolumeX size={14} className="text-red-600" />
            ) : (
              <Volume2 size={14} className="text-gray-600" />
            )}
          </button>

          {/* Solo */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSoloTrack(track)
            }}
            className={cn(
              "p-1 hover:bg-gray-200 rounded transition-colors",
              track.isSolo && "bg-yellow-100"
            )}
            title={track.isSolo ? 'Unsolo track' : 'Solo track'}
          >
            <Square size={14} className={cn(
              track.isSolo ? "text-yellow-600" : "text-gray-600"
            )} />
          </button>

          {/* Refresh Position */}
          {track.holophonixIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRefreshPosition(track)
              }}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Refresh position from Holophonix"
            >
              <RefreshCw size={14} className="text-blue-600" />
            </button>
          )}

          {/* Remove */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveTrack(track.id)
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Remove track"
          >
            <Trash2 size={14} className="text-red-600" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tracks</h1>
        <div className="flex items-center space-x-2">
          {/* Import from Holophonix button */}
          <button
            onClick={handleImportFromHolophonix}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={isDiscoveringTracks || !getActiveConnection()?.isConnected}
            title="Import tracks from connected Holophonix device"
          >
            {isDiscoveringTracks ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Import from Holophonix
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual track creation */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="text-sm font-medium text-gray-700">Or create manually:</div>
        <div className="flex items-center space-x-2 flex-1">
          <input
            type="text"
            placeholder="Track name"
            value={newTrackName}
            onChange={(e) => setNewTrackName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTrack()}
          />
          <input
            type="number"
            placeholder="Index (optional)"
            value={newTrackIndex}
            onChange={(e) => setNewTrackIndex(e.target.value)}
            min="1"
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTrack()}
            title="Holophonix track index (1-based). Leave empty for auto-assignment."
          />
          <button
            onClick={handleCreateTrack}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={!newTrackName.trim()}
          >
            <Plus size={16} className="mr-2" />
            Add Track
          </button>
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Sound Sources ({tracks.length})
            </h2>
            <div className="text-sm text-gray-500">
              {selectedTracks.length > 0 && `${selectedTracks.length} selected`}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96">
          {tracks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Volume2 size={48} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tracks yet
              </h3>
              <p className="text-gray-600">
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
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{tracks.length}</div>
          <div className="text-sm text-gray-600">Total Tracks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {tracks.filter(t => t.animationState?.animation).length}
          </div>
          <div className="text-sm text-gray-600">Animated</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {tracks.filter(t => t.isMuted).length}
          </div>
          <div className="text-sm text-gray-600">Muted</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {tracks.filter(t => t.isSolo).length}
          </div>
          <div className="text-sm text-gray-600">Solo</div>
        </div>
      </div>
    </div>
  )
}
