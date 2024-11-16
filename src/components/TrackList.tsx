import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import type { Track } from '../types/behaviors';
import type { TrackGroup, TrackOrGroup } from '../types/tracks';
import { parsePattern, isTrackGroup, isValidPattern } from '../types/tracks';
import { TrackGroupComponent } from './TrackGroup';
import { TrackComponent } from './Track';

interface TrackListProps {
  selectedTrack: Track | null;
  onSelectionChange: (track: Track | null) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ selectedTrack, onSelectionChange }) => {
  const [items, setItems] = useState<TrackOrGroup[]>([]);
  const [patternInput, setPatternInput] = useState('');
  const [nextGroupId, setNextGroupId] = useState(1);

  const handleAdd = () => {
    if (!isValidPattern(patternInput)) {
      alert('Invalid pattern. Use a number for single track (e.g., 1) or patterns ([1-4] or {1,3,5}) for groups.');
      return;
    }

    const pattern = parsePattern(patternInput);
    if (!pattern) return;

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
    setItems(items.filter(item => !isTrackGroup(item) || item.id !== groupId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };

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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tracks">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="track-list-content"
            >
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                      }}
                    >
                      {isTrackGroup(item) ? (
                        <TrackGroupComponent
                          group={item}
                          selectedTrack={selectedTrack}
                          onSelectionChange={onSelectionChange}
                          onToggleExpand={handleToggleExpand}
                          onToggleActive={handleToggleActive}
                          onDeleteGroup={handleDeleteGroup}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      ) : (
                        <TrackComponent
                          track={item}
                          isSelected={selectedTrack?.id === item.id}
                          onSelect={onSelectionChange}
                          onToggleActive={handleToggleTrackActive}
                          onDelete={handleDeleteTrack}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
