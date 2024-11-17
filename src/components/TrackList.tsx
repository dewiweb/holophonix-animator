import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { TrackComponent } from './Track';
import { TrackGroupComponent } from './TrackGroup';
import type { Track, TrackGroup } from '../types/tracks';
import { parsePattern } from '../types/tracks';

interface TrackListProps {
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  selectedTrack,
  onSelectionChange,
}) => {
  const [groups, setGroups] = useState<TrackGroup[]>([
    {
      id: 'individual-tracks',
      name: 'Individual Tracks',
      pattern: '',
      tracks: [],
      expanded: true,
      active: false,
      behaviors: [],
      trackStates: {},
      isIndividualTracks: true
    }
  ]);
  const [nextGroupId, setNextGroupId] = useState(1);
  const [patternInput, setPatternInput] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDragOverGroupId(null);
      return;
    }

    const sourceGroupId = active.data.current?.groupId;
    const targetGroupId = over.data.current?.groupId;

    if (sourceGroupId && targetGroupId && sourceGroupId !== targetGroupId) {
      setDragOverGroupId(targetGroupId);
    } else {
      setDragOverGroupId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDragOverGroupId(null);

    if (!over) return;

    const sourceGroupId = active.data.current?.groupId;
    const targetGroupId = over.data.current?.groupId;
    const trackId = parseInt(active.id.toString());

    if (sourceGroupId && targetGroupId && sourceGroupId !== targetGroupId) {
      setGroups(prevGroups => 
        prevGroups.map(g => {
          if (g.id === sourceGroupId) {
            // Remove from source group
            return {
              ...g,
              tracks: g.tracks.filter(t => t !== trackId)
            };
          }
          if (g.id === targetGroupId) {
            // Add to target group
            const trackState = prevGroups
              .find(sg => sg.id === sourceGroupId)
              ?.trackStates[trackId.toString()] ?? false;

            return {
              ...g,
              tracks: [...g.tracks, trackId].sort((a, b) => a - b),
              trackStates: {
                ...g.trackStates,
                [trackId.toString()]: trackState
              }
            };
          }
          return g;
        })
      );
    }
  };

  const handleToggleTrackActive = (trackId: string) => {
    const trackIdNum = parseInt(trackId);
    setGroups(prevGroups => 
      prevGroups.map(g => {
        if (g.tracks.includes(trackIdNum)) {
          const currentState = g.trackStates[trackId] ?? false;
          return {
            ...g,
            trackStates: {
              ...g.trackStates,
              [trackId]: !currentState
            }
          };
        }
        return g;
      })
    );
  };

  const handleToggleGroupActive = (groupId: string) => {
    setGroups(prevGroups => 
      prevGroups.map(g => {
        if (g.id === groupId) {
          const newActive = !g.active;
          const newTrackStates = { ...g.trackStates };
          g.tracks.forEach(trackId => {
            newTrackStates[trackId.toString()] = newActive;
          });
          return {
            ...g,
            active: newActive,
            trackStates: newTrackStates
          };
        }
        return g;
      })
    );
  };

  const handleDeleteTrack = (trackId: string) => {
    const trackIdNum = parseInt(trackId);
    setGroups(prevGroups => 
      prevGroups.map(g => {
        if (g.tracks.includes(trackIdNum)) {
          const newTracks = g.tracks.filter(t => t !== trackIdNum);
          const newTrackStates = { ...g.trackStates };
          delete newTrackStates[trackId];
          return {
            ...g,
            tracks: newTracks,
            trackStates: newTrackStates
          };
        }
        return g;
      })
    );

    if (selectedTrack?.id === trackId) {
      onSelectionChange(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    if (groupId === 'individual-tracks') {
      // Clear all tracks from individual tracks group
      setGroups(prevGroups => 
        prevGroups.map(g => 
          g.id === 'individual-tracks' 
            ? { ...g, tracks: [], trackStates: {} }
            : g
        )
      );
      if (selectedTrack) {
        onSelectionChange(null);
      }
      return;
    }
    
    setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
  };

  const handlePatternSubmit = () => {
    const pattern = parsePattern(patternInput);
    if (!pattern) return;

    const isTrackExists = (trackId: number) => 
      groups.some(g => g.tracks.includes(trackId));

    const duplicateTracks = pattern.tracks.filter(trackId => isTrackExists(trackId));
    if (duplicateTracks.length > 0) {
      setErrorMessage(`Cannot add duplicate tracks: ${duplicateTracks.join(', ')}`);
      return;
    }

    if (pattern.tracks.length === 1 && !patternInput.includes('[') && !patternInput.includes('{')) {
      // Add to individual tracks group
      setGroups(prevGroups => 
        prevGroups.map(g => {
          if (g.isIndividualTracks) {
            return {
              ...g,
              tracks: [...g.tracks, pattern.tracks[0]].sort((a, b) => a - b),
              trackStates: {
                ...g.trackStates,
                [pattern.tracks[0].toString()]: false
              }
            };
          }
          return g;
        })
      );
    } else {
      // Create new group
      const groupId = `group-${nextGroupId}`;
      const newGroup: TrackGroup = {
        id: groupId,
        name: `Group ${nextGroupId}`,
        pattern: patternInput,
        tracks: [...pattern.tracks].sort((a, b) => a - b),
        expanded: true,
        active: false,
        behaviors: [],
        trackStates: Object.fromEntries(pattern.tracks.map(t => [t.toString(), false]))
      };
      setGroups(prevGroups => [...prevGroups, newGroup]);
      setNextGroupId(nextGroupId + 1);
    }

    setPatternInput('');
    setErrorMessage('');
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, name: newName } : g
    ));
  };

  const handleToggleExpand = (groupId: string) => {
    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, expanded: !g.expanded } : g
    ));
  };

  const handleSelectGroup = (groupId: string | null) => {
    setSelectedGroupId(groupId);
    if (selectedTrack) {
      onSelectionChange(null);
    }
  };

  const handleBackgroundClick = () => {
    if (selectedTrack) {
      onSelectionChange(null);
      setSelectedGroupId(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="track-list-container">
        <div className="track-list-header">
          <input
            type="text"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handlePatternSubmit();
              }
            }}
            placeholder="Enter track number or pattern (e.g., 1, [1-4], {1,3,5})"
            className="pattern-input"
          />
          <button onClick={handlePatternSubmit} className="add-button">
            Add
          </button>
        </div>

        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}

        <div 
          className="track-list-content"
          onClick={handleBackgroundClick}
        >
          <div className="track-sections">
            {groups.map(group => (
              <TrackGroupComponent
                key={group.id}
                group={group}
                selectedTrack={selectedTrack}
                onSelectionChange={onSelectionChange}
                onToggleActive={handleToggleTrackActive}
                onDeleteGroup={handleDeleteGroup}
                onDeleteTrack={handleDeleteTrack}
                onSelectGroup={handleSelectGroup}
                onToggleExpand={handleToggleExpand}
                onUpdateGroupName={handleUpdateGroupName}
                onToggleGroupActive={handleToggleGroupActive}
                isSelected={group.id === selectedGroupId}
                isDropTarget={dragOverGroupId === group.id}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
};
