import { 
  ParameterMetadata, 
  ParameterDefinitions,
  ParameterValidationError,
  isNumericParameter,
  isEnumParameter,
  isBooleanParameter
} from '../types/parameters';

export class BehaviorParameterValidator {
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
  getDefaultValues(): Record<string, number | string | boolean> {
    const defaults: Record<string, number | string | boolean> = {};
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

    if (isEnumParameter(definition) || isBooleanParameter(definition)) {
      throw new Error(`Cannot clamp enum or boolean parameter: ${name}`);
    }

    const numDef = definition as ParameterMetadata;

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
  validateParameterValue(
    name: string, 
    value: number | string | boolean,
    metadata: ParameterMetadata
  ): ParameterValidationError | null {
    if (isNumericParameter(metadata)) {
      if (typeof value !== 'number') {
        return {
          parameter: name,
          value,
          message: `Invalid type for ${name}. Expected number, got ${typeof value}`,
          code: 'INVALID_TYPE'
        };
      }
      
      if (value < metadata.min || value > metadata.max) {
        return {
          parameter: name,
          value,
          message: `Value ${value} is out of range [${metadata.min}, ${metadata.max}] for ${name}`,
          code: 'INVALID_RANGE'
        };
      }
    } else if (isEnumParameter(metadata)) {
      if (typeof value !== 'string') {
        return {
          parameter: name,
          value,
          message: `Invalid type for ${name}. Expected string, got ${typeof value}`,
          code: 'INVALID_TYPE'
        };
      }
      
      if (!metadata.values.includes(value)) {
        return {
          parameter: name,
          value,
          message: `Invalid enum value for ${name}. Must be one of: ${metadata.values.join(', ')}`,
          code: 'INVALID_ENUM'
        };
      }
    } else if (isBooleanParameter(metadata)) {
      if (typeof value !== 'boolean') {
        return {
          parameter: name,
          value,
          message: `Invalid type for ${name}. Expected boolean, got ${typeof value}`,
          code: 'INVALID_TYPE'
        };
      }
    }

    return null;
  }

  /**
   * Validates a single parameter value against its definition
   */
  validateParameter(name: string, value: number | string | boolean): ParameterValidationError | null {
    const definition = this.definitions[name];
    if (!definition) {
      throw new Error(`No definition found for parameter: ${name}`);
    }

    return this.validateParameterValue(name, value, definition);
  }

  /**
   * Validates all parameters in a parameter set
   */
  validateParameters(parameters: Record<string, number | string | boolean>): ParameterValidationError[] {
    const errors: ParameterValidationError[] = [];

    for (const [name, value] of Object.entries(parameters)) {
      const definition = this.definitions[name];
      if (!definition) {
        errors.push({
          parameter: name,
          value,
          message: `Unknown parameter: ${name}`,
          code: 'INVALID_TYPE'
        });
        continue;
      }

      const error = this.validateParameterValue(name, value, definition);
      if (error) {
        errors.push(error);
      }
    }

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
}
