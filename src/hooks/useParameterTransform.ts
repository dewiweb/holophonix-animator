import { useCallback } from 'react';
import { ParameterTransform } from '../utils/parameter-transforms';
import { 
  ParameterMetadata, 
  ParameterValue,
  ParameterValidationError,
  ParameterUnit
} from '../types/parameters';
import { useParameterValidation } from './useParameterValidation';

interface TransformResult {
  value: ParameterValue;
  displayValue: string;
  isValid: boolean;
  error?: ParameterValidationError;
}

interface UseParameterTransformResult {
  transformValue: (paramName: string, value: ParameterValue) => TransformResult;
  parseInput: (paramName: string, input: string) => TransformResult;
  formatValue: (paramName: string, value: ParameterValue) => string;
  normalizeValue: (paramName: string, value: number) => number;
  denormalizeValue: (paramName: string, normalized: number) => number;
}

export function useParameterTransform(parameterDefinitions: Record<string, ParameterMetadata>): UseParameterTransformResult {
  const { validateValue, getMetadata } = useParameterValidation(parameterDefinitions);

  const transformValue = useCallback(
    (paramName: string, value: ParameterValue): TransformResult => {
      const metadata = getMetadata(paramName);
      if (!metadata) {
        return {
          value,
          displayValue: String(value),
          isValid: false,
          error: {
            code: 'INVALID_PARAMETER',
            parameter: paramName,
            message: `Unknown parameter: ${paramName}`
          }
        };
      }

      const validation = validateValue(paramName, value);
      const displayValue = typeof value === 'number' 
        ? ParameterTransform.format(value, metadata.unit ?? ParameterUnit.NONE, {
            precision: metadata.precision ?? 2
          })
        : String(value);

      return {
        value,
        displayValue,
        isValid: validation.isValid,
        error: validation.errors[0]
      };
    },
    [validateValue, getMetadata]
  );

  const parseInput = useCallback(
    (paramName: string, input: string): TransformResult => {
      const metadata = getMetadata(paramName);
      if (!metadata) {
        return {
          value: input,
          displayValue: input,
          isValid: false,
          error: {
            code: 'INVALID_PARAMETER',
            parameter: paramName,
            message: `Unknown parameter: ${paramName}`
          }
        };
      }

      try {
        let parsedValue: ParameterValue;

        switch (metadata.type) {
          case 'numeric':
            parsedValue = ParameterTransform.parse(input, metadata.unit ?? ParameterUnit.NONE);
            if (metadata.step) {
              parsedValue = ParameterTransform.snap(parsedValue as number, metadata.step);
            }
            break;
          case 'boolean':
            parsedValue = input.toLowerCase() === 'true';
            break;
          case 'enum':
            if (!metadata.options?.includes(input)) {
              throw new Error(`Invalid option. Must be one of: ${metadata.options?.join(', ')}`);
            }
            parsedValue = input;
            break;
          default:
            parsedValue = input;
        }

        const validation = validateValue(paramName, parsedValue);
        return {
          value: parsedValue,
          displayValue: input,
          isValid: validation.isValid,
          error: validation.errors[0]
        };
      } catch (err) {
        return {
          value: input,
          displayValue: input,
          isValid: false,
          error: {
            code: 'INVALID_FORMAT',
            parameter: paramName,
            message: err instanceof Error ? err.message : 'Invalid input format'
          }
        };
      }
    },
    [validateValue, getMetadata]
  );

  const formatValue = useCallback(
    (paramName: string, value: ParameterValue): string => {
      const metadata = getMetadata(paramName);
      if (!metadata || typeof value !== 'number') {
        return String(value);
      }

      return ParameterTransform.format(value, metadata.unit ?? ParameterUnit.NONE, {
        precision: metadata.precision ?? 2
      });
    },
    [getMetadata]
  );

  const normalizeValue = useCallback(
    (paramName: string, value: number): number => {
      const metadata = getMetadata(paramName);
      if (!metadata || metadata.type !== 'numeric' || metadata.min === undefined || metadata.max === undefined) {
        return value;
      }

      return ParameterTransform.normalize(value, metadata.min, metadata.max, {
        clamp: true
      });
    },
    [getMetadata]
  );

  const denormalizeValue = useCallback(
    (paramName: string, normalized: number): number => {
      const metadata = getMetadata(paramName);
      if (!metadata || metadata.type !== 'numeric' || metadata.min === undefined || metadata.max === undefined) {
        return normalized;
      }

      return ParameterTransform.denormalize(normalized, metadata.min, metadata.max, {
        clamp: true
      });
    },
    [getMetadata]
  );

  return {
    transformValue,
    parseInput,
    formatValue,
    normalizeValue,
    denormalizeValue
  };
}
