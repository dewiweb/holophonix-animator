import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ParameterMetadata,
  NumericParameterMetadata,
  EnumParameterMetadata,
  BooleanParameterMetadata,
  ParameterUnit,
  ParameterValue,
  ParameterValidationError
} from '../types/parameters';
import { useParameterTransform } from '../hooks/useParameterTransform';
import { useParameterValidation } from '../hooks/useParameterValidation';
import { cn } from '../utils/styles';
import './ParameterEditor.css';

interface ParameterEditorProps {
  metadata: ParameterMetadata;
  paramName: string;
  value: ParameterValue;
  onChange: (value: ParameterValue) => void;
  onValidate?: (isValid: boolean) => void;
  onError?: (error: ParameterValidationError | null) => void;
  disabled?: boolean;
  className?: string;
}

const UnitLabel: React.FC<{ unit: ParameterUnit; className?: string }> = ({ unit, className }) => {
  if (unit === ParameterUnit.NONE) return null;
  return <span className={cn("parameter-unit", className)}>{unit}</span>;
};

export function ParameterEditor({
  metadata,
  paramName,
  value,
  onChange,
  onValidate,
  onError,
  disabled = false,
  className,
}: ParameterEditorProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<ParameterValidationError | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, value: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const { transformValue, parseInput, normalizeValue, denormalizeValue } = useParameterTransform({
    [paramName]: metadata
  });

  const { validateValue } = useParameterValidation({
    [paramName]: metadata
  });

  // Format the value for display
  useEffect(() => {
    const result = transformValue(paramName, value);
    setDisplayValue(result.displayValue);
    setIsValid(result.isValid);
    setError(result.error ?? null);
    onValidate?.(result.isValid);
    onError?.(result.error ?? null);
  }, [value, metadata, paramName, transformValue, onValidate, onError]);

  // Handle input changes
  const handleChange = useCallback(
    (input: string) => {
      setDisplayValue(input);
      const result = parseInput(paramName, input);
      
      setIsValid(result.isValid);
      setError(result.error ?? null);
      onValidate?.(result.isValid);
      onError?.(result.error ?? null);

      if (result.isValid) {
        onChange(result.value);
      }
    },
    [paramName, parseInput, onChange, onValidate, onError]
  );

  // Handle numeric keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (metadata.type !== 'numeric' || disabled) return;

      const numericMeta = metadata as NumericParameterMetadata;
      const step = e.shiftKey ? (numericMeta.step * 10) : numericMeta.step;
      const currentValue = Number(value);

      let newValue = currentValue;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newValue = Math.min(numericMeta.max, currentValue + step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newValue = Math.max(numericMeta.min, currentValue - step);
          break;
        case 'PageUp':
          e.preventDefault();
          newValue = Math.min(numericMeta.max, currentValue + step * 10);
          break;
        case 'PageDown':
          e.preventDefault();
          newValue = Math.max(numericMeta.min, currentValue - step * 10);
          break;
        case 'Home':
          e.preventDefault();
          newValue = numericMeta.min;
          break;
        case 'End':
          e.preventDefault();
          newValue = numericMeta.max;
          break;
      }

      if (newValue !== currentValue) {
        const validation = validateValue(paramName, newValue);
        if (validation.isValid) {
          onChange(newValue);
        }
      }
    },
    [metadata, disabled, value, paramName, validateValue, onChange]
  );

  // Handle drag interaction for numeric parameters
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (metadata.type !== 'numeric' || disabled) return;

      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        value: Number(value)
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const numericMeta = metadata as NumericParameterMetadata;
        const dx = e.clientX - dragStart.x;
        const sensitivity = e.shiftKey ? 0.01 : 0.1;
        const delta = dx * sensitivity * numericMeta.step;
        const newValue = Math.max(
          numericMeta.min,
          Math.min(numericMeta.max, dragStart.value + delta)
        );

        const validation = validateValue(paramName, newValue);
        if (validation.isValid) {
          onChange(newValue);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [metadata, disabled, value, dragStart, isDragging, paramName, validateValue, onChange]
  );

  const renderInput = () => {
    switch (metadata.type) {
      case 'numeric':
        return (
          <div 
            className={cn(
              "parameter-numeric-container",
              isDragging && "dragging",
              !isValid && "invalid",
              disabled && "disabled"
            )}
            onMouseDown={handleMouseDown}
          >
            <input
              ref={inputRef}
              type="text"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className={cn(
                "parameter-input",
                "numeric",
                !isValid && "invalid",
                isDragging && "dragging"
              )}
            />
            <UnitLabel unit={metadata.unit} className="numeric-unit" />
          </div>
        );

      case 'enum':
        const enumMeta = metadata as EnumParameterMetadata;
        return (
          <select
            value={String(value)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={cn("parameter-input", "enum")}
          >
            {enumMeta.values.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(String(e.target.checked))}
            disabled={disabled}
            className={cn("parameter-input", "boolean")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className={cn(
        "parameter-editor",
        `type-${metadata.type}`,
        !isValid && "invalid",
        disabled && "disabled",
        className
      )}
    >
      <label className="parameter-label">
        {metadata.label || paramName}
        {metadata.description && (
          <span className="parameter-description" title={metadata.description}>
            ℹ️
          </span>
        )}
      </label>
      {renderInput()}
      {error && <div className="parameter-error">{error.message}</div>}
    </div>
  );
}
