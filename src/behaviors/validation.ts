import { ParameterDefinitions, ParameterValidationError, ParameterMetadata, NumericParameterMetadata, EnumParameterMetadata } from '../types/parameters';

export class ParameterValidator {
  private definitions: ParameterDefinitions;

  constructor(definitions: ParameterDefinitions) {
    this.definitions = definitions;
  }

  /**
   * Get all parameter metadata
   */
  getAllMetadata(): ParameterDefinitions {
    return { ...this.definitions };
  }

  /**
   * Get default values for all parameters
   */
  getDefaultValues(): Record<string, number | string> {
    const defaults: Record<string, number | string> = {};
    for (const [name, def] of Object.entries(this.definitions)) {
      defaults[name] = def.default;
    }
    return defaults;
  }

  /**
   * Clamp a value to its valid range and step
   */
  clampValue(name: string, value: number): number {
    const definition = this.definitions[name];
    if (!definition) {
      throw new Error(`No definition found for parameter: ${name}`);
    }

    if (this.isEnumParameter(definition)) {
      throw new Error(`Cannot clamp enum parameter: ${name}`);
    }

    const numDef = definition as NumericParameterMetadata;

    // Clamp to range
    const clampedValue = Math.min(Math.max(value, numDef.min), numDef.max);

    // For hertz values, round to 3 decimal places (millihertz precision)
    if (numDef.unit === 'hertz') {
      return Math.round(clampedValue * 1000) / 1000;
    }

    // For other values, snap to nearest step
    const steps = Math.round((clampedValue - numDef.min) / numDef.step);
    return numDef.min + (steps * numDef.step);
  }

  /**
   * Validates a single parameter value against its definition
   */
  validateParameter(name: string, value: number | string): ParameterValidationError | null {
    const definition = this.definitions[name];
    if (!definition) {
      throw new Error(`No definition found for parameter: ${name}`);
    }

    if (this.isEnumParameter(definition)) {
      if (typeof value !== 'string') {
        return {
          parameter: name,
          value,
          message: `Parameter ${name} must be a string enum value`,
          code: 'INVALID_TYPE'
        };
      } else if (!definition.enum.includes(value)) {
        return {
          parameter: name,
          value,
          message: `Invalid enum value for ${name}. Must be one of: ${definition.enum.join(', ')}`,
          code: 'INVALID_ENUM'
        };
      }
      return null;
    }

    if (typeof value !== 'number') {
      return {
        parameter: name,
        value,
        message: `Parameter ${name} must be a number`,
        code: 'INVALID_TYPE'
      };
    }

    const numValue = value as number;
    const numDef = definition as NumericParameterMetadata;

    // Check range
    if (numValue < numDef.min || numValue > numDef.max) {
      return {
        parameter: name,
        value: numValue,
        message: `Value out of range for ${name}. Must be between ${numDef.min} and ${numDef.max}`,
        code: 'OUT_OF_RANGE'
      };
    }

    // Special handling for hertz values
    if (numDef.unit === 'hertz') {
      // Round to 3 decimal places (millihertz precision)
      const roundedValue = Math.round(numValue * 1000) / 1000;
      
      // Check if the value is within reasonable precision
      if (Math.abs(numValue - roundedValue) > 0.0001) {
        return {
          parameter: name,
          value,
          message: `Parameter ${name} must have at most 3 decimal places`,
          code: 'INVALID_STEP'
        };
      }
      return null;
    }

    // For other units, check step size
    if (numDef.step !== 0) {
      const steps = Math.round((numValue - numDef.min) / numDef.step);
      const validValue = numDef.min + (steps * numDef.step);
      if (Math.abs(validValue - numValue) > 1e-10) {
        return {
          parameter: name,
          value: numValue,
          message: `Invalid step value for ${name}. Must be a multiple of ${numDef.step} from ${numDef.min}`,
          code: 'INVALID_STEP'
        };
      }
    }

    return null;
  }

  /**
   * Validates all parameters in a parameter set
   */
  validate(parameters: Record<string, number | string>): ParameterValidationError[] {
    const errors: ParameterValidationError[] = [];

    Object.entries(parameters).forEach(([name, value]) => {
      const definition = this.definitions[name];
      if (!definition) {
        errors.push({
          parameter: name,
          value,
          message: `Unknown parameter: ${name}`,
          code: 'INVALID_TYPE'
        });
        return;
      }

      if (this.isEnumParameter(definition)) {
        if (typeof value !== 'string') {
          errors.push({
            parameter: name,
            value,
            message: `Parameter ${name} must be a string enum value`,
            code: 'INVALID_TYPE'
          });
        } else if (!definition.enum.includes(value)) {
          errors.push({
            parameter: name,
            value,
            message: `Invalid enum value for ${name}. Must be one of: ${definition.enum.join(', ')}`,
            code: 'INVALID_ENUM'
          });
        }
      } else {
        if (typeof value !== 'number') {
          errors.push({
            parameter: name,
            value,
            message: `Parameter ${name} must be a number`,
            code: 'INVALID_TYPE'
          });
          return;
        }

        const numValue = value as number;
        const numDef = definition as NumericParameterMetadata;

        if (numValue < numDef.min || numValue > numDef.max) {
          errors.push({
            parameter: name,
            value: numValue,
            message: `Value out of range for ${name}. Must be between ${numDef.min} and ${numDef.max}`,
            code: 'OUT_OF_RANGE'
          });
        }

        if (numDef.step !== 0) {
          const steps = Math.round((numValue - numDef.min) / numDef.step);
          const validValue = numDef.min + (steps * numDef.step);
          if (Math.abs(validValue - numValue) > 1e-10) {
            errors.push({
              parameter: name,
              value: numValue,
              message: `Invalid step value for ${name}. Must be a multiple of ${numDef.step} from ${numDef.min}`,
              code: 'INVALID_STEP'
            });
          }
        }
      }
    });

    return errors;
  }

  /**
   * Returns metadata for a parameter
   */
  getMetadata(name: string): ParameterMetadata {
    const definition = this.definitions[name];
    if (!definition) {
      throw new Error(`No definition found for parameter: ${name}`);
    }
    return { ...definition };
  }

  private isEnumParameter(def: ParameterMetadata): def is EnumParameterMetadata {
    return 'enum' in def && Array.isArray(def.enum);
  }
}
