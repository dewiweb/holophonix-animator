import React, { useCallback, useMemo, useState } from 'react';
import { ParameterGroup as ParameterGroupType } from '../types/parameter-groups';
import { ParameterEditor } from './ParameterEditor';
import { useParameterValidation } from '../hooks/useParameterValidation';
import { useParameterTransform } from '../hooks/useParameterTransform';
import { cn } from '../utils/styles';

interface ParameterGroupProps {
  group: ParameterGroupType;
  values: Record<string, number | string | boolean>;
  onChange: (paramName: string, value: number | string | boolean) => void;
  onValidate?: (isValid: boolean) => void;
  disabled?: boolean;
  presetId?: string;
  className?: string;
}

export function ParameterGroup({
  group,
  values,
  onChange,
  onValidate,
  disabled = false,
  presetId,
  className
}: ParameterGroupProps) {
  // Track validation state for each parameter
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});
  
  // Get ordered parameter names
  const parameterNames = useMemo(
    () => group.order || Object.keys(group.parameters),
    [group]
  );

  // Setup validation
  const { validateGroup, hasRequiredParameters } = useParameterValidation(group.parameters);

  // Setup parameter transforms
  const { transformValue } = useParameterTransform(group.parameters);

  // Handle individual parameter validation
  const handleValidate = useCallback(
    (paramName: string, isValid: boolean) => {
      setValidationState(prev => {
        const next = { ...prev, [paramName]: isValid };
        
        // Check if all parameters are valid
        const allValid = parameterNames.every(name => next[name] !== false);
        const hasRequired = hasRequiredParameters(values);
        
        onValidate?.(allValid && hasRequired);
        return next;
      });
    },
    [parameterNames, values, hasRequiredParameters, onValidate]
  );

  // Handle parameter change with validation
  const handleChange = useCallback(
    (paramName: string, value: number | string | boolean) => {
      const result = transformValue(paramName, value);
      if (result.isValid) {
        onChange(paramName, result.value);
      }
    },
    [onChange, transformValue]
  );

  // Group-level validation result
  const groupValidation = useMemo(
    () => validateGroup(values),
    [validateGroup, values]
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="border-b border-gray-200 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
          {presetId && (
            <span className="text-sm text-gray-500">
              Preset: {presetId}
            </span>
          )}
        </div>
        {group.description && (
          <p className="mt-1 text-sm text-gray-500">{group.description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {parameterNames.map(paramName => {
          const metadata = group.parameters[paramName];
          if (!metadata) return null;

          return (
            <div key={paramName} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {metadata.name}
              </label>
              <ParameterEditor
                metadata={metadata}
                paramName={paramName}
                value={values[paramName] ?? metadata.defaultValue}
                onChange={(value) => handleChange(paramName, value)}
                onValidate={(isValid) => handleValidate(paramName, isValid)}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>

      {groupValidation.errors.length > 0 && (
        <div className="mt-2 text-sm text-red-500">
          <ul className="list-disc list-inside">
            {groupValidation.errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
