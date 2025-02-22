import React from 'react';

interface TimelineProps {
  onPlayPause: () => void;
  isPlaying: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({ onPlayPause, isPlaying }) => {
  return (
    <div className="timeline">
      <div className="timeline-header">
        <button className="button" onClick={onPlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span>00:00:00</span>
      </div>
      <div className="timeline-content">
        <div className="timeline-grid"></div>
      </div>
    </div>
  );
};
