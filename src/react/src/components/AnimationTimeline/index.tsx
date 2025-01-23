import React, { useState, useRef, useCallback } from 'react';
import { Animation, CustomMarker, Keyframe, KeyframeType } from '../../types';
import './AnimationTimeline.css';

const SNAP_THRESHOLD = 0.02; // 2% of total duration

interface AnimationTimelineProps {
  animation: Animation;
  customMarkers?: CustomMarker[];
  onTimeChange?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onKeyframeChange?: (id: string, time: number) => void;
  onMarkerChange?: (index: number, time: number) => void;
  onLoopChange?: (enabled: boolean) => void;
  snapToKeyframes?: boolean;
}

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  animation,
  customMarkers = [],
  onTimeChange,
  onPlayPause,
  onKeyframeChange,
  onMarkerChange,
  onLoopChange,
  snapToKeyframes = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'keyframe' | 'marker' | 'playhead', id: string | number } | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const findNearestKeyframe = (time: number, keyframes: Keyframe[]) => {
    return keyframes.reduce((nearest, current) => {
      if (!nearest) return current;
      return Math.abs(current.time - time) < Math.abs(nearest.time - time) ? current : nearest;
    }, null as Keyframe | null);
  };

  const calculateTimeFromX = useCallback((x: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    let time = animation.duration * percentage;

    if (snapToKeyframes && animation.keyframes) {
      const nearest = findNearestKeyframe(time, animation.keyframes);
      if (nearest && Math.abs(nearest.time - time) < SNAP_THRESHOLD * animation.duration) {
        time = nearest.time;
      }
    }

    return Math.round(time);
  }, [animation.duration, animation.keyframes, snapToKeyframes]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const time = calculateTimeFromX(x);
    setHoverTime(time);

    if (isDragging && draggedItem) {
      if (draggedItem.type === 'keyframe') {
        onKeyframeChange?.(draggedItem.id as string, time);
      } else if (draggedItem.type === 'marker') {
        onMarkerChange?.(draggedItem.id as number, time);
      } else if (draggedItem.type === 'playhead') {
        onTimeChange?.(time);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, item?: { type: 'keyframe' | 'marker' | 'playhead', id: string | number }) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDraggedItem(item || { type: 'playhead', id: 'playhead' });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging && draggedItem && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const time = calculateTimeFromX(x);

      if (draggedItem.type === 'keyframe') {
        onKeyframeChange?.(draggedItem.id as string, time);
      } else if (draggedItem.type === 'marker') {
        onMarkerChange?.(draggedItem.id as number, time);
      } else if (draggedItem.type === 'playhead') {
        onTimeChange?.(time);
      }
    }
    setIsDragging(false);
    setDraggedItem(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedItem(null);
    }
    setHoverTime(null);
  };

  const getKeyframeColor = (type: KeyframeType): string => {
    switch (type) {
      case 'position':
        return '#4CAF50';
      case 'rotation':
        return '#2196F3';
      case 'scale':
        return '#FFC107';
      case 'color':
        return '#9C27B0';
      default:
        return '#757575';
    }
  };

  const renderKeyframes = () => {
    if (!animation.keyframes) return null;

    return animation.keyframes.map(keyframe => (
      <div
        key={keyframe.id}
        className={`keyframe-marker ${keyframe.type}-keyframe`}
        style={{
          left: `${(keyframe.time / animation.duration) * 100}%`,
          backgroundColor: getKeyframeColor(keyframe.type)
        }}
        onMouseDown={(e) => handleMouseDown(e, { type: 'keyframe', id: keyframe.id })}
        title={`${keyframe.type} at ${keyframe.time}ms`}
        data-testid={`keyframe-${keyframe.id}`}
      />
    ));
  };

  const renderCustomMarkers = () => {
    return customMarkers.map((marker, index) => (
      <div
        key={index}
        className="custom-marker"
        style={{
          left: `${(marker.time / animation.duration) * 100}%`,
          backgroundColor: marker.color
        }}
        onMouseDown={(e) => handleMouseDown(e, { type: 'marker', id: index })}
        title={`${marker.label} at ${marker.time}ms`}
        data-testid={`marker-${index}`}
      />
    ));
  };

  return (
    <div className="animation-timeline" data-testid="animation-timeline">
      <div className="timeline-controls">
        <div className="time-display">
          {animation.currentTime}ms / {animation.duration}ms
        </div>
        <div className="control-buttons">
          <button
            className={`control-button play ${animation.isPlaying ? 'active' : ''}`}
            onClick={() => onPlayPause?.(!animation.isPlaying)}
            data-testid="play-button"
          >
            {animation.isPlaying ? '⏸' : '▶'}
          </button>
          <button
            className={`control-button loop ${animation.loopRegion ? 'active' : ''}`}
            onClick={() => onLoopChange?.(!animation.loopRegion)}
            data-testid="loop-button"
          >
            🔁
          </button>
        </div>
      </div>

      <div
        className="timeline"
        ref={timelineRef}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        data-testid="timeline-track"
      >
        <div className="timeline-background" />
        
        {animation.loopRegion && (
          <div
            className="loop-region"
            style={{
              left: `${(animation.loopRegion.start / animation.duration) * 100}%`,
              width: `${((animation.loopRegion.end - animation.loopRegion.start) / animation.duration) * 100}%`
            }}
            data-testid="loop-region"
          />
        )}

        {renderKeyframes()}
        {renderCustomMarkers()}

        <div
          className="playhead"
          style={{
            left: `${(animation.currentTime / animation.duration) * 100}%`
          }}
          data-testid="playhead"
        />

        {hoverTime !== null && (
          <div
            className="hover-time"
            style={{
              left: `${(hoverTime / animation.duration) * 100}%`
            }}
          >
            {hoverTime}ms
          </div>
        )}
      </div>
    </div>
  );
};
