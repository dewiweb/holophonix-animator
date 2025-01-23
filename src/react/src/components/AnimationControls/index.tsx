import React from 'react';
import { Animation } from '../../types';
import './AnimationControls.css';

interface AnimationControlsProps {
  animation: Animation;
  onPlayPause?: (id: string, play: boolean) => void;
  onStop?: (id: string) => void;
  onTimeUpdate?: (id: string, time: number) => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
};

const getAnimationTypeTitle = (type: Animation['type']): string => {
  switch (type) {
    case 'linear': return 'Linear Movement Animation';
    case 'circular': return 'Circular Movement Animation';
    case 'random': return 'Random Movement Animation';
    case 'custom': return 'Custom Path Animation';
    default: return 'Unknown Animation Type';
  }
};

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  animation,
  onPlayPause,
  onStop,
  onTimeUpdate,
}) => {
  const handlePlayPause = () => {
    onPlayPause?.(animation.id, !animation.isPlaying);
  };

  const handleStop = () => {
    onStop?.(animation.id);
  };

  const handleTimelineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(event.target.value, 10);
    onTimeUpdate?.(animation.id, newTime);
  };

  return (
    <div className="animation-controls" role="group" aria-label="Animation Controls">
      <div className="animation-info">
        <span 
          className="animation-type" 
          data-testid="animation-type"
          title={getAnimationTypeTitle(animation.type)}
        >
          {animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}
        </span>
        <span className="animation-name" data-testid="animation-name">
          {animation.name}
        </span>
      </div>

      <div className="playback-controls">
        <button
          className="control-button"
          onClick={handlePlayPause}
          data-testid={animation.isPlaying ? 'pause-button' : 'play-button'}
          aria-label={animation.isPlaying ? 'Pause' : 'Play'}
        >
          {animation.isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="control-button"
          onClick={handleStop}
          data-testid="stop-button"
          aria-label="Stop"
        >
          ⏹
        </button>
      </div>

      <div className="timeline-controls">
        <input
          type="range"
          min="0"
          max={animation.duration}
          value={animation.currentTime}
          onChange={handleTimelineChange}
          className="timeline-slider"
          data-testid="timeline-slider"
          aria-label="Animation Timeline"
        />
        <span className="time-display" data-testid="current-time">
          {formatTime(animation.currentTime)}
        </span>
      </div>
    </div>
  );
};
