import React from 'react';
import type { TrackGroup, Track } from '../types/tracks';
import { Menu } from 'react-feather';
import type { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { TrackComponent } from './Track';

interface TrackGroupProps {
  group: TrackGroup;
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
  onToggleExpand: (groupId: string) => void;
  onToggleActive: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps;
}

export const TrackGroupComponent: React.FC<TrackGroupProps> = ({
  group,
  selectedTrack,
  onSelectionChange,
  onToggleExpand,
  onToggleActive,
  onDeleteGroup,
  dragHandleProps,
}) => {
  const handleTrackToggle = (trackId: string) => {
    // For now, toggle all tracks in group together
    onToggleActive(group.id);
  };

  const handleTrackDelete = (trackId: string) => {
    // For now, prevent deleting individual tracks from group
    // Could be implemented later if needed
  };

  return (
    <div className={`track-group ${group.active ? 'active' : ''}`}>
      <div className="track-group-header">
        <div className="track-handle" {...dragHandleProps}>
          ⋮⋮
        </div>
        <span className="group-pattern">{group.pattern}</span>
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteGroup(group.id);
          }}
        >
          ×
        </button>
      </div>
      
      <div className="track-group-content">
        {group.tracks.map((trackId) => {
          const track: Track = {
            id: trackId.toString(),
            name: `Track ${trackId}`,
            position: { x: 0, y: 0, z: 0 },
            aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
            behaviors: [],
            active: group.active
          };
          
          return (
            <TrackComponent
              key={track.id}
              track={track}
              isSelected={selectedTrack?.id === track.id}
              onSelect={onSelectionChange}
              onToggleActive={handleTrackToggle}
              onDelete={handleTrackDelete}
            />
          );
        })}
      </div>
    </div>
  );
};
