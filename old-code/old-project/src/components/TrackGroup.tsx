import React, { useState, useRef, useEffect } from 'react';
import type { Track, TrackGroup } from '../types/tracks';
import { useDroppable } from '@dnd-kit/core';
import { TrackComponent } from './Track';
import { createXYZPosition, createAEDPosition } from '../types/position';

interface TrackGroupProps {
  group: TrackGroup;
  selectedTrack: Track | null;
  onSelectionChange: (track: Track) => void;
  onToggleActive: (trackId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onSelectGroup: (groupId: string | null) => void;
  onToggleExpand: (groupId: string) => void;
  onUpdateGroupName: (groupId: string, name: string) => void;
  onToggleGroupActive: (groupId: string) => void;
  isSelected: boolean;
  isDropTarget: boolean;
}

export const TrackGroupComponent: React.FC<TrackGroupProps> = ({
  group,
  selectedTrack,
  onSelectionChange,
  onToggleActive,
  onDeleteGroup,
  onDeleteTrack,
  onSelectGroup,
  onToggleExpand,
  onUpdateGroupName,
  onToggleGroupActive,
  isSelected,
  isDropTarget,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name || '');
  const [isExpanded, setIsExpanded] = useState(group.expanded);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef } = useDroppable({
    id: group.id,
    data: {
      groupId: group.id,
      isGroup: true,
    },
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleHeaderClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onSelectGroup(group.id);
  };

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
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditedName(group.name || '');
      setIsEditing(false);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    onToggleExpand(group.id);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleGroupActive(group.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteGroup(group.id);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`track-group ${isDropTarget ? 'drop-target' : ''}`}
    >
      <div className="track-group-content">
        <div 
          className={`track-group-header ${isSelected ? 'selected' : ''}`}
          onClick={handleHeaderClick}
        >
          <div className="group-info">
            {!group.isIndividualTracks && (
              <button
                className="group-button"
                onClick={handleToggleExpand}
                title={isExpanded ? 'Collapse group' : 'Expand group'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            {isEditing && !group.isIndividualTracks ? (
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
              <span 
                className="group-name"
                onDoubleClick={() => !group.isIndividualTracks && setIsEditing(true)}
                title={group.tracks.length > 0 ? `Tracks: ${group.tracks.join(', ')}` : 'No tracks'}
              >
                {group.name}
              </span>
            )}
          </div>

          <div className="group-controls">
            <button
              className={`group-button ${group.active ? 'active' : ''}`}
              onClick={handleToggleActive}
              title={group.active ? 'Deactivate group' : 'Activate group'}
            >
              ●
            </button>
            {!group.isIndividualTracks ? (
              <button
                className="group-button"
                onClick={handleDelete}
                title="Delete group"
              >
                ×
              </button>
            ) : (
              <button
                className="group-button"
                onClick={handleDelete}
                title="Clear all individual tracks"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {(isExpanded || group.isIndividualTracks) && (
          <div className="track-list">
            {group.tracks.map((trackId) => {
              const track: Track = {
                id: trackId.toString(),
                name: `Track ${trackId}`,
                position: createXYZPosition(0, 0, 0),
                aedPosition: createAEDPosition(0, 0, 1),
                behaviors: [],
                active: group.trackStates[trackId] || false
              };
              return (
                <TrackComponent
                  key={trackId}
                  track={track}
                  groupId={group.id}
                  isSelected={selectedTrack?.id === trackId.toString()}
                  onSelect={onSelectionChange}
                  onToggleActive={onToggleActive}
                  onDelete={onDeleteTrack}
                />
              );
            })}
            {group.tracks.length === 0 && !group.isIndividualTracks && (
              <div className="empty-group">Drop tracks here</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
