import React, { useState } from 'react';
import { Animation, AnimationType, Position, LinearAnimationParameters, CircularAnimationParameters, RandomAnimationParameters, CustomAnimationParameters, AnimationParameters, AnimationPreset, defaultPresets } from '../../types';
import './AnimationEditor.css';

interface AnimationEditorProps {
  animation: Animation;
  onUpdate?: (animation: Animation) => void;
}

interface ValidationErrors {
  duration?: string;
  position?: string;
  radius?: string;
  speed?: string;
}

const defaultPresets = {
  linear: [
    {
      name: 'Move Right',
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 10, y: 0, z: 0 }
      }
    },
    {
      name: 'Move Up',
      parameters: {
        startPosition: { x: 0, y: 0, z: 0 },
        endPosition: { x: 0, y: 10, z: 0 }
      }
    }
  ],
  circular: [
    {
      name: 'Small Circle',
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 2,
        speed: 1,
        direction: 'clockwise' as const
      }
    },
    {
      name: 'Large Circle',
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 10,
        speed: 0.5,
        direction: 'clockwise' as const
      }
    }
  ]
};

const validateNumber = (value: number, min: number = 0): string | undefined => {
  if (value < min) return `Value must be ${min === 0 ? 'positive' : `greater than ${min}`}`;
  return undefined;
};

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  animation,
  onUpdate
}) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPresets, setShowPresets] = useState(false);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.({
      ...animation,
      name: event.target.value
    });
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(event.target.value, 10);
    const error = validateNumber(duration);
    setErrors(prev => ({ ...prev, duration: error }));
    
    if (!error) {
      onUpdate?.({
        ...animation,
        duration
      });
    }
  };

  const handlePositionChange = (key: keyof LinearAnimationParameters | keyof CircularAnimationParameters, axis: keyof Position, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (animation.type === 'linear') {
      const params = animation.parameters as LinearAnimationParameters;
      onUpdate?.({
        ...animation,
        parameters: {
          ...params,
          [key]: {
            ...params[key as keyof LinearAnimationParameters],
            [axis]: numValue
          }
        }
      });
    } else if (animation.type === 'circular') {
      const params = animation.parameters as CircularAnimationParameters;
      onUpdate?.({
        ...animation,
        parameters: {
          ...params,
          [key]: {
            ...params[key as keyof CircularAnimationParameters],
            [axis]: numValue
          }
        }
      });
    }
  };

  const handleCircularParamChange = (key: keyof CircularAnimationParameters, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const error = validateNumber(numValue);
    setErrors(prev => ({ ...prev, [key]: error }));

    if (!error) {
      onUpdate?.({
        ...animation,
        parameters: {
          ...animation.parameters,
          [key]: numValue
        }
      });
    }
  };

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (animation.type !== 'circular') return;

    onUpdate?.({
      ...animation,
      parameters: {
        ...animation.parameters,
        direction: e.target.value as 'clockwise' | 'counterclockwise'
      }
    });
  };

  const handleRandomBoundsChange = (boundType: 'min' | 'max', axis: keyof Position, value: string) => {
    if (animation.type !== 'random') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const params = animation.parameters as RandomAnimationParameters;
    onUpdate?.({
      ...animation,
      parameters: {
        ...params,
        bounds: {
          ...params.bounds,
          [boundType]: {
            ...params.bounds[boundType],
            [axis]: numValue
          }
        }
      }
    });
  };

  const handleCustomPointChange = (index: number, axis: keyof Position, value: string) => {
    if (animation.type !== 'custom') return;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const params = animation.parameters as CustomAnimationParameters;
    const newPoints = [...params.points];
    newPoints[index] = {
      ...newPoints[index],
      [axis]: numValue
    };

    onUpdate?.({
      ...animation,
      parameters: {
        ...params,
        points: newPoints
      }
    });
  };

  const addCustomPoint = () => {
    if (animation.type !== 'custom') return;

    const params = animation.parameters as CustomAnimationParameters;
    onUpdate?.({
      ...animation,
      parameters: {
        ...params,
        points: [...params.points, { x: 0, y: 0, z: 0 }]
      }
    });
  };

  const removeCustomPoint = (index: number) => {
    if (animation.type !== 'custom') return;

    const params = animation.parameters as CustomAnimationParameters;
    const newPoints = params.points.filter((_, i) => i !== index);
    onUpdate?.({
      ...animation,
      parameters: {
        ...params,
        points: newPoints
      }
    });
  };

  const applyPreset = (preset: AnimationPreset) => {
    onUpdate?.({
      ...animation,
      parameters: preset.parameters
    });
    setShowPresets(false);
  };

  const renderPositionInputs = (position: Position, onChange: (axis: keyof Position, value: string) => void, testId: string) => (
    <div className="position-inputs">
      {(['x', 'y', 'z'] as const).map(axis => (
        <div key={axis} className="position-input">
          <label>{axis.toUpperCase()}</label>
          <input
            type="number"
            value={position[axis]}
            onChange={e => onChange(axis, e.target.value)}
            step="0.1"
            data-testid={`${testId}-${axis}`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="animation-editor" data-testid="animation-editor">
      <div className="editor-header">
        <div className="basic-info">
          <input
            type="text"
            value={animation.name}
            onChange={handleNameChange}
            placeholder="Animation Name"
            className="name-input"
            data-testid="animation-name-input"
          />
          <select
            value={animation.type}
            disabled
            className="type-select"
            data-testid="animation-type-select"
          >
            <option value="linear">Linear</option>
            <option value="circular">Circular</option>
            <option value="random">Random</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="duration-input">
          <label>
            Duration (ms):
            <input
              type="number"
              value={animation.duration}
              onChange={handleDurationChange}
              min="0"
              step="100"
              data-testid="animation-duration-input"
            />
          </label>
          {errors.duration && (
            <span className="error" data-testid="duration-error">
              {errors.duration}
            </span>
          )}
        </div>
      </div>

      <div className="parameters-container">
        <div className="parameters-header">
          <h3>Parameters</h3>
          <button
            className="presets-button"
            onClick={() => setShowPresets(!showPresets)}
            data-testid="presets-button"
          >
            Presets
          </button>
        </div>

        {showPresets && (
          <div className="presets-menu" data-testid="presets-menu">
            <h4>Common Movements</h4>
            {defaultPresets[animation.type].map((preset, index) => (
              <button
                key={index}
                className="preset-option"
                onClick={() => applyPreset(preset)}
                data-testid={`preset-${index}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {animation.type === 'linear' && (
          <>
            <h4>Start Position</h4>
            {renderPositionInputs(
              (animation.parameters as LinearAnimationParameters).startPosition,
              (axis, value) => handlePositionChange('startPosition', axis, value),
              'start-position'
            )}

            <h4>End Position</h4>
            {renderPositionInputs(
              (animation.parameters as LinearAnimationParameters).endPosition,
              (axis, value) => handlePositionChange('endPosition', axis, value),
              'end-position'
            )}
          </>
        )}

        {animation.type === 'circular' && (
          <>
            <h4>Center Position</h4>
            {renderPositionInputs(
              (animation.parameters as CircularAnimationParameters).center,
              (axis, value) => handlePositionChange('center', axis, value),
              'center-position'
            )}

            <h4>Radius</h4>
            <input
              type="number"
              value={(animation.parameters as CircularAnimationParameters).radius}
              onChange={e => handleCircularParamChange('radius', e.target.value)}
              min="0"
              step="0.1"
              data-testid="radius-input"
            />
            {errors.radius && <span className="error">{errors.radius}</span>}

            <h4>Speed</h4>
            <input
              type="number"
              value={(animation.parameters as CircularAnimationParameters).speed}
              onChange={e => handleCircularParamChange('speed', e.target.value)}
              min="0"
              step="0.1"
              data-testid="speed-input"
            />
            {errors.speed && <span className="error">{errors.speed}</span>}

            <h4>Direction</h4>
            <select
              value={(animation.parameters as CircularAnimationParameters).direction}
              onChange={handleDirectionChange}
              data-testid="direction-select"
            >
              <option value="clockwise">Clockwise</option>
              <option value="counterclockwise">Counterclockwise</option>
            </select>
          </>
        )}

        {animation.type === 'random' && (
          <>
            <h4>Bounds</h4>
            <div className="bounds-inputs">
              <div>
                <h5>Minimum</h5>
                {renderPositionInputs(
                  (animation.parameters as RandomAnimationParameters).bounds.min,
                  (axis, value) => handleRandomBoundsChange('min', axis, value),
                  'min-bounds'
                )}
              </div>
              <div>
                <h5>Maximum</h5>
                {renderPositionInputs(
                  (animation.parameters as RandomAnimationParameters).bounds.max,
                  (axis, value) => handleRandomBoundsChange('max', axis, value),
                  'max-bounds'
                )}
              </div>
            </div>
          </>
        )}

        {animation.type === 'custom' && (
          <>
            <h4>Points</h4>
            <button
              className="add-point-button"
              onClick={addCustomPoint}
              data-testid="add-point-button"
            >
              Add Point
            </button>
            {(animation.parameters as CustomAnimationParameters).points.map((point, index) => (
              <div key={index} className="custom-point">
                <h5>Point {index + 1}</h5>
                {renderPositionInputs(
                  point,
                  (axis, value) => handleCustomPointChange(index, axis, value),
                  `point-${index}`
                )}
                <button
                  className="remove-point-button"
                  onClick={() => removeCustomPoint(index)}
                  data-testid={`remove-point-${index}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
