import React, { useState, useEffect } from 'react';
import { Animation, Position } from '../types';

interface AnimationEditorProps {
  animation: Animation;
  onUpdate?: (animation: Animation) => void;
}

const defaultPresets = {
  linear: [
    {
      name: 'Move Right',
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 100, y: 0, z: 0 }
      }
    },
    {
      name: 'Move Up',
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 0, y: 100, z: 0 }
      }
    }
  ],
  circular: [
    {
      name: 'Circle XY',
      parameters: {
        center: { x: 50, y: 50, z: 0 },
        radius: 50,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      }
    },
    {
      name: 'Circle XZ',
      parameters: {
        center: { x: 50, y: 0, z: 50 },
        radius: 50,
        startAngle: 0,
        endAngle: 360,
        plane: 'xz'
      }
    }
  ]
};

export const AnimationEditor: React.FC<AnimationEditorProps> = ({ animation, onUpdate }) => {
  const [localAnimation, setLocalAnimation] = useState(animation);

  useEffect(() => {
    setLocalAnimation(animation);
  }, [animation]);

  const handleChange = (changes: Partial<Animation>) => {
    const updatedAnimation = { ...localAnimation, ...changes };
    setLocalAnimation(updatedAnimation);
    onUpdate?.(updatedAnimation);
  };

  const handlePositionChange = (type: 'start' | 'end', axis: keyof Position, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const updatedAnimation = { ...localAnimation };
    if (updatedAnimation.type === 'linear') {
      const positionKey = type === 'start' ? 'startPosition' : 'endPosition';
      updatedAnimation.parameters = {
        ...updatedAnimation.parameters,
        [positionKey]: {
          ...updatedAnimation.parameters[positionKey],
          [axis]: numValue
        }
      };
      onUpdate?.(updatedAnimation);
    }
  };

  return (
    <div className="animation-editor" data-testid="animation-editor">
      <div className="editor-row">
        <label>Name:</label>
        <input
          type="text"
          value={localAnimation.name}
          onChange={(e) => handleChange({ name: e.target.value })}
        />
      </div>
      <div className="editor-row">
        <label>Duration (ms):</label>
        <input
          type="number"
          value={localAnimation.duration}
          onChange={(e) => handleChange({ duration: parseInt(e.target.value) })}
        />
      </div>
      <div className="editor-row">
        <label>Type:</label>
        <select
          data-testid="animation-type-select"
          value={localAnimation.type}
          onChange={(e) => handleChange({ type: e.target.value as Animation['type'] })}
        >
          <option value="linear">Linear</option>
          <option value="circular">Circular</option>
        </select>
        <button
          data-testid="presets-button"
          onClick={() => {
            const presets = defaultPresets[localAnimation.type];
            if (presets && presets.length > 0) {
              handleChange({ parameters: presets[0].parameters });
            }
          }}
        >
          Load Preset
        </button>
      </div>
      {localAnimation.type === 'linear' && (
        <>
          <div className="editor-row">
            <label>Start Position:</label>
            <input
              type="number"
              data-testid="start-position-x"
              value={localAnimation.parameters.startPosition.x}
              onChange={(e) => handlePositionChange('start', 'x', e.target.value)}
            />
            <input
              type="number"
              data-testid="start-position-y"
              value={localAnimation.parameters.startPosition.y}
              onChange={(e) => handlePositionChange('start', 'y', e.target.value)}
            />
            <input
              type="number"
              data-testid="start-position-z"
              value={localAnimation.parameters.startPosition.z}
              onChange={(e) => handlePositionChange('start', 'z', e.target.value)}
            />
          </div>
          <div className="editor-row">
            <label>End Position:</label>
            <input
              type="number"
              data-testid="end-position-x"
              value={localAnimation.parameters.endPosition.x}
              onChange={(e) => handlePositionChange('end', 'x', e.target.value)}
            />
            <input
              type="number"
              data-testid="end-position-y"
              value={localAnimation.parameters.endPosition.y}
              onChange={(e) => handlePositionChange('end', 'y', e.target.value)}
            />
            <input
              type="number"
              data-testid="end-position-z"
              value={localAnimation.parameters.endPosition.z}
              onChange={(e) => handlePositionChange('end', 'z', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
};
