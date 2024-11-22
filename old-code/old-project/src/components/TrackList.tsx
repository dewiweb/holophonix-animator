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
import { OSCQueryType, TrackControlMessage } from '../types/osc';
import '../types/electron'; // Import electron types

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

  const queryTrackState = async (trackId: number) => {
    try {
      // Query all relevant track states
      const queryTypes: OSCQueryType[] = ['xyz', 'aed', 'color', 'gain/value', 'mute'];
      const responses = await window.electron.ipcRenderer.invoke('osc:query:states', trackId, queryTypes);

      // Update track states in groups
      setGroups(prevGroups => 
        prevGroups.map(group => {
          if (group.tracks.includes(trackId)) {
            const trackStates = { ...group.trackStates };
            trackStates[trackId.toString()] = Array.isArray(responses) && responses.some((r: TrackControlMessage | null) => r !== null);
            return {
              ...group,
              trackStates
            };
          }
          return group;
        })
      );
    } catch (error) {
      console.error(`Error querying state for track ${trackId}:`, error);
      setErrorMessage(`Failed to query initial state for track ${trackId}`);
    }
  };

  const isTrackInAnyGroup = (trackId: number): boolean => {
    return groups.some(group => group.tracks.includes(trackId));
  };

  const addTrack = async (trackId: number, groupId: string) => {
    // Check if track already exists in any group
    if (isTrackInAnyGroup(trackId)) {
      setErrorMessage(`Track ${trackId} is already in use`);
      return;
    }

    setGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            tracks: [...group.tracks, trackId]
          };
        }
        return group;
      })
    );

    // Query initial state after adding track
    await queryTrackState(trackId);
  };

  const handlePatternSubmit = async () => {
    try {
      const pattern = patternInput.trim();
      if (!pattern) {
        setErrorMessage('Please enter a track number or pattern (e.g., 1, [1-4], {1,3,5})');
        return;
      }

      const parsedTracks = parsePattern(pattern);
      if (!parsedTracks || !parsedTracks.tracks || parsedTracks.tracks.length === 0) {
        setErrorMessage('Invalid track pattern');
        return;
      }

      // Check if any of the tracks are already in use
      const duplicateTracks = parsedTracks.tracks.filter(isTrackInAnyGroup);
      if (duplicateTracks.length > 0) {
        setErrorMessage(`Tracks ${duplicateTracks.join(', ')} are already in use`);
        return;
      }

      // Check if it's a single track or a pattern
      const isSingleTrack = /^\d+$/.test(pattern);

      if (isSingleTrack) {
        // Add to individual tracks group
        for (const trackId of parsedTracks.tracks) {
          await addTrack(trackId, 'individual-tracks');
        }
      } else {
        // Create a new group for pattern-based tracks
        const groupId = `group-${nextGroupId}`;
        setNextGroupId(prevId => prevId + 1);

        setGroups(prevGroups => [
          ...prevGroups,
          {
            id: groupId,
            name: `Group ${nextGroupId}`,
            pattern: pattern,
            tracks: [],
            expanded: true,
            active: false,
            behaviors: [],
            trackStates: {},
          }
        ]);

        // Add tracks to the new group
        for (const trackId of parsedTracks.tracks) {
          await addTrack(trackId, groupId);
        }
      }

      setPatternInput('');
      setErrorMessage(null);
    } catch (error) {
      console.error('Error adding tracks:', error);
      setErrorMessage('Failed to add tracks');
    }
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
