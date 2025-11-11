import React from 'react'
import { Track } from '@/types'
import { themeColors } from '@/theme'

interface SelectedTracksIndicatorProps {
  selectedTracks: Track[]
  onReorder?: (reorderedTrackIds: string[]) => void
  activeEditingTrackIds?: string[]
  onSetActiveTracks?: (trackIds: string[]) => void
  multiTrackMode?: string
}

export const SelectedTracksIndicator: React.FC<SelectedTracksIndicatorProps> = ({ 
  selectedTracks,
  onReorder,
  activeEditingTrackIds = [],
  onSetActiveTracks,
  multiTrackMode
}) => {
  if (selectedTracks.length === 0) return null

  const handleDragStart = (e: React.DragEvent, trackId: string) => {
    e.dataTransfer.setData('trackId', trackId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetTrackId: string) => {
    e.preventDefault()
    const draggedTrackId = e.dataTransfer.getData('trackId')
    if (draggedTrackId === targetTrackId) return
    
    // Reorder logic
    const newOrder = [...selectedTracks]
    const draggedIndex = newOrder.findIndex(t => t.id === draggedTrackId)
    const targetIndex = newOrder.findIndex(t => t.id === targetTrackId)
    const [removed] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, removed)
    
    onReorder?.(newOrder.map(t => t.id))
  }

  const handleTrackClick = (trackId: string, event: React.MouseEvent) => {
    if (!onSetActiveTracks || multiTrackMode !== 'relative') return
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+click: toggle track in/out of editing selection
      if (activeEditingTrackIds.includes(trackId)) {
        // Remove from selection (but keep at least one)
        if (activeEditingTrackIds.length > 1) {
          onSetActiveTracks(activeEditingTrackIds.filter(id => id !== trackId))
        }
      } else {
        // Add to selection
        onSetActiveTracks([...activeEditingTrackIds, trackId])
      }
    } else {
      // Regular click: set as sole active track
      onSetActiveTracks([trackId])
    }
  }

  return (
    <div className={`mb-4 ${themeColors.multiTrackMode.background} border ${themeColors.multiTrackMode.border} rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${themeColors.accent.primary} dark:${themeColors.accent.primary.replace('blue-500', 'blue-100')}`}>
            {selectedTracks.length === 1 ? '1 Track Selected' : `${selectedTracks.length} Tracks Selected`}
          </span>
          <span className={`text-xs ${themeColors.accent.secondary} dark:${themeColors.accent.secondary.replace('blue-600', 'blue-400')}`}>
            Animation will be applied to: 
          </span>
          {selectedTracks.length > 1 && onReorder && (
            <span className={`text-xs ${themeColors.accent.tertiary} dark:${themeColors.accent.tertiary.replace('blue-700', 'blue-300')} italic`}>
              (drag to reorder for phase-offset)
            </span>
          )}
          {activeEditingTrackIds.length > 1 && multiTrackMode === 'relative' && (
            <span className={`text-xs text-green-600 dark:text-green-400 font-semibold`}>
              ({activeEditingTrackIds.length} tracks for editing)
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedTracks.map((track, index) => {
          const isActiveEditing = activeEditingTrackIds.includes(track.id)
          const isClickable = multiTrackMode === 'relative' && onSetActiveTracks
          
          return (
            <span 
              key={track.id} 
              className={`inline-flex items-center gap-1 px-3 py-2 border rounded-md text-xs font-medium transition-all ${
                isActiveEditing 
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-400 dark:border-green-600 shadow-md ring-2 ring-green-300 dark:ring-green-700'
                  : `${themeColors.accent.background.medium} ${themeColors.accent.tertiary} dark:${themeColors.accent.tertiary.replace('blue-700', 'blue-300')} ${themeColors.border.accent}`
              } ${
                isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : (onReorder ? 'cursor-grab' : 'cursor-default')
              } hover:${themeColors.accent.background.medium.replace('blue-100/60', 'blue-200/70')} dark:hover:${themeColors.accent.background.medium.replace('blue-800/40', 'blue-800/60')}`}
              draggable={!!onReorder}
              onDragStart={(e) => handleDragStart(e, track.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, track.id)}
              onClick={(e) => isClickable && handleTrackClick(track.id, e)}
              title={isClickable ? 'Click to edit • Ctrl+Click to select multiple' : ''}
            >
            {onReorder && <span className={`${themeColors.accent.secondary} dark:${themeColors.accent.secondary.replace('blue-600', 'blue-500')}`}>⋮⋮</span>}
            
            {/* Show order number for multi-track phase-offset clarity */}
            {selectedTracks.length > 1 && (
              <span className={`${themeColors.accent.primary} dark:${themeColors.accent.primary.replace('blue-500', 'blue-400')} font-bold`}>{index + 1}.</span>
            )}
            
            {track.name}
            {track.holophonixIndex && (
              <span className="font-mono">#{track.holophonixIndex}</span>
            )}
            
            {isActiveEditing && (
              <span className="ml-1 text-green-600 dark:text-green-400 font-bold" title="Currently editing this track's control points">✏️</span>
            )}
          </span>
        )})
      }
      </div>
    </div>
  )
}
