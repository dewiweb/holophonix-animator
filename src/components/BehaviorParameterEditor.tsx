import React, { useCallback, useState, useEffect } from 'react';
import type { BehaviorImplementation } from '../types/behaviors';
import { ParameterEditor } from './ParameterEditor';
import type { 
  ParameterValidationError, 
  ParameterMetadata,
  ParameterValue,
  ParameterGroup
} from '../types/parameters';
import { cn } from '../utils/styles';
import './BehaviorParameterEditor.css';

interface BehaviorParameterEditorProps {
  behavior: BehaviorImplementation;
  onChange?: (errors: ParameterValidationError[]) => void;
  onParameterChange?: (name: string, value: ParameterValue) => void;
  disabled?: boolean;
  className?: string;
}

interface ParameterState {
  value: ParameterValue;
  isValid: boolean;
  error: ParameterValidationError | null;
}

export function BehaviorParameterEditor({ 
  behavior, 
  onChange,
  onParameterChange,
  disabled = false,
  className 
}: BehaviorParameterEditorProps) {
  const [parameterStates, setParameterStates] = useState<Record<string, ParameterState>>({});
  const [validationErrors, setValidationErrors] = useState<ParameterValidationError[]>([]);
  const [groups, setGroups] = useState<ParameterGroup[]>([]);
  
  // Initialize parameter states
  useEffect(() => {
    if (!behavior) return;
    
    const currentValues = behavior.getParameters();
    const metadata = behavior.getParameterMetadata();
    const paramGroups = behavior.getParameterGroups?.() ?? [];
    
    const states: Record<string, ParameterState> = {};
    Object.entries(currentValues).forEach(([name, value]) => {
      states[name] = {
        value,
        isValid: true,
        error: null
      };
    });
    
    setParameterStates(states);
    setGroups(paramGroups);
  }, [behavior]);

  const handleParameterChange = useCallback((name: string, value: ParameterValue) => {
    setParameterStates(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value
      }
    }));

    try {
      behavior.setParameters({
        ...Object.fromEntries(
          Object.entries(parameterStates).map(([key, state]) => [key, state.value])
        ),
        [name]: value
      });

      setParameterStates(prev => ({
        ...prev,
        [name]: {
          value,
          isValid: true,
          error: null
        }
      }));

      setValidationErrors([]);
      onChange?.([]);
      onParameterChange?.(name, value);
    } catch (error) {
      const validationError = error as ParameterValidationError;
      setParameterStates(prev => ({
        ...prev,
        [name]: {
          value,
          isValid: false,
          error: validationError
        }
      }));

      setValidationErrors([validationError]);
      onChange?.([validationError]);
    }
  }, [behavior, parameterStates, onChange, onParameterChange]);
  
  const handleValidationError = useCallback((name: string, error: ParameterValidationError | null) => {
    setParameterStates(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        isValid: !error,
        error
      }
    }));

    setValidationErrors(prev => 
      error ? [...prev.filter(e => e.parameter !== name), error] : prev.filter(e => e.parameter !== name)
    );
    
    onChange?.(validationErrors);
  }, [validationErrors, onChange]);

  if (!behavior) {
    return (
      <div className={cn("behavior-parameter-editor", "empty", className)}>
        <div className="no-behavior-selected">
          Select a behavior to edit its parameters
        </div>
      </div>
    );
  }

  const metadata = behavior.getParameterMetadata();
  const ungroupedParams = Object.keys(metadata).filter(
    param => !groups.some(group => group.parameters.includes(param))
  );

  return (
    <div className={cn("behavior-parameter-editor", className)}>
      <div className="parameters-header">
        <h2>Parameters</h2>
        <div className="behavior-type">{behavior.constructor.name}</div>
      </div>

      {groups.map(group => (
        <div key={group.name} className="parameter-group">
          <h3 className="group-header">{group.name}</h3>
          {group.description && (
            <p className="group-description">{group.description}</p>
          )}
          <div className="parameters-grid">
            {group.parameters.map(name => {
              const state = parameterStates[name];
              return (
                <div key={name} className="parameter-row">
                  <ParameterEditor
                    paramName={name}
                    value={state?.value}
                    metadata={metadata[name]}
                    onChange={value => handleParameterChange(name, value)}
                    onError={error => handleValidationError(name, error)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {ungroupedParams.length > 0 && (
        <div className="parameter-group">
          <div className="parameters-grid">
            {ungroupedParams.map(name => {
              const state = parameterStates[name];
              return (
                <div key={name} className="parameter-row">
                  <ParameterEditor
                    paramName={name}
                    value={state?.value}
                    metadata={metadata[name]}
                    onChange={value => handleParameterChange(name, value)}
                    onError={error => handleValidationError(name, error)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Validation Errors</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index} className="validation-error">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
