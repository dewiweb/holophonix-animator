import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils'
import { Timeline as TimelineType, TimelineEvent, Track } from '@/types'
import {
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  SkipBack,
  SkipForward,
  Plus,
  Flag,
  Clock,
  Target,
  Volume2,
  Settings
} from 'lucide-react'

export const Timeline: React.FC = () => {
  const { currentProject, tracks, timelines, updateTrack } = useProjectStore()
  const { isPlaying, globalTime, playAnimation, pauseAnimation, stopAnimation, seekTo } = useAnimationStore()
  const { ui: uiSettings } = useSettingsStore()

  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null)
  const [timelineZoom, setTimelineZoom] = useState(uiSettings.timelineZoom)
  const [showMarkers, setShowMarkers] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Get current timeline or create default
  const currentTimeline = timelines.find(t => t.id === selectedTimelineId) ||
    (timelines.length > 0 ? timelines[0] : null)

  // Filter tracks that have animations
  const animatedTracks = tracks.filter(track =>
    track.animationState?.animation && track.animationState.isPlaying
  )

  // Timeline constants
  const PIXELS_PER_SECOND = 100 * timelineZoom
  const TRACK_HEIGHT = 60
  const MARKER_HEIGHT = 20

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = x / PIXELS_PER_SECOND

    // Seek to clicked time
    seekTo(Math.max(0, Math.min(time, currentTimeline?.duration || 60)))
  }

  const handleZoomIn = () => {
    setTimelineZoom(prev => Math.min(prev * 1.5, 3))
  }

  const handleZoomOut = () => {
    setTimelineZoom(prev => Math.max(prev / 1.5, 0.5))
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAnimation()
    } else {
      // Start playback from current time - play all active animations
      animatedTracks.forEach(track => {
        if (track.animationState?.animation) {
          playAnimation(track.animationState.animation.id, [track.id])
        }
      })
    }
  }

  const handleStop = () => {
    stopAnimation()
    seekTo(0)
  }

  const handleAddMarker = (time: number) => {
    if (!currentTimeline) return

    const newMarker: TimelineEvent = {
      id: `marker-${Date.now()}`,
      time,
      type: 'marker',
      data: { label: `Marker at ${time.toFixed(1)}s` }
    }

    // Add marker to timeline (would need to implement timeline updates in store)
    console.log('Adding marker at time:', time, newMarker)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const renderTimelineRuler = () => {
    if (!currentTimeline) return null

    const duration = currentTimeline.duration
    const markers = []

    // Generate time markers
    for (let i = 0; i <= duration; i += 1) {
      const x = i * PIXELS_PER_SECOND
      markers.push(
        <div
          key={i}
          className="absolute top-0 h-6 border-l border-gray-300 flex items-end justify-center text-xs text-gray-500"
          style={{ left: `${x}px`, width: '1px' }}
        >
          <span className="ml-1 pb-1">{i}s</span>
        </div>
      )
    }

    return (
      <div className="relative h-6 bg-gray-50 border-b border-gray-200 overflow-hidden">
        {markers}
      </div>
    )
  }

  const renderTrackLane = (track: Track, index: number) => {
    const animation = track.animationState?.animation
    const isTrackPlaying = track.animationState?.isPlaying || false
    const currentTime = track.animationState?.currentTime || 0

    if (!animation) {
      return (
        <div
          key={track.id}
          className="relative bg-gray-50 border-b border-gray-200"
          style={{ height: `${TRACK_HEIGHT}px` }}
        >
          <div className="flex items-center h-full px-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{track.name}</span>
              <span className="text-xs text-gray-400">(No animation)</span>
            </div>
          </div>
        </div>
      )
    }

    // Calculate animation bar width and position
    const animationStart = 0
    const animationEnd = animation.duration
    const barWidth = animationEnd * PIXELS_PER_SECOND
    const currentPosition = currentTime * PIXELS_PER_SECOND

    return (
      <div
        key={track.id}
        className="relative bg-white border-b border-gray-200 hover:bg-gray-50"
        style={{ height: `${TRACK_HEIGHT}px` }}
      >
        {/* Animation bar background */}
        <div className="absolute inset-0">
          <div
            className={cn(
              "h-full transition-all duration-100",
              isTrackPlaying ? "bg-blue-200" : "bg-gray-100"
            )}
            style={{
              left: `${animationStart * PIXELS_PER_SECOND}px`,
              width: `${barWidth}px`
            }}
          />

          {/* Current time indicator */}
          {isTrackPlaying && (
            <div
              className="absolute top-0 w-0.5 h-full bg-blue-600 z-10"
              style={{ left: `${currentPosition}px` }}
            />
          )}

          {/* Animation keyframes */}
          {animation.keyframes?.map((keyframe, kfIndex) => (
            <div
              key={keyframe.id}
              className="absolute top-1/2 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white shadow-sm transform -translate-y-1/2 -translate-x-1/2 z-20"
              style={{
                left: `${keyframe.time * PIXELS_PER_SECOND}px`
              }}
              title={`Keyframe ${kfIndex + 1} at ${keyframe.time}s`}
            />
          ))}
        </div>

        {/* Track info */}
        <div className="absolute inset-0 flex items-center px-4 pointer-events-none">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isTrackPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <Volume2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{track.name}</span>
            <span className="text-xs text-gray-500">
              {animation.name} ({animation.type})
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(currentTime)} / {formatTime(animation.duration)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderTimelineMarkers = () => {
    if (!currentTimeline || !showMarkers) return null

    return (
      <div className="absolute top-0 left-0 w-full pointer-events-none z-30">
        {currentTimeline.events
          .filter(event => event.type === 'marker')
          .map((marker) => (
            <div
              key={marker.id}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${marker.time * PIXELS_PER_SECOND}px` }}
            >
              <Flag className="w-4 h-4 text-orange-500 mb-1" />
              <span className="text-xs text-orange-600 bg-orange-50 px-1 rounded">
                {marker.data?.label || `Marker ${marker.time}s`}
              </span>
            </div>
          ))
        }
      </div>
    )
  }

  const renderPlaybackControls = () => (
    <div className="flex items-center space-x-2 mb-4">
      <button
        onClick={handleStop}
        className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        title="Stop"
      >
        <Square className="w-4 h-4" />
      </button>

      <button
        onClick={handlePlayPause}
        className={cn(
          "p-2 rounded-md transition-colors",
          isPlaying ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
        )}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex items-center space-x-1">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-sm text-gray-600 px-2">
          {timelineZoom.toFixed(1)}x
        </span>

        <button
          onClick={handleZoomIn}
          className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="ml-4 text-sm text-gray-600">
        Current Time: {formatTime(globalTime)}
      </div>

      <div className="ml-auto flex items-center space-x-2">
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className={cn(
            "p-2 rounded-md transition-colors",
            showMarkers ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          )}
          title="Toggle Markers"
        >
          <Flag className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAddMarker(globalTime)}
          className="p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          title="Add Marker at Current Time"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Timeline</h1>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Loaded</h3>
            <p className="text-gray-600">Create or load a project to use the timeline editor</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>

        <div className="flex items-center space-x-2">
          <select
            value={selectedTimelineId || ''}
            onChange={(e) => setSelectedTimelineId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select Timeline</option>
            {timelines.map((timeline) => (
              <option key={timeline.id} value={timeline.id}>
                {timeline.name}
              </option>
            ))}
          </select>

          <button className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Timeline
          </button>
        </div>
      </div>

      {/* Playback Controls */}
      {renderPlaybackControls()}

      {/* Timeline */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative">
          {/* Timeline Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentTimeline?.name || 'Timeline'}
                </h2>
                <p className="text-sm text-gray-600">
                  Duration: {currentTimeline?.duration || 0}s | Tracks: {animatedTracks.length}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Zoom: {(timelineZoom * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">
                  Active Tracks: {animatedTracks.length}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Content */}
          <div
            ref={timelineRef}
            className="relative cursor-pointer select-none"
            style={{ height: `${animatedTracks.length * TRACK_HEIGHT + 60}px` }}
            onClick={handleTimelineClick}
          >
            {/* Timeline Ruler */}
            {renderTimelineRuler()}

            {/* Track Lanes */}
            <div className="relative">
              {animatedTracks.map((track, index) => renderTrackLane(track, index))}
            </div>

            {/* Timeline Markers */}
            {renderTimelineMarkers()}

            {/* Current time cursor */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 z-40 pointer-events-none"
              style={{ left: `${globalTime * PIXELS_PER_SECOND}px` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Info Panel */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-blue-600">{formatTime(globalTime)}</div>
          <div className="text-xs text-gray-600">Current Time</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-green-600">{animatedTracks.length}</div>
          <div className="text-xs text-gray-600">Active Tracks</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-purple-600">{currentTimeline?.events.length || 0}</div>
          <div className="text-xs text-gray-600">Timeline Events</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg font-bold text-orange-600">{timelineZoom.toFixed(1)}x</div>
          <div className="text-xs text-gray-600">Zoom Level</div>
        </div>
      </div>
    </div>
  )
}
