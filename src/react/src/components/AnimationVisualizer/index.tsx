import React, { useRef, useEffect } from 'react';
import { Animation, Position } from '../../types';
import './AnimationVisualizer.css';

interface AnimationVisualizerProps {
  animation: Animation;
  onTimeChange?: (time: number) => void;
}

const calculateCurrentPosition = (animation: Animation): Position => {
  const progress = animation.duration === 0 ? 0 : animation.currentTime / animation.duration;

  if (animation.type === 'linear') {
    const { startPosition, endPosition } = animation.parameters;
    return {
      x: startPosition.x + (endPosition.x - startPosition.x) * progress,
      y: startPosition.y + (endPosition.y - startPosition.y) * progress,
      z: startPosition.z + (endPosition.z - startPosition.z) * progress
    };
  } else if (animation.type === 'circular') {
    const { center, radius, direction } = animation.parameters;
    const angle = direction === 'clockwise' ? -progress * Math.PI * 2 : progress * Math.PI * 2;
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
      z: center.z
    };
  }

  return { x: 0, y: 0, z: 0 };
};

const drawPath = (
  ctx: CanvasRenderingContext2D,
  animation: Animation,
  width: number,
  height: number,
  scale: number
) => {
  ctx.clearRect(0, 0, width, height);
  
  // Draw grid
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 0.5;
  
  for (let x = 0; x <= width; x += scale) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= height; y += scale) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw axes
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // Draw path
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2;
  ctx.beginPath();

  if (animation.type === 'linear') {
    const { startPosition, endPosition } = animation.parameters;
    const startX = (startPosition.x * scale) + (width / 2);
    const startY = height - ((startPosition.y * scale) + (height / 2));
    const endX = (endPosition.x * scale) + (width / 2);
    const endY = height - ((endPosition.y * scale) + (height / 2));

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  } else if (animation.type === 'circular') {
    const { center, radius } = animation.parameters;
    const centerX = (center.x * scale) + (width / 2);
    const centerY = height - ((center.y * scale) + (height / 2));
    
    ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
  }
  
  ctx.stroke();

  // Draw current position
  const currentPos = calculateCurrentPosition(animation);
  const posX = (currentPos.x * scale) + (width / 2);
  const posY = height - ((currentPos.y * scale) + (height / 2));

  ctx.fillStyle = '#FF4081';
  ctx.beginPath();
  ctx.arc(posX, posY, 6, 0, Math.PI * 2);
  ctx.fill();
};

export const AnimationVisualizer: React.FC<AnimationVisualizerProps> = ({
  animation,
  onTimeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scale = 20; // pixels per unit

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPath(ctx, animation, canvas.width, canvas.height, scale);
  }, [animation]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTimeChange) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / canvas.width;
    onTimeChange(progress * animation.duration);
  };

  const currentPosition = calculateCurrentPosition(animation);
  const progress = animation.duration === 0 ? 0 : (animation.currentTime / animation.duration) * 100;

  return (
    <div className="animation-visualizer">
      <div className="visualizer-header">
        <span className="animation-type" data-testid="animation-type">
          {animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}
        </span>
        <span className="play-state" data-testid="play-state">
          {animation.isPlaying ? 'Playing' : 'Paused'}
        </span>
      </div>

      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          data-testid="animation-canvas"
          className="animation-canvas"
          onClick={handleCanvasClick}
        />
        <span className="axis-label x-axis">X</span>
        <span className="axis-label y-axis">Y</span>
      </div>

      <div className="visualizer-info">
        <div className="path-info">
          <span data-testid="path-type">
            {animation.type === 'linear' ? 'Linear Path' : 'Circular Path'}
          </span>
          <span className="current-position" data-testid="current-position">
            X: {currentPosition.x.toFixed(2)}, Y: {currentPosition.y.toFixed(2)}
          </span>
        </div>
        <div className="progress" data-testid="progress-indicator">
          {progress.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};
