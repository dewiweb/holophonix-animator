import React from 'react'
import { Track } from '@/types'

interface SelectedTracksIndicatorProps {
  selectedTracks: Track[]
  onReorder?: (reorderedTrackIds: string[]) => void // TODO: Implement drag-and-drop reordering
}

export const SelectedTracksIndicator: React.FC<SelectedTracksIndicatorProps> = ({ 
  selectedTracks,
  onReorder
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

  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-blue-900">
            {selectedTracks.length === 1 ? '1 Track Selected' : `${selectedTracks.length} Tracks Selected`}
          </span>
          <span className="text-xs text-blue-600">
            Animation will be applied to: 
          </span>
          {selectedTracks.length > 1 && onReorder && (
            <span className="text-xs text-blue-500 italic">
              (drag to reorder for phase-offset)
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedTracks.map((track, index) => (
          <span 
            key={track.id} 
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium transition-all hover:bg-blue-200"
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, track.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, track.id)}
            style={{ cursor: onReorder ? 'grab' : 'default' }}
          >
            {onReorder && <span className="text-blue-400">⋮⋮</span>}
            
            {/* Show order number for multi-track phase-offset clarity */}
            {selectedTracks.length > 1 && (
              <span className="text-blue-500 font-bold">{index + 1}.</span>
            )}
            
            {track.name}
            {track.holophonixIndex && (
              <span className="font-mono">#{track.holophonixIndex}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
