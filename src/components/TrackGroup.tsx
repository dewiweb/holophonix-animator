import React, { useState, useRef, useEffect } from 'react';
import type { Track, TrackGroup } from '../types/tracks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrackComponent } from './Track';

// Predefined colors for groups (cool colors)
const groupColors = [
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

const getGroupColor = (groupId: string): string => {
  // Extract the numeric part from the group ID
  const matches = groupId.match(/\d+/);
  if (!matches) return groupColors[0];
  
  const groupNumber = parseInt(matches[0], 10);
  return groupColors[Math.abs(groupNumber) % groupColors.length];
};

interface TrackGroupProps {
  group: TrackGroup;
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
  onToggleActive: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroupName: (groupId: string, name: string) => void;
  onUpdateGroup: (groupId: string, updatedGroup: TrackGroup) => void;
  onSelectGroup: (groupId: string) => void;
  onToggleExpand: (groupId: string) => void;
  isSelected: boolean;
  isDropTarget?: boolean;
}

export const TrackGroupComponent: React.FC<TrackGroupProps> = ({
  group,
  selectedTrack,
  onSelectionChange,
  onToggleActive,
  onDeleteGroup,
  onUpdateGroupName,
  onUpdateGroup,
  onSelectGroup,
  onToggleExpand,
  isSelected,
  isDropTarget,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name || '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [trackStates, setTrackStates] = useState<{ [key: string]: boolean }>(() => {
    const states: { [key: string]: boolean } = {};
    group.tracks.forEach(trackId => {
      states[trackId.toString()] = group.active;
    });
    return states;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const defaultName = `Group ${group.id}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: group.id,
    data: {
      type: 'group',
      group,
    },
  });

  const groupColor = getGroupColor(group.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderColor: isSelected ? '#007bff' : group.active ? '#44ff44' : groupColor,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    if (editedName.trim()) {
      onUpdateGroupName(group.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editedName.trim()) {
        onUpdateGroupName(group.id, editedName.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditedName(group.name || defaultName);
      setIsEditing(false);
    }
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    onSelectGroup(group.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteGroup(group.id);
  };

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleTrackDelete = (trackId: string) => {
    const trackIdNum = parseInt(trackId);
    const updatedTracks = group.tracks.filter(t => t !== trackIdNum).sort((a, b) => a - b);
    
    if (updatedTracks.length === 0) {
      onDeleteGroup(group.id);
    } else {
      const newTrackStates = { ...trackStates };
      delete newTrackStates[trackId];
      setTrackStates(newTrackStates);

      onUpdateGroup(group.id, {
        ...group,
        tracks: updatedTracks,
        pattern: `{${updatedTracks.join(',')}}`
      });
    }
  };

  const handleTrackToggle = (trackId: string) => {
    setTrackStates(prev => ({

      ...prev,
      [trackId]: !prev[trackId]
    }));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`track-group ${group.active ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={handleHeaderClick}
      {...attributes}
    >
      <div 
        className="track-group-header"
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
        <button
          type="button"
          className="expand-button"
          onClick={handleToggleExpand}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
        <button
          type="button"
          className={`active-toggle ${group.active ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(group.id);
            const newState = !group.active;
            const newTrackStates: { [key: string]: boolean } = {};
            group.tracks.forEach(trackId => {
              newTrackStates[trackId.toString()] = newState;
            });
            setTrackStates(newTrackStates);
          }}
        >
          ●
        </button>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="group-name-input"
            value={editedName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div 
            className="group-name"
            onClick={(e) => {
              e.stopPropagation();
              handleNameClick();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleNameDoubleClick(e);
            }}
          >
            {group.name || defaultName}
          </div>
        )}
        <button
          type="button"
          className="delete-button"
          onClick={handleDelete}
        >
          ×
        </button>
      </div>
      
      {isExpanded && (
        <div className="track-group-content">
          {group.tracks.map((trackId) => {
            const track: Track = {
              id: trackId.toString(),
              name: `Track ${trackId}`,
              position: { x: 0, y: 0, z: 0 },
              aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
              behaviors: [],
              active: trackStates[trackId.toString()] ?? group.active
            };
            
            return (
              <TrackComponent
                key={track.id}
                track={track}
                isSelected={selectedTrack?.id === track.id}
                onSelect={onSelectionChange}
                onToggleActive={handleTrackToggle}
                onDelete={handleTrackDelete}
                groupId={group.id}
                groupColor={groupColor}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
