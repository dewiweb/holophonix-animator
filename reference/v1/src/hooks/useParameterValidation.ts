import { useMemo, useCallback } from 'react';
import { 
  ParameterMetadata, 
  ParameterValidationError,
  BehaviorParameterValidator,
  ParameterDefinitions 
} from '../types/parameters';

interface ValidationResult {
  isValid: boolean;
  errors: ParameterValidationError[];
}

interface UseParameterValidationResult {
  validateValue: (
    paramName: string,
    value: unknown
  ) => ValidationResult;
  validateGroup: (
    values: Record<string, unknown>
  ) => ValidationResult;
  getMetadata: (paramName: string) => ParameterMetadata | undefined;
  hasRequiredParameters: (values: Record<string, unknown>) => boolean;
}

export function useParameterValidation(
  parameterDefinitions: ParameterDefinitions
): UseParameterValidationResult {
  // Create validator instance (memoized)
  const validator = useMemo(
    () => new BehaviorParameterValidator(parameterDefinitions),
    [parameterDefinitions]
  );

  // Get parameter metadata
  const getMetadata = useCallback(
    (paramName: string) => parameterDefinitions[paramName],
    [parameterDefinitions]
  );

  // Validate single parameter value
  const validateValue = useCallback(
    (paramName: string, value: unknown): ValidationResult => {
      const metadata = parameterDefinitions[paramName];
      if (!metadata) {
        return {
          isValid: false,
          errors: [{
            code: 'INVALID_PARAMETER',
            parameter: paramName,
            message: `Unknown parameter: ${paramName}`
          }]
        };
      }

      const error = validator.validateParameterValue(paramName, value, metadata);
      return {
        isValid: !error,
        errors: error ? [error] : []
      };
    },
    [validator, parameterDefinitions]
  );

  // Validate entire parameter group
  const validateGroup = useCallback(
    (values: Record<string, unknown>): ValidationResult => {
      const errors = validator.validateParameters(values);
      return {
        isValid: errors.length === 0,
        errors
      };
    },
    [validator]
  );

  // Check if all required parameters are present
  const hasRequiredParameters = useCallback(
    (values: Record<string, unknown>): boolean => {
      const requiredParams = Object.entries(parameterDefinitions)
        .filter(([_, def]) => def.required)
        .map(([name]) => name);

      return requiredParams.every(param => param in values);
    },
    [parameterDefinitions]
  );

  return {
    validateValue,
    validateGroup,
    getMetadata,
    hasRequiredParameters
  };
}
