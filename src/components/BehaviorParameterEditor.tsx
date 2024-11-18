import React, { useCallback, useState } from 'react';
import type { BehaviorImplementation } from '../types/behaviors';
import { ParameterEditor } from './ParameterEditor';
import type { ParameterValidationError, ParameterMetadata } from '../types/parameters';
import './BehaviorParameterEditor.css';

interface BehaviorParameterEditorProps {
  behavior: BehaviorImplementation;
  onChange?: (errors: ParameterValidationError[]) => void;
}

export function BehaviorParameterEditor({ behavior, onChange }: BehaviorParameterEditorProps) {
  const [currentValues, setCurrentValues] = useState<Record<string, number>>(behavior.getParameters());
  const [validationErrors, setValidationErrors] = useState<ParameterValidationError[]>([]);
  
  const handleParameterChange = useCallback((name: string, value: number) => {
    setCurrentValues(prev => ({
      ...prev,
      [name]: value
    }));

    const errors = behavior.setParameters({
      ...currentValues,
      [name]: value
    });

    setValidationErrors(errors);
    onChange?.(errors);
  }, [behavior, currentValues, onChange]);
  
  const handleValidationError = useCallback((error: ParameterValidationError) => {
    setValidationErrors(prev => [...prev, error]);
    onChange?.([...validationErrors, error]);
  }, [validationErrors, onChange]);

  if (!behavior) {
    return (
      <div className="behavior-parameter-editor">
        <div className="no-behavior-selected">
          Select a behavior to edit its parameters
        </div>
      </div>
    );
  }

  const metadata = behavior.getParameterMetadata();

  return (
    <div className="behavior-parameter-editor">
      <div className="parameters-header">
        <h2>Parameters</h2>
        <div className="behavior-type">{behavior.constructor.name}</div>
      </div>

      <div className="parameters-grid">
        {Object.entries(metadata).map(([name, meta]) => (
          <div key={name} className="parameter-row">
            <ParameterEditor
              name={name}
              value={currentValues[name]}
              metadata={meta as ParameterMetadata}
              onChange={handleParameterChange}
              onValidationError={handleValidationError}
            />
          </div>
        ))}
      </div>
      
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
};
