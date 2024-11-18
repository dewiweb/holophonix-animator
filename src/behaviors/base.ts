import type { Position, AEDPosition } from '../types/behaviors';
import { ParameterDefinitions, ParameterValidationError } from '../types/parameters';
import { ParameterValidator } from './validation';

export interface BehaviorImplementation {
    update(time: number): Position | AEDPosition;
    reset(): void;
    setParameters(params: Record<string, number>): ParameterValidationError[];
    getParameters(): Record<string, number>;
    getParameterMetadata(): ParameterDefinitions;
    usesAED(): boolean;
    validate(): ParameterValidationError[];
}

export abstract class BaseBehavior implements BehaviorImplementation {
    protected parameters: Record<string, number>;
    protected startTime: number;
    protected useAED: boolean;
    protected validator: ParameterValidator;
    private parameterDefinitions: ParameterDefinitions;

    constructor(parameterDefinitions: ParameterDefinitions, useAED: boolean = false) {
        this.validator = new ParameterValidator(parameterDefinitions);
        this.parameterDefinitions = parameterDefinitions;
        this.parameters = {};
        this.startTime = Date.now();
        this.useAED = useAED;

        // Initialize all parameters with default values
        Object.entries(parameterDefinitions).forEach(([name, def]) => {
            this.parameters[name] = def.default;
        });
    }

    abstract update(time: number): Position | AEDPosition;

    reset(): void {
        this.startTime = Date.now();
        // Reset all parameters to defaults
        Object.entries(this.parameterDefinitions).forEach(([name, def]) => {
            this.parameters[name] = def.default;
        });
    }

    setParameters(params: Record<string, number>): ParameterValidationError[] {
        // Merge with existing parameters to ensure all required parameters exist
        const mergedParams = { ...this.parameters, ...params };
        const errors = this.validator.validateParameters(mergedParams);
        
        if (errors.length === 0) {
            // Update parameters with validated and clamped values
            Object.entries(mergedParams).forEach(([name, value]) => {
                this.parameters[name] = this.validator.clampValue(name, value);
            });
        }
        
        return errors;
    }

    getParameters(): Record<string, number> {
        // Ensure all parameters have values
        const params = { ...this.parameters };
        Object.entries(this.parameterDefinitions).forEach(([name, def]) => {
            if (params[name] === undefined) {
                params[name] = def.default;
            }
        });
        return params;
    }

    getParameterMetadata(): ParameterDefinitions {
        return this.validator.getAllMetadata();
    }

    usesAED(): boolean {
        return this.useAED;
    }

    validate(): ParameterValidationError[] {
        return this.validator.validateParameters(this.parameters);
    }

    protected getElapsedTime(time: number): number {
        return (time - this.startTime) / 1000;
    }
}
