import React from 'react';
import { Animation, Position } from '../../types';

interface AnimationPreviewProps {
  animation: Animation;
  trackId: string;
  onTimeChange?: (time: number) => void;
  snapToKeyframes?: boolean;
}

const calculatePreviewPosition = (animation: Animation): Position => {
  const { type, parameters, currentTime } = animation;

  switch (type) {
    case 'linear': {
      const { startPosition, endPosition } = parameters;
      const progress = currentTime / animation.duration;
      return {
        x: startPosition.x + (endPosition.x - startPosition.x) * progress,
        y: startPosition.y + (endPosition.y - startPosition.y) * progress,
        z: startPosition.z + (endPosition.z - startPosition.z) * progress
      };
    }
    case 'circular': {
      const { center, radius, direction } = parameters;
      const angle = (currentTime / animation.duration) * Math.PI * 2;
      const clockwise = direction === 'clockwise' ? 1 : -1;
      return {
        x: center.x + radius * Math.cos(angle * clockwise),
        y: center.y + radius * Math.sin(angle * clockwise),
        z: center.z
      };
    }
    case 'random': {
      const { bounds } = parameters;
      // Use currentTime as seed for deterministic random movement
      const seed = currentTime / 1000;
      const randomX = Math.sin(seed * 1.1) * 0.5 + 0.5;
      const randomY = Math.sin(seed * 1.3) * 0.5 + 0.5;
      const randomZ = Math.sin(seed * 1.7) * 0.5 + 0.5;
      return {
        x: bounds.min.x + (bounds.max.x - bounds.min.x) * randomX,
        y: bounds.min.y + (bounds.max.y - bounds.min.y) * randomY,
        z: bounds.min.z + (bounds.max.z - bounds.min.z) * randomZ
      };
    }
    case 'custom': {
      const { points } = parameters;
      if (points.length === 0) return { x: 0, y: 0, z: 0 };
      
      const totalLength = points.length;
      const progress = (currentTime / animation.duration) * totalLength;
      const index = Math.floor(progress);
      const nextIndex = (index + 1) % totalLength;
      const fraction = progress - index;

      const current = points[index];
      const next = points[nextIndex];

      return {
        x: current.x + (next.x - current.x) * fraction,
        y: current.y + (next.y - current.y) * fraction,
        z: current.z + (next.z - current.z) * fraction
      };
    }
  }
};

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ 
  animation, 
  trackId, 
  onTimeChange,
  snapToKeyframes = true 
}) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const previewRef = React.useRef<HTMLCanvasElement>(null);
  const [localTime, setLocalTime] = React.useState(animation.currentTime);
  const position = calculatePreviewPosition({ ...animation, currentTime: localTime });
  const previewSize = 10; // Size of preview dot in pixels

  React.useEffect(() => {
    setLocalTime(animation.currentTime);
  }, [animation.currentTime]);

  const previewStyle = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    cursor: isDragging ? 'grabbing' : isHovering ? 'grab' : 'default'
  };

  const dotStyle = {
    position: 'absolute' as const,
    left: `${((position.x + 10) / 20) * 100}%`,
    top: `${((position.y + 10) / 20) * 100}%`,
    width: `${previewSize}px`,
    height: `${previewSize}px`,
    borderRadius: '50%',
    backgroundColor: isDragging ? '#2196F3' : '#4CAF50',
    transform: 'translate(-50%, -50%)',
    transition: isDragging ? 'none' : 'all 0.1s ease-out',
    zIndex: 2,
    pointerEvents: 'none'
  };

  const findNearestKeyframe = (time: number) => {
    if (!animation.keyframes) return null;
    return animation.keyframes.reduce((nearest, current) => {
      if (!nearest) return current;
      return Math.abs(current.time - time) < Math.abs(nearest.time - time) ? current : nearest;
    }, null as typeof animation.keyframes[0] | null);
  };

  const calculateTimeFromMouseEvent = (e: React.MouseEvent) => {
    if (!previewRef.current) return null;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = x / rect.width;
    let time = Math.round(animation.duration * percentage);

    if (snapToKeyframes && animation.keyframes) {
      const nearest = findNearestKeyframe(time);
      if (nearest && Math.abs(nearest.time - time) / animation.duration < 0.02) {
        time = nearest.time;
      }
    }

    return time;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const time = calculateTimeFromMouseEvent(e);
    if (time !== null) {
      setIsDragging(true);
      setLocalTime(time);
      onTimeChange?.(time);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const time = calculateTimeFromMouseEvent(e);
    if (time !== null) {
      setLocalTime(time);
      onTimeChange?.(time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging]);


  React.useEffect(() => {
    // Skip canvas operations in test environment
    if (process.env.NODE_ENV === 'test') return;

    if (!previewRef.current) return;
    const canvas = previewRef.current;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw preview dot
    ctx.beginPath();
    ctx.arc(
      ((position.x + 10) / 20) * canvas.width,
      ((position.y + 10) / 20) * canvas.height,
      previewSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = isDragging ? '#2196F3' : '#4CAF50';
    ctx.fill();
    ctx.closePath();
  }, [position, isDragging]);

  return (
    <div
      className="animation-preview-container"
      data-testid={`animation-preview-container-${trackId}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '40px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      <canvas
        className="animation-preview"
        data-testid={`animation-preview-${trackId}`}
        width={200}
        height={40}
        ref={previewRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: isHovering ? 'pointer' : 'default'
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setIsDragging(false);
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
      {isHovering && (
        <div
          className="scrub-handle"
          data-testid={`scrub-handle-${trackId}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            pointerEvents: 'none'
          }}
        />
      )}
      {isDragging && (
        <div
          className="time-indicator"
          data-testid={`time-indicator-${trackId}`}
          style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          {localTime}ms
        </div>
      )}
    </div>
  );
};
