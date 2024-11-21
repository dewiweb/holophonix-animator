import React from 'react';
import type { Track } from '../types/tracks';
import { useDraggable } from '@dnd-kit/core';

// Predefined colors for tracks (cool colors)
const trackColors = [
  '#2196f3', // Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#03a9f4', // Light Blue
  '#00acc1', // Dark Cyan
  '#26a69a', // Light Teal
  '#66bb6a', // Light Green
  '#29b6f6', // Bright Blue
  '#00e5ff', // Bright Cyan
];

const getTrackColor = (trackId: string): string => {
  const matches = trackId.match(/\d+/);
  if (!matches) return trackColors[0];
  
  const trackNumber = parseInt(matches[0], 10);
  return trackColors[Math.abs(trackNumber) % trackColors.length];
};

interface TrackProps {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
  onToggleActive: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  groupId: string;
}

export const TrackComponent: React.FC<TrackProps> = ({
  track,
  isSelected,
  onSelect,
  onToggleActive,
  onDelete,
  groupId
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: track.id,
    data: {
      groupId,
      track,
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1,
  } : undefined;

  const trackColor = track.active ? '#4caf50' : getTrackColor(track.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`track ${isSelected ? 'selected' : ''} ${track.active ? 'active' : ''}`}
      onClick={() => onSelect(track)}
      {...attributes}
      {...listeners}
    >
      <div className="track-info">
        <button
          className={`track-button ${track.active ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleActive(track.id);
          }}
          title={track.active ? 'Deactivate track' : 'Activate track'}
        >
          ●
        </button>
        <span 
          className="track-name"
          style={{ color: trackColor }}
        >
          {track.name}
        </span>
      </div>
      <div className="track-controls">
        <button
          className="track-button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(track.id);
          }}
          title="Delete track"
        >
          ×
        </button>
      </div>
    </div>
  );
};
