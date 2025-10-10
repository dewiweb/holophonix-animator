import React from 'react';
import { Animation } from '../types';

interface AnimationListProps {
  animations: Animation[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  playingAnimations?: string[];
  animationProgress?: Record<string, number>;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onReorder?: (id: string, direction: 'up' | 'down') => void;
}

export const AnimationList: React.FC<AnimationListProps> = ({
  animations,
  selectedId,
  onSelect,
  playingAnimations = [],
  animationProgress = {},
  onDelete,
  onDuplicate,
  onReorder
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ul className="animation-list">
      {animations.length === 0 ? (
        <div className="empty-state">
          <p>No animations created yet</p>
          <p>Create an animation to get started</p>
        </div>
      ) : animations.map((animation) => (
        <li
          key={animation.id}
          data-testid={`animation-item-${animation.id}`}
          className={animation.id === selectedId ? 'selected' : ''}
          onClick={() => onSelect?.(animation.id)}
        >
          <div className="animation-info">
            <span className="animation-name">{animation.name}</span>
            <span className="animation-duration" data-testid="animation-duration">{formatTime(animation.duration)}</span>
            <span className="animation-play-state" data-testid="animation-play-state">
              {animation.isPlaying ? 'Playing' : 'Paused'}
            </span>
          </div>
          <div className="animation-type" data-testid="animation-type-badge">
            {animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}
          </div>
          <div 
            className="animation-progress" 
            data-testid="animation-progress"
            style={{ width: `${(animation.currentTime / animation.duration) * 100}%` }}
          />
          <div className="animation-actions">
            <button
              className="duplicate-button"
              data-testid="duplicate-button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(animation.id);
              }}
            >
              Copy
            </button>
            <button
              className="move-up-button"
              data-testid="move-up-button"
              onClick={(e) => {
                e.stopPropagation();
                onReorder?.(animation.id, 'up');
              }}
            >
              ↑
            </button>
            <button
              className="move-down-button"
              data-testid="move-down-button"
              onClick={(e) => {
                e.stopPropagation();
                onReorder?.(animation.id, 'down');
              }}
            >
              ↓
            </button>
            <button
              className="delete-button"
              data-testid="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(animation.id);
              }}
            >
              ×
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
