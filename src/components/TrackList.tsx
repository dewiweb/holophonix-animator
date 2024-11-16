import React, { useState } from 'react';
import type { Track, TrackGroup } from '../types/tracks';
import { TrackComponent } from './Track';
import { TrackGroupComponent } from './TrackGroup';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { isValidPattern, parsePattern } from '../types/tracks';
import type { UniqueIdentifier } from '@dnd-kit/core';

interface TrackListProps {
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ selectedTrack, onSelectionChange }) => {
  const [individualTracks, setIndividualTracks] = useState<Track[]>([]);
  const [groups, setGroups] = useState<TrackGroup[]>([]);
  const [patternInput, setPatternInput] = useState('');
  const [nextGroupId, setNextGroupId] = useState(1);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id.toString();
    const activeId = active.id.toString();
    const activeData = active.data.current as { type: string; groupId?: string } | undefined;

    // Set drag over zone
    if (overId === 'individual-tracks' || overId.startsWith('group-')) {
      setDragOverZoneId(overId);
    } else {
      // If dragging over a track, find its container
      const trackGroup = groups.find(g => g.tracks.includes(parseInt(overId)));
      if (trackGroup) {
        setDragOverZoneId(trackGroup.id);
      } else {
        setDragOverZoneId('individual-tracks');
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverZoneId(null);
    
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeData = active.data.current as { type: string; groupId?: string } | undefined;
    const sourceGroupId = activeData?.groupId;

    // Find target container
    let targetContainerId = overId;
    if (!overId.startsWith('group-') && overId !== 'individual-tracks') {
      const trackGroup = groups.find(g => g.tracks.includes(parseInt(overId)));
      targetContainerId = trackGroup ? trackGroup.id : 'individual-tracks';
    }

    if (sourceGroupId) {
      // Moving from a group
      const sourceGroup = groups.find(g => g.id === sourceGroupId);
      if (!sourceGroup) return;

      const trackId = parseInt(activeId);

      if (targetContainerId === 'individual-tracks') {
        // Moving to individual tracks
        const newTrack: Track = {
          id: activeId,
          name: `Track ${activeId}`,
          position: { x: 0, y: 0, z: 0 },
          aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
          behaviors: [],
          active: sourceGroup.active
        };
        
        setIndividualTracks([...individualTracks, newTrack]);
        
        // Remove from source group and ensure tracks are sorted
        const remainingTracks = sourceGroup.tracks.filter(t => t !== trackId).sort((a, b) => a - b);
        const updatedSourceGroup = {
          ...sourceGroup,
          tracks: remainingTracks,
          pattern: `{${remainingTracks.join(',')}}`
        };
        
        if (updatedSourceGroup.tracks.length === 0) {
          setGroups(groups.filter(g => g.id !== sourceGroup.id));
        } else {
          setGroups(groups.map(g => g.id === sourceGroup.id ? updatedSourceGroup : g));
        }
      } else if (targetContainerId.startsWith('group-')) {
        // Moving to another group
        const targetGroup = groups.find(g => g.id === targetContainerId);
        if (targetGroup && targetGroup.id !== sourceGroup.id) {
          // Add to target group and ensure tracks are sorted
          const newTargetTracks = [...targetGroup.tracks, trackId].sort((a, b) => a - b);
          const updatedTargetGroup = {
            ...targetGroup,
            tracks: newTargetTracks,
            pattern: `{${newTargetTracks.join(',')}}`
          };
          
          // Remove from source group and ensure tracks are sorted
          const remainingTracks = sourceGroup.tracks.filter(t => t !== trackId).sort((a, b) => a - b);
          const updatedSourceGroup = {
            ...sourceGroup,
            tracks: remainingTracks,
            pattern: `{${remainingTracks.join(',')}}`
          };
          
          let updatedGroups = groups.map(g => {
            if (g.id === targetGroup.id) return updatedTargetGroup;
            if (g.id === sourceGroup.id) return updatedSourceGroup;
            return g;
          });
          
          if (updatedSourceGroup.tracks.length === 0) {
            updatedGroups = updatedGroups.filter(g => g.id !== sourceGroup.id);
          }
          
          setGroups(updatedGroups);
        }
      }
    } else {
      // Moving from individual tracks
      const sourceTrack = individualTracks.find(t => t.id === activeId);
      
      if (sourceTrack) {
        if (targetContainerId === 'individual-tracks') {
          // Reordering within individual tracks
          const oldIndex = individualTracks.findIndex(t => t.id === activeId);
          const newIndex = individualTracks.findIndex(t => t.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            setIndividualTracks(arrayMove(individualTracks, oldIndex, newIndex));
          }
        } else if (targetContainerId.startsWith('group-')) {
          // Moving to a group
          const targetGroup = groups.find(g => g.id === targetContainerId);
          if (targetGroup) {
            const trackId = parseInt(sourceTrack.id);
            if (!targetGroup.tracks.includes(trackId)) {
              // Add to group and ensure tracks are sorted
              const newTracks = [...targetGroup.tracks, trackId].sort((a, b) => a - b);
              const updatedGroup = {
                ...targetGroup,
                tracks: newTracks,
                pattern: `{${newTracks.join(',')}}`
              };
              setGroups(groups.map(g => g.id === targetContainerId ? updatedGroup : g));
              setIndividualTracks(individualTracks.filter(t => t.id !== activeId));
            }
          }
        }
      }
    }
  };

  const isTrackExists = (trackId: number): boolean => {
    return (
      individualTracks.some(t => t.id === trackId.toString()) ||
      groups.some(g => g.tracks.includes(trackId))
    );
  };

  const handleAdd = () => {
    if (!isValidPattern(patternInput)) {
      alert('Invalid pattern. Use a number for single track (e.g., 1) or patterns ([1-4] or {1,3,5}) for groups.');
      return;
    }

    const pattern = parsePattern(patternInput);
    if (!pattern) return;

    const duplicateTracks = pattern.values.filter(trackId => isTrackExists(trackId));
    if (duplicateTracks.length > 0) {
      alert(`Cannot add duplicate tracks: ${duplicateTracks.join(', ')}`);
      return;
    }

    if (pattern.values.length === 1 && !patternInput.includes('[') && !patternInput.includes('{')) {
      // Single track
      const newTrack: Track = {
        id: pattern.values[0].toString(),
        name: `Track ${pattern.values[0]}`,
        position: { x: 0, y: 0, z: 0 },
        aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
        behaviors: [],
        active: false
      };
      setIndividualTracks([...individualTracks, newTrack]);
    } else {
      // Group of tracks - ensure tracks are sorted
      const sortedTracks = [...pattern.values].sort((a, b) => a - b);
      const groupId = `group-${nextGroupId}`;
      const newGroup: TrackGroup = {
        id: groupId,
        name: `Group ${nextGroupId}`,
        pattern: `{${sortedTracks.join(',')}}`,
        tracks: sortedTracks,
        expanded: true,
        active: false,
        behaviors: []
      };
      setGroups([...groups, newGroup]);
      setNextGroupId(nextGroupId + 1);
    }

    setPatternInput('');
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setGroups(groups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    ));
  };

  const handleUpdateGroup = (groupId: string, updatedGroup: TrackGroup) => {
    const oldGroup = groups.find(g => g.id === groupId);
    if (oldGroup) {
      // Find tracks that were removed
      const removedTrackIds = oldGroup.tracks
        .filter(t => !updatedGroup.tracks.includes(t))
        .map(t => t.toString());
      
      // Remove those tracks from individual tracks if they exist there
      if (removedTrackIds.length > 0) {
        setIndividualTracks(individualTracks.filter(track => !removedTrackIds.includes(track.id)));
        
        // Clear selection if a removed track was selected
        if (selectedTrack && removedTrackIds.includes(selectedTrack.id)) {
          onSelectionChange(null);
        }
      }
    }
    
    // Update the group
    if (updatedGroup.tracks.length === 0) {
      // Remove empty group
      setGroups(groups.filter(g => g.id !== groupId));
      // Clear group selection if this group was selected
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    } else {
      setGroups(groups.map(g => g.id === groupId ? updatedGroup : g));
    }
  };

  const handleToggleTrackActive = (trackId: string) => {
    setIndividualTracks(individualTracks.map(track =>
      track.id === trackId ? { ...track, active: !track.active } : track
    ));
  };

  const handleDeleteTrack = (trackId: string) => {
    console.log('Deleting track:', trackId);
    // Delete from individual tracks
    setIndividualTracks(individualTracks.filter(t => t.id !== trackId));
    
    // Also check and delete from any groups
    const updatedGroups = groups.map(group => {
      const trackIdNum = parseInt(trackId);
      if (group.tracks.includes(trackIdNum)) {
        const updatedTracks = group.tracks.filter(t => t !== trackIdNum);
        if (updatedTracks.length === 0) {
          return null; // Mark group for deletion
        }
        return {
          ...group,
          tracks: updatedTracks,
          pattern: `{${updatedTracks.join(',')}}`
        };
      }
      return group;
    }).filter((group): group is TrackGroup => group !== null);
    
    setGroups(updatedGroups);
    
    // Clear selection if deleted track was selected
    if (selectedTrack?.id === trackId) {
      onSelectionChange(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    console.log('Deleting group:', groupId);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // Remove all tracks from individual tracks that belong to this group
      const trackIds = group.tracks.map(t => t.toString());
      setIndividualTracks(individualTracks.filter(track => !trackIds.includes(track.id)));
      
      // Remove the group
      setGroups(groups.filter(g => g.id !== groupId));
      
      // Clear selection if any track in the deleted group was selected
      if (selectedTrack && trackIds.includes(selectedTrack.id)) {
        onSelectionChange(null);
      }
      
      // Clear group selection if this group was selected
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
    }
  };

  const handleToggleExpand = (groupId: string) => {
    setGroups(groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          expanded: !group.expanded
        };
      }
      return group;
    }));
  };

  const handleToggleActive = (groupId: string) => {
    setGroups(groups.map(group =>
      group.id === groupId ? { ...group, active: !group.active } : group
    ));
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId === selectedGroupId ? null : groupId);
  };

  return (
    <div className="track-list">
      <div className="track-form">
        <div className="form-container">
          <input
            type="text"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="Enter track number or pattern (e.g., 1 or [1-4] or {1,3,5})"
            className="pattern-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValidPattern(patternInput)) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button 
            onClick={handleAdd} 
            className="add-button"
            disabled={!isValidPattern(patternInput)}
          >
            Add
          </button>
        </div>
      </div>

      <div className="track-list-content">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Individual Tracks Zone */}
          <div 
            className={`tracks-zone ${dragOverZoneId === 'individual-tracks' ? 'drop-target' : ''}`}
            data-zone-id="individual-tracks"
          >
            <div className="zone-header">
              <h3>Individual Tracks</h3>
            </div>
            <SortableContext
              items={individualTracks.map(track => track.id)}
              strategy={verticalListSortingStrategy}
            >
              {individualTracks.map((track) => (
                <TrackComponent
                  key={track.id}
                  track={track}
                  isSelected={selectedTrack?.id === track.id}
                  onSelect={onSelectionChange}
                  onToggleActive={handleToggleTrackActive}
                  onDelete={handleDeleteTrack}
                />
              ))}
            </SortableContext>
          </div>

          {/* Groups */}
          <div className="groups-container">
            <div className="zone-header">
              <h3>Groups</h3>
            </div>
            <SortableContext
              items={groups.map(group => group.id)}
              strategy={verticalListSortingStrategy}
            >
              {groups.map((group) => (
                <TrackGroupComponent
                  key={group.id}
                  group={group}
                  selectedTrack={selectedTrack}
                  onSelectionChange={onSelectionChange}
                  onToggleActive={handleToggleActive}
                  onDeleteGroup={handleDeleteGroup}
                  onUpdateGroupName={handleUpdateGroupName}
                  onUpdateGroup={handleUpdateGroup}
                  onSelectGroup={handleSelectGroup}
                  onToggleExpand={handleToggleExpand}
                  isSelected={group.id === selectedGroupId}
                  isDropTarget={dragOverZoneId === group.id}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId ? (
              <div style={{ opacity: 0.8 }}>
                {(() => {
                  const activeTrack = individualTracks.find(t => t.id === activeId);
                  const activeGroup = groups.find(g => g.id === activeId);

                  if (activeTrack) {
                    return (
                      <TrackComponent
                        track={activeTrack}
                        isSelected={selectedTrack?.id === activeId}
                        onSelect={onSelectionChange}
                        onToggleActive={handleToggleTrackActive}
                        onDelete={handleDeleteTrack}
                      />
                    );
                  }

                  if (activeGroup) {
                    return (
                      <TrackGroupComponent
                        group={activeGroup}
                        selectedTrack={selectedTrack}
                        onSelectionChange={onSelectionChange}
                        onToggleActive={handleToggleActive}
                        onDeleteGroup={handleDeleteGroup}
                        onUpdateGroupName={handleUpdateGroupName}
                        onUpdateGroup={handleUpdateGroup}
                        onSelectGroup={handleSelectGroup}
                        onToggleExpand={handleToggleExpand}
                        isSelected={activeId === selectedGroupId}
                        isDropTarget={false}
                      />
                    );
                  }

                  return null;
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
