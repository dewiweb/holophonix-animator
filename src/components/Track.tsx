import React from 'react';
import type { Track } from '../types/tracks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Predefined colors for individual tracks (warm colors)
const trackColors = [
  '#ff7043', // Deep Orange
  '#ff5252', // Red
  '#ff4081', // Pink
  '#e040fb', // Purple
  '#b388ff', // Deep Purple
  '#ff6e40', // Orange
  '#ffab40', // Light Orange
  '#ff6090', // Light Pink
  '#ea80fc', // Light Purple
  '#ff9e80', // Peach
];

const getTrackColor = (trackId: string): string => {
  const matches = trackId.match(/\d+/);
  if (!matches) return trackColors[0];
  
  const trackNumber = parseInt(matches[0], 10);
  return trackColors[Math.abs(trackNumber) % trackColors.length];
};

interface TrackComponentProps {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track | null) => void;
  onToggleActive: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  groupId?: string;
  groupColor?: string;
}

export const TrackComponent: React.FC<TrackComponentProps> = ({
  track,
  isSelected,
  onSelect,
  onToggleActive,
  onDelete,
  groupId,
  groupColor,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: track.id,
    data: {
      type: 'track',
      groupId,
      track,
    },
  });

  // Use group color if available, otherwise use individual track color
  const borderColor = groupColor || getTrackColor(track.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: isSelected ? '#007bff' : track.active ? '#44ff44' : borderColor,
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onSelect(track);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(track.id);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive(track.id);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`track ${isSelected ? 'selected' : ''} ${track.active ? 'active' : ''}`}
      onClick={handleClick}
      {...attributes}
    >
      <div className="drag-handle" {...listeners}>
        <svg width="8" height="16" viewBox="0 0 8 16">
          <circle cx="2" cy="2" r="1.5" />
          <circle cx="6" cy="2" r="1.5" />
          <circle cx="2" cy="8" r="1.5" />
          <circle cx="6" cy="8" r="1.5" />
          <circle cx="2" cy="14" r="1.5" />
          <circle cx="6" cy="14" r="1.5" />
        </svg>
      </div>
      <div className="track-content">
        <button
          type="button"
          className={`active-toggle ${track.active ? 'active' : ''}`}
          onClick={handleToggleActive}
        >
          ●
        </button>
        <span className="track-name" style={{ color: getTrackColor(track.id) }}>Track {track.id}</span>
      </div>
      <button
        type="button"
        className="delete-button"
        onClick={handleDelete}
      >
        ×
      </button>
    </div>
  );
};
