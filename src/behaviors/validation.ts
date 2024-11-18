import { ParameterMetadata, ParameterValidationError, ParameterDefinitions } from '../types/parameters';

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
    getDefaultValues(): Record<string, number> {
        const defaults: Record<string, number> = {};
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

        // Clamp to range
        const clampedValue = Math.min(Math.max(value, definition.min), definition.max);

        // For hertz values, round to 3 decimal places (millihertz precision)
        if (definition.unit === 'hertz') {
            return Math.round(clampedValue * 1000) / 1000;
        }

        // For other values, snap to nearest step
        const steps = Math.round((clampedValue - definition.min) / definition.step);
        return definition.min + (steps * definition.step);
    }

    /**
     * Validates a single parameter value against its definition
     */
    validateParameter(name: string, value: number): ParameterValidationError | null {
        const definition = this.definitions[name];
        if (!definition) {
            throw new Error(`No definition found for parameter: ${name}`);
        }

        // Check type
        if (typeof value !== 'number' || isNaN(value)) {
            return {
                parameter: name,
                value,
                message: `Parameter ${name} must be a valid number`,
                code: 'INVALID_TYPE'
            };
        }

        // Check range
        if (value < definition.min || value > definition.max) {
            return {
                parameter: name,
                value,
                message: `Parameter ${name} must be between ${definition.min} and ${definition.max} ${definition.unit}`,
                code: 'OUT_OF_RANGE'
            };
        }

        // Special handling for hertz values
        if (definition.unit === 'hertz') {
            // Round to 3 decimal places (millihertz precision)
            const roundedValue = Math.round(value * 1000) / 1000;
            
            // Check if the value is within reasonable precision
            if (Math.abs(value - roundedValue) > 0.0001) {
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
        const steps = Math.round((value - definition.min) / definition.step);
        const nearestValidValue = definition.min + (steps * definition.step);
        const epsilon = 1e-10; // Account for floating point precision
        
        if (Math.abs(value - nearestValidValue) > epsilon) {
            return {
                parameter: name,
                value,
                message: `Parameter ${name} must be in steps of ${definition.step} ${definition.unit}`,
                code: 'INVALID_STEP'
            };
        }

        return null;
    }

    /**
     * Validates all parameters in a parameter set
     */
    validateParameters(params: Record<string, number>): ParameterValidationError[] {
        const errors: ParameterValidationError[] = [];

        // Check for missing required parameters
        for (const name of Object.keys(this.definitions)) {
            if (params[name] === undefined) {
                errors.push({
                    parameter: name,
                    value: undefined as any,
                    message: `Missing required parameter: ${name}`,
                    code: 'INVALID_TYPE'
                });
            }
        }

        // Validate provided parameters
        for (const [name, value] of Object.entries(params)) {
            if (value !== undefined) {
                const error = this.validateParameter(name, value);
                if (error) {
                    errors.push(error);
                }
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
