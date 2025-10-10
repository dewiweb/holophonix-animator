import React, { useState, useCallback } from 'react';
import { Panel } from '../Panel';
import { Track } from '../../types';
import './TrackPanel.css';

interface TrackPanelProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onTrackSelect: (id: string) => void;
  onTrackAdd: () => void;
  onTrackRemove: (id: string) => void;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
  width: number;
  onResize: (width: number) => void;
}

export const TrackPanel: React.FC<TrackPanelProps> = ({
  tracks,
  selectedTrackId,
  onTrackSelect,
  onTrackAdd,
  onTrackRemove,
  onTrackUpdate,
  width,
  onResize,
}) => {
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);

  const handleNameEdit = useCallback((id: string, newName: string) => {
    onTrackUpdate(id, { name: newName });
    setEditingTrackId(null);
  }, [onTrackUpdate]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedTrackId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedTrackId || draggedTrackId === targetId) return;

    const sourceIndex = tracks.findIndex(t => t.id === draggedTrackId);
    const targetIndex = tracks.findIndex(t => t.id === targetId);

    onTrackUpdate(draggedTrackId, { order: targetIndex });
    setDraggedTrackId(null);
  }, [draggedTrackId, onTrackUpdate, tracks]);

  const renderTrackItem = useCallback((track: Track) => {
    const isEditing = editingTrackId === track.id;
    const isSelected = selectedTrackId === track.id;

    return (
      <div
        key={track.id}
        className={'track-item ' + (isSelected ? 'track-item--selected' : '')}
        onClick={() => onTrackSelect(track.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, track.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, track.id)}
      >
        <div className="track-item__preview" data-testid="track-mini-preview">
          <div 
            className="track-item__position-dot"
            style={{
              left: (track.position.x * 100) + '%',
              top: (track.position.y * 100) + '%'
            }}
          />
        </div>
        <div className="track-item__content">
          {isEditing ? (
            <input
              type="text"
              defaultValue={track.name}
              autoFocus
              onBlur={(e) => handleNameEdit(track.id, e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNameEdit(track.id, e.currentTarget.value)}
            />
          ) : (
            <div
              className="track-item__name"
              onDoubleClick={() => setEditingTrackId(track.id)}
            >
              {track.name}
            </div>
          )}
          <button
            className="track-item__remove"
            onClick={(e) => {
              e.stopPropagation();
              onTrackRemove(track.id);
            }}
            aria-label="remove track"
          >
            ×
          </button>
        </div>
      </div>
    );
  }, [editingTrackId, selectedTrackId, handleDragStart, handleDragOver, handleDrop, handleNameEdit, onTrackRemove, onTrackSelect]);

  return (
    <Panel
      title="Tracks"
      width={width}
      onResize={onResize}
      resizable
      collapsible
      controls={
        <button
          className="track-panel__add-button"
          onClick={onTrackAdd}
          aria-label="add track"
        >
          +
        </button>
      }
    >
      <div className="track-panel__list">
        {tracks.map(renderTrackItem)}
      </div>
    </Panel>
  );
};
