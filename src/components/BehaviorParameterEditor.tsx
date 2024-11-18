import React, { useCallback, useState } from 'react';
import { BehaviorImplementation } from '../types/behaviors';
import { ParameterEditor } from './ParameterEditor';
import { ParameterValidationError } from '../types/parameters';
import './BehaviorParameterEditor.css';

interface BehaviorParameterEditorProps {
    behavior?: BehaviorImplementation;
    onChange?: (validationErrors: ParameterValidationError[]) => void;
}

export const BehaviorParameterEditor: React.FC<BehaviorParameterEditorProps> = ({
    behavior,
    onChange
}) => {
    const [validationErrors, setValidationErrors] = useState<ParameterValidationError[]>([]);
    
    const handleParameterChange = useCallback((name: string, value: number) => {
        if (!behavior) return;
        const errors = behavior.setParameters({ [name]: value });
        setValidationErrors(errors);
        onChange?.(errors);
    }, [behavior, onChange]);
    
    const handleValidationError = useCallback((error: ParameterValidationError | null) => {
        setValidationErrors(prev => {
            const filtered = prev.filter(e => e.parameter !== error?.parameter);
            return error ? [...filtered, error] : filtered;
        });
    }, []);

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
    const currentValues = behavior.getParameters();

    return (
        <div className="behavior-parameter-editor">
            <div className="parameters-header">
                <h2>Parameters</h2>
                <div className="behavior-type">{behavior.constructor.name}</div>
            </div>

            <div className="parameters-grid">
                {Object.entries(metadata).map(([name, meta]) => (
                    <ParameterEditor
                        key={name}
                        name={name}
                        value={currentValues[name]}
                        metadata={meta}
                        onChange={handleParameterChange}
                        onValidationError={handleValidationError}
                    />
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
