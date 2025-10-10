import React from 'react';
import { Animation, Position } from '../../types';

interface AnimationPreviewProps {
  animation: Animation;
  trackId: string;
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

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ animation, trackId }) => {
  const position = calculatePreviewPosition(animation);
  const previewSize = 10; // Size of preview dot in pixels

  return (
    <div 
      className="animation-preview"
      data-testid={`preview-${trackId}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      <div
        className="preview-dot"
        style={{
          position: 'absolute',
          left: `${((position.x + 10) / 20) * 100}%`,
          top: `${((position.y + 10) / 20) * 100}%`,
          width: `${previewSize}px`,
          height: `${previewSize}px`,
          borderRadius: '50%',
          backgroundColor: animation.isPlaying ? '#4CAF50' : '#9E9E9E',
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};
