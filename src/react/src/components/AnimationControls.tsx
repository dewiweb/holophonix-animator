import React from 'react';
import { LinearAnimation } from '../types';

interface AnimationControlsProps {
  animation: LinearAnimation;
  onPlayPause?: () => void;
  onStop?: () => void;
  onTimeUpdate?: (id: string, time: number) => void;
}

export const AnimationControls = ({animation, onPlayPause, onStop, onTimeUpdate}: AnimationControlsProps) => {
  const handlePlayPause = () => {
    onPlayPause?.(animation.id, !animation.isPlaying);
  };

  const handleStop = () => {
    onStop?.(animation.id);
  };

  const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    onTimeUpdate?.(animation.id, time);
  };
  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="animation-controls">
      <div data-testid="animation-name">{animation.name}</div>
      <button
        data-testid={animation.isPlaying ? 'pause-button' : 'play-button'}
        onClick={handlePlayPause}
        aria-label={animation.isPlaying ? 'pause' : 'play'}
      >
        {animation.isPlaying ? '⏸' : '▶️'}
      </button>
      
      <button 
        data-testid="stop-button"
        onClick={handleStop} 
        aria-label="stop"
      >
        ⏹
      </button>
      
      <input
        data-testid="timeline-slider"
        type="range"
        min="0"
        max={animation.duration}
        value={animation.currentTime}
        onChange={handleTimeUpdate}
      />
      
      <span data-testid="current-time" className="time-display">
        {formatTime(animation.currentTime)} / {formatTime(animation.duration)}
      </span>
      <div 
        data-testid="animation-type" 
        className="animation-type"
        title={`${animation.type.charAt(0).toUpperCase() + animation.type.slice(1)} Movement Animation`}
      >
        {animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}
      </div>
    </div>
  );
};
