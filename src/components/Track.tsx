import React from 'react';
import type { Track } from '../types/tracks';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';

interface TrackComponentProps {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
  onToggleActive: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

export const TrackComponent: React.FC<TrackComponentProps> = ({
  track,
  isSelected,
  onSelect,
  onToggleActive,
  onDelete,
  dragHandleProps
}) => {
  return (
    <div 
      className={`track ${isSelected ? 'selected' : ''} ${track.active ? 'active' : ''}`}
      onClick={() => onSelect(track)}
    >
      <div className="track-handle" {...dragHandleProps}>
        ⋮⋮
      </div>
      <div className="track-content">
        <button
          className={`active-toggle ${track.active ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(track.id);
          }}
        >
          ●
        </button>
        <span className="track-name">Track {track.id}</span>
      </div>
      <button
        className="delete-button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(track.id);
        }}
      >
        ×
      </button>
    </div>
  );
};
