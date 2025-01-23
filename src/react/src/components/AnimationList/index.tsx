import React from 'react';
import { Animation } from '../../types';
import './AnimationList.css';

interface AnimationListProps {
  animations: Animation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onReorder?: (id: string, direction: 'up' | 'down') => void;
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const AnimationList: React.FC<AnimationListProps> = ({
  animations,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onReorder
}) => {
  if (animations.length === 0) {
    return (
      <div className="animation-list-empty">
        <h3>No animations created yet</h3>
        <p>Create an animation to get started</p>
      </div>
    );
  }

  return (
    <div className="animation-list" role="list">
      {animations.map((animation, index) => {
        const progress = animation.duration === 0 ? 0 : (animation.currentTime / animation.duration) * 100;
        const isSelected = animation.id === selectedId;

        return (
          <div
            key={animation.id}
            className={`animation-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect?.(animation.id)}
            data-testid={`animation-item-${animation.id}`}
            role="listitem"
          >
            <div className="animation-header">
              <div className="animation-info">
                <span 
                  className="type-badge"
                  data-testid="animation-type-badge"
                >
                  {animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}
                </span>
                <span className="animation-name">{animation.name}</span>
              </div>
              <div className="animation-actions">
                {index > 0 && (
                  <button
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder?.(animation.id, 'up');
                    }}
                    title="Move Up"
                    data-testid="move-up-button"
                  >
                    ↑
                  </button>
                )}
                {index < animations.length - 1 && (
                  <button
                    className="action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorder?.(animation.id, 'down');
                    }}
                    title="Move Down"
                    data-testid="move-down-button"
                  >
                    ↓
                  </button>
                )}
                <button
                  className="action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate?.(animation.id);
                  }}
                  title="Duplicate"
                  data-testid="duplicate-button"
                >
                  ⎘
                </button>
                <button
                  className="action-button delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(animation.id);
                  }}
                  title="Delete"
                  data-testid="delete-button"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="animation-details">
              <div className="animation-meta">
                <span 
                  className={`play-state ${animation.isPlaying ? 'playing' : 'paused'}`}
                  data-testid="animation-play-state"
                >
                  {animation.isPlaying ? 'Playing' : 'Paused'}
                </span>
                <span 
                  className="duration"
                  data-testid="animation-duration"
                >
                  {formatDuration(animation.duration)}
                </span>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                  data-testid="animation-progress"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
