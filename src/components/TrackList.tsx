import React, { useState, memo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import type { Track } from '../types/behaviors';
import type { TrackGroup, TrackOrGroup } from '../types/tracks';
import { parsePattern, isTrackGroup, isValidPattern } from '../types/tracks';
import { TrackGroupComponent } from './TrackGroup';
import { TrackComponent } from './Track';

const DROPPABLE_ID = 'TRACKLIST';

interface TrackListProps {
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
}

const DroppableContent = memo(({ 
  provided, 
  items, 
  renderDraggableItem 
}: { 
  provided: DroppableProvided;
  items: TrackOrGroup[];
  renderDraggableItem: (item: TrackOrGroup, index: number) => React.ReactNode;
}) => (
  <div
    ref={provided.innerRef}
    {...provided.droppableProps}
    className="track-list-content"
    style={{ overflowY: 'auto' }}
  >
    {items.map((item, index) => renderDraggableItem(item, index))}
    {provided.placeholder}
  </div>
));

DroppableContent.displayName = 'DroppableContent';

const DraggableItem = memo(({ 
  item, 
  index,
  selectedTrack,
  onSelectionChange,
  onToggleExpand,
  onToggleActive,
  onDeleteGroup,
  onToggleTrackActive,
  onDeleteTrack,
}: {
  item: TrackOrGroup;
  index: number;
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
  onToggleExpand: (groupId: string) => void;
  onToggleActive: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleTrackActive: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
}) => (
  <Draggable draggableId={item.id} index={index}>
    {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
      <div
        ref={dragProvided.innerRef}
        {...dragProvided.draggableProps}
        style={{
          ...dragProvided.draggableProps.style,
          opacity: snapshot.isDragging ? 0.8 : 1,
        }}
      >
        {isTrackGroup(item) ? (
          <TrackGroupComponent
            group={item}
            selectedTrack={selectedTrack}
            onSelectionChange={onSelectionChange}
            onToggleExpand={onToggleExpand}
            onToggleActive={onToggleActive}
            onDeleteGroup={onDeleteGroup}
            dragHandleProps={dragProvided.dragHandleProps}
          />
        ) : (
          <TrackComponent
            track={item}
            isSelected={selectedTrack?.id === item.id}
            onSelect={onSelectionChange}
            onToggleActive={onToggleTrackActive}
            onDelete={onDeleteTrack}
            dragHandleProps={dragProvided.dragHandleProps}
          />
        )}
      </div>
    )}
  </Draggable>
));

DraggableItem.displayName = 'DraggableItem';

export const TrackList: React.FC<TrackListProps> = ({ selectedTrack, onSelectionChange }) => {
  const [items, setItems] = useState<TrackOrGroup[]>([]);
  const [patternInput, setPatternInput] = useState('');
  const [nextGroupId, setNextGroupId] = useState(1);

  const isTrackExists = (trackId: number): boolean => {
    // Check individual tracks
    const individualTrackExists = items.some(
      item => !isTrackGroup(item) && item.id === trackId.toString()
    );

    // Check tracks within groups
    const groupTrackExists = items.some(
      item => isTrackGroup(item) && item.tracks.includes(trackId)
    );

    return individualTrackExists || groupTrackExists;
  };

  const handleAdd = () => {
    if (!isValidPattern(patternInput)) {
      alert('Invalid pattern. Use a number for single track (e.g., 1) or patterns ([1-4] or {1,3,5}) for groups.');
      return;
    }

    const pattern = parsePattern(patternInput);
    if (!pattern) return;

    // Check for duplicate tracks
    const duplicateTracks = pattern.values.filter(trackId => isTrackExists(trackId));
    if (duplicateTracks.length > 0) {
      alert(`Cannot add duplicate tracks: ${duplicateTracks.join(', ')}`);
      return;
    }

    if (pattern.values.length === 1 && !patternInput.includes('[') && !patternInput.includes('{')) {
      // Single track
      const newTrack: Track = {
        id: `${pattern.values[0]}`,
        name: `Track ${pattern.values[0]}`,
        position: { x: 0, y: 0, z: 0 },
        aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
        behaviors: [],
        active: true
      };
      setItems([...items, newTrack]);
    } else {
      // Group of tracks
      const newGroup: TrackGroup = {
        id: `group-${nextGroupId}`,
        pattern: patternInput,
        tracks: pattern.values,
        expanded: true,
        active: true,
        behaviors: [],
      };
      setItems([...items, newGroup]);
      setNextGroupId(nextGroupId + 1);
    }

    setPatternInput('');
  };

  const handleToggleTrackActive = (trackId: string) => {
    setItems(items.map(item => 
      !isTrackGroup(item) && item.id === trackId
        ? { ...item, active: !item.active }
        : item
    ));
  };

  const handleDeleteTrack = (trackId: string) => {
    setItems(items.filter(item => isTrackGroup(item) || item.id !== trackId));
  };

  const handleToggleExpand = (groupId: string) => {
    setItems(items.map(item => 
      isTrackGroup(item) && item.id === groupId
        ? { ...item, expanded: !item.expanded }
        : item
    ));
  };

  const handleToggleActive = (groupId: string) => {
    setItems(items.map(item => 
      isTrackGroup(item) && item.id === groupId
        ? { ...item, active: !item.active }
        : item
    ));
  };

  const handleDeleteGroup = (groupId: string) => {
    // When deleting a group, convert its tracks to individual tracks
    const group = items.find(item => isTrackGroup(item) && item.id === groupId) as TrackGroup | undefined;
    if (group) {
      const individualTracks: Track[] = group.tracks.map(trackId => ({
        id: trackId.toString(),
        name: `Track ${trackId}`,
        position: { x: 0, y: 0, z: 0 },
        aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
        behaviors: [],
        active: group.active
      }));
      
      setItems([
        ...items.filter(item => !isTrackGroup(item) || item.id !== groupId),
        ...individualTracks
      ]);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // If dropping at the same spot, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle dropping between different droppable areas
    if (source.droppableId !== destination.droppableId) {
      // If source is a group's internal droppable
      if (source.droppableId.startsWith('group-')) {
        const groupId = source.droppableId.replace('group-', '');
        const group = items.find(item => isTrackGroup(item) && item.id === groupId) as TrackGroup;
        if (group) {
          const trackId = parseInt(draggableId);
          // Remove track from group and create individual track
          const updatedGroup = {
            ...group,
            tracks: group.tracks.filter(id => id !== trackId),
            pattern: `{${group.tracks.filter(id => id !== trackId).join(',')}}`
          };
          
          const newTrack: Track = {
            id: trackId.toString(),
            name: `Track ${trackId}`,
            position: { x: 0, y: 0, z: 0 },
            aedPosition: { azimuth: 0, elevation: 0, distance: 1 },
            behaviors: [],
            active: group.active
          };

          // If group becomes empty, remove it
          const updatedItems = updatedGroup.tracks.length === 0
            ? items.filter(item => !isTrackGroup(item) || item.id !== groupId)
            : items.map(item => 
                isTrackGroup(item) && item.id === groupId ? updatedGroup : item
              );

          // Insert the new track at the destination
          updatedItems.splice(destination.index, 0, newTrack);
          setItems(updatedItems);
          return;
        }
      }
      return;
    }

    // Handle reordering within the same droppable
    if (source.droppableId === DROPPABLE_ID) {
      const sourceItem = items[source.index];
      const destinationIndex = destination.index;
      
      // Find if we're dropping near a group
      const prevItem = destinationIndex > 0 ? items[destinationIndex - 1] : null;
      const nextItem = destinationIndex < items.length ? items[destinationIndex] : null;
      
      // If source is not a group and we're dropping near a group
      if (!isTrackGroup(sourceItem)) {
        const trackId = parseInt(sourceItem.id);
        
        // Try to merge with previous group if it exists
        if (prevItem && isTrackGroup(prevItem) && !prevItem.tracks.includes(trackId)) {
          const updatedItems = items.filter((_, index) => index !== source.index);
          const updatedGroup = {
            ...prevItem,
            tracks: [...prevItem.tracks, trackId].sort((a, b) => a - b),
            pattern: `{${[...prevItem.tracks, trackId].sort((a, b) => a - b).join(',')}}`
          };
          const prevIndex = destinationIndex - 1;
          updatedItems[prevIndex] = updatedGroup;
          setItems(updatedItems);
          return;
        }
        
        // Try to merge with next group if it exists
        if (nextItem && isTrackGroup(nextItem) && !nextItem.tracks.includes(trackId)) {
          const updatedItems = items.filter((_, index) => index !== source.index);
          const updatedGroup = {
            ...nextItem,
            tracks: [...nextItem.tracks, trackId].sort((a, b) => a - b),
            pattern: `{${[...nextItem.tracks, trackId].sort((a, b) => a - b).join(',')}}`
          };
          updatedItems[destinationIndex] = updatedGroup;
          setItems(updatedItems);
          return;
        }
      }

      // Default reordering behavior
      const reorderedItems = Array.from(items);
      const [removed] = reorderedItems.splice(source.index, 1);
      reorderedItems.splice(destination.index, 0, removed);
      setItems(reorderedItems);
    }
  };

  const renderDraggableItem = (item: TrackOrGroup, index: number) => (
    <DraggableItem
      key={item.id}
      item={item}
      index={index}
      selectedTrack={selectedTrack}
      onSelectionChange={onSelectionChange}
      onToggleExpand={handleToggleExpand}
      onToggleActive={handleToggleActive}
      onDeleteGroup={handleDeleteGroup}
      onToggleTrackActive={handleToggleTrackActive}
      onDeleteTrack={handleDeleteTrack}
    />
  );

  return (
    <div className="track-list">
      <div className="track-form">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (isValidPattern(patternInput)) {
            handleAdd();
          }
        }}>
          <input
            type="text"
            value={patternInput}
            onChange={(e) => setPatternInput(e.target.value)}
            placeholder="Enter track number or pattern (e.g., 1, [1-4], or {1,3,5})"
            className="track-input"
          />
          <button 
            type="submit"
            disabled={!isValidPattern(patternInput)}
            className="add-track-btn"
          >
            Add
          </button>
        </form>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="track-list-container" style={{ overflowY: 'hidden' }}>
          <Droppable droppableId={DROPPABLE_ID}>
            {(dropProvided: DroppableProvided) => (
              <DroppableContent
                provided={dropProvided}
                items={items}
                renderDraggableItem={renderDraggableItem}
              />
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
};
