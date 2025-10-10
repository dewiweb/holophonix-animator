import * as React from 'react';
import { Animation, Position } from '../types';

interface AnimationTimelineProps {
  animation: Animation;
  customMarkers?: Array<{ time: number; label: string; color: string }>;
  onTimeChange?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onKeyframeChange?: (keyframeId: string, time: number) => void;
  onKeyframeDelete?: (keyframeId: string) => void;
  onKeyframeSelect?: (keyframeId: string) => void;
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
  onKeyframeDelete,
  onKeyframeSelect,
  onMarkerChange,
  onLoopChange,
  snapToKeyframes = false
}) => {

  const [hoveredKeyframe, setHoveredKeyframe] = React.useState<string | null>(null);
  const [contextMenuKeyframe, setContextMenuKeyframe] = React.useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = React.useState<{ x: number; y: number } | null>(null);

  const formatPosition = (pos: Position) => {
    return `x: ${pos.x}, y: ${pos.y}, z: ${pos.z}`;
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getKeyframePosition = (time: number) => {
    return `${(time / animation.duration) * 100}%`;
  };

  const calculateTimeFromX = (x: number, rect: DOMRect) => {
    const width = rect.width;
    const rawTime = Math.max(0, Math.min((x / width) * animation.duration, animation.duration));
    
    let time = rawTime;
    if (snapToKeyframes && animation.keyframes?.length > 0) {
      const nearestKeyframe = animation.keyframes.reduce((prev, curr) => {
        return Math.abs(curr.time - rawTime) < Math.abs(prev.time - rawTime) ? curr : prev;
      });
      if (Math.abs(nearestKeyframe.time - rawTime) < animation.duration * 0.05) {
        time = nearestKeyframe.time;
      }
    }
    
    return time;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setContextMenuKeyframe(null);
    setContextMenuPosition(null);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = calculateTimeFromX(x, rect);
    onTimeChange?.(time);
  };

  const handleKeyframeContextMenu = (e: React.MouseEvent<HTMLDivElement>, keyframeId: string) => {
    e.preventDefault();
    setContextMenuKeyframe(keyframeId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const renderContextMenu = () => {
    if (!contextMenuKeyframe || !contextMenuPosition) return null;

    return (
      <div
        className="context-menu"
        style={{
          position: 'absolute',
          left: contextMenuPosition.x,
          top: contextMenuPosition.y,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <button
          onClick={() => {
            onKeyframeDelete?.(contextMenuKeyframe);
            setContextMenuKeyframe(null);
            setContextMenuPosition(null);
          }}
        >
          Delete Keyframe
        </button>
      </div>
    );
  };

  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragTarget, setDragTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        const newTime = Math.min(animation.currentTime + 500, animation.duration);
        onTimeChange?.(Math.round(newTime / 500) * 500);
      } else if (e.key === 'ArrowLeft') {
        const newTime = Math.max(animation.currentTime - 500, 0);
        onTimeChange?.(Math.round(newTime / 500) * 500);
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.timeline')) {
        setIsDragging(true);
        setDragTarget(target);
        
        const rect = document.querySelector('.timeline')?.getBoundingClientRect();
        if (!rect) return;
        
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const rawTime = (x / rect.width) * animation.duration;
        const time = Math.round(rawTime / 500) * 500;
        
        if (target.classList.contains('keyframe-marker')) {
          const keyframeId = target.getAttribute('data-keyframe-id');
          if (keyframeId) {
            onKeyframeSelect?.(keyframeId);
            onKeyframeChange?.(keyframeId, time);
          }
        } else if (target.classList.contains('custom-marker')) {
          const markerIndex = parseInt(target.getAttribute('data-marker-index') || '', 10);
          if (!isNaN(markerIndex)) {
            onMarkerChange?.(markerIndex, time);
          }
        } else {
          onTimeChange?.(time);
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragTarget) {
        const rect = document.querySelector('.timeline')?.getBoundingClientRect();
        if (!rect) return;
        
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const rawTime = (x / rect.width) * animation.duration;
        
        // Snap to 500ms intervals
        let time = Math.round(rawTime / 500) * 500;
        
        if (dragTarget.classList.contains('keyframe-marker')) {
          const keyframeId = dragTarget.getAttribute('data-keyframe-id');
          if (keyframeId) {
            // For keyframes, calculate time based on percentage of timeline width
            const percent = x / rect.width;
            const time = Math.round(percent * animation.duration / 500) * 500;
            onKeyframeChange?.(keyframeId, time);
          }
        } else if (dragTarget.classList.contains('custom-marker')) {
          const markerIndex = parseInt(dragTarget.getAttribute('data-marker-index') || '', 10);
          if (!isNaN(markerIndex)) {
            // For custom markers, calculate time based on percentage of timeline width
            const percent = x / rect.width;
            const time = Math.round(percent * animation.duration / 500) * 500;
            onMarkerChange?.(markerIndex, time);
          }
        } else {
          // When dragging the timeline, snap to keyframes if enabled
          if (snapToKeyframes && animation.keyframes?.length > 0) {
            const nearestKeyframe = animation.keyframes.reduce((prev, curr) => {
              return Math.abs(curr.time - rawTime) < Math.abs(prev.time - rawTime) ? curr : prev;
            });
            if (Math.abs(nearestKeyframe.time - rawTime) < animation.duration * 0.05) {
              time = nearestKeyframe.time;
            }
          }
          onTimeChange?.(time);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragTarget(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuKeyframe) {
        const target = e.target as HTMLElement;
        if (!target.closest('.context-menu')) {
          setContextMenuKeyframe(null);
          setContextMenuPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [animation.duration, animation.keyframes, onTimeChange, snapToKeyframes, contextMenuKeyframe, onKeyframeChange, onMarkerChange]);

  const handleMarkerDrag = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const rawTime = (x / rect.width) * animation.duration;
    const time = Math.round(rawTime / 500) * 500;
    onMarkerChange?.(index, time);
    
    // Set up dragging state
    setIsDragging(true);
    setDragTarget(e.currentTarget);
    e.currentTarget.setAttribute('data-marker-index', index.toString());
  };

  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rawTime = (x / rect.width) * animation.duration;
    setHoverTime(rawTime);
  };

  const handleTimelineLeave = () => {
    setHoverTime(null);
  };

  return (
    <div 
      className="timeline" 
      data-testid="timeline"
      onMouseMove={handleTimelineHover}
      onMouseLeave={handleTimelineLeave}
      style={{ transform: `scaleX(${zoom})` }}
    >
      <div className="timeline-controls">
        <button
          data-testid="play-button"
          onClick={() => onPlayPause?.(!animation.isPlaying)}
        >
          {animation.isPlaying ? '⏸' : '▶️'}
        </button>
        <button
          data-testid="loop-button"
          onClick={() => onLoopChange?.(!animation.loopRegion)}
        >
          🔁
        </button>
        <button data-testid="zoom-in" onClick={() => setZoom(zoom * 1.2)}>
          +
        </button>
        <button data-testid="zoom-out" onClick={() => setZoom(zoom / 1.2)}>
          -
        </button>
        {hoverTime !== null && (
          <div data-testid="hover-time" className="hover-time">
            {(hoverTime / 1000).toFixed(1)}s
          </div>
        )}
      </div>
      <input
        type="range"
        min="0"
        max={animation.duration}
        value={animation.currentTime}
        onChange={(e) => onTimeChange?.(Number(e.target.value))}
      />
      
      <div className="keyframe-container">
        {animation.loopRegion && (
          <div
            className="loop-region"
            data-testid="loop-region"
            style={{
              left: getKeyframePosition(animation.loopRegion.start),
              width: `${((animation.loopRegion.end - animation.loopRegion.start) / animation.duration) * 100}%`
            }}
          />
        )}
        
        <div
          className="current-time-marker"
          data-testid="playhead"
          style={{
            left: getKeyframePosition(animation.currentTime)
          }}
        />
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="time-marker grid-line"
            data-testid="time-marker"
            style={{
              left: `${i * 10}%`
            }}
          />
        ))}
        
        {customMarkers?.map((marker, index) => (
          <div
            key={`marker-${index}`}
            className="custom-marker"
            data-testid="custom-marker"
            data-marker-index={index}
            style={{
              left: getKeyframePosition(marker.time),
              backgroundColor: marker.color
            }}
            onMouseDown={(e) => handleMarkerDrag(index, e)}
          >
            {marker.label}
          </div>
        ))}

        {animation.keyframes?.map((keyframe) => (
          <div
            key={keyframe.id}
            className="keyframe-marker"
            data-testid="keyframe-marker"
            data-keyframe-id={keyframe.id}
            style={{
              left: getKeyframePosition(keyframe.time)
            }}
            onMouseEnter={() => setHoveredKeyframe(keyframe)}
            onMouseLeave={() => setHoveredKeyframe(null)}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragTarget(e.currentTarget);
              e.currentTarget.setAttribute('data-keyframe-id', keyframe.id);
            }}
            onContextMenu={(e) => handleKeyframeContextMenu(e, keyframe.id)}
          >
            {hoveredKeyframe?.id === keyframe.id && (
              <div 
                className="keyframe-tooltip" 
                data-testid="keyframe-tooltip"
              >
                <div>{formatTime(keyframe.time)}</div>
                <div>position: {JSON.stringify(keyframe.value)}</div>
              </div>
            )}
          </div>
        ))}

        {contextMenuKeyframe && contextMenuPosition && (
          <div
            className="context-menu"
            style={{
              position: 'fixed',
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              padding: '4px',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            <button
              onClick={() => {
                onKeyframeDelete?.(contextMenuKeyframe);
                setContextMenuKeyframe(null);
                setContextMenuPosition(null);
              }}
            >
              Delete Keyframe
            </button>
          </div>
        )}


      </div>
    </div>
  );
};


