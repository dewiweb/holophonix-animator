import React, { useCallback } from 'react';
import { ParameterMetadata, ParameterValidationError } from '../types/parameters';
import { Fader } from './Fader';

interface ParameterEditorProps {
    name: string;
    value: number;
    metadata: ParameterMetadata;
    onChange: (name: string, value: number) => void;
    onValidationError?: (error: ParameterValidationError | null) => void;
}

export const ParameterEditor: React.FC<ParameterEditorProps> = ({
    name,
    value,
    metadata,
    onChange,
    onValidationError
}) => {
    const handleChange = useCallback((newValue: number) => {
        onChange(name, newValue);
    }, [name, onChange]);

    const handleValidationError = useCallback((error: string | null) => {
        if (error) {
            // Map generic validation error to specific type
            let code: ParameterValidationError['code'] = 'INVALID_TYPE';
            
            if (error.includes('between')) {
                code = 'OUT_OF_RANGE';
            } else if (error.includes('steps')) {
                code = 'INVALID_STEP';
            }

            onValidationError?.({
                parameter: name,
                value,
                message: error,
                code
            });
        } else {
            onValidationError?.(null);
        }
    }, [name, value, onValidationError]);

    return (
        <Fader
            value={value}
            min={metadata.min}
            max={metadata.max}
            step={metadata.step}
            unit={metadata.unit}
            label={name}
            description={metadata.description}
            defaultValue={metadata.default}
            onChange={handleChange}
            onValidationError={handleValidationError}
        />
    );
};
