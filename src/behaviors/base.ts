import { 
  ParameterDefinitions,
  ParameterMetadata,
  ParameterValidationError,
  BehaviorParameterValidator,
  ParameterValue
} from '../types/parameters';
import { HolophonixPosition, XYZPosition } from '../types/position';

export class BehaviorError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BehaviorError';
  }
}

export class BehaviorValidationError extends BehaviorError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'BehaviorValidationError';
  }
}

export class BehaviorExecutionError extends BehaviorError {
  constructor(message: string) {
    super(message, 'EXECUTION_ERROR');
    this.name = 'BehaviorExecutionError';
  }
}

export interface BehaviorLifecycle {
  onInit?(): void;
  onDestroy?(): void;
  onParameterChange?(param: string, value: ParameterValue): void;
  onBeforeUpdate?(time: number): void;
  onAfterUpdate?(time: number, position: HolophonixPosition): void;
}

export interface BehaviorImplementation {
  update(time: number): HolophonixPosition;
  reset(): void;
  destroy(): void;
  getParameters(): Record<string, ParameterValue>;
  setParameters(params: Record<string, ParameterValue>): void;
  getParameterMetadata(): Record<string, ParameterMetadata>;
  setCoordinateSystem(system: 'xyz' | 'aed'): void;
  getParameterGroups?(): Array<{
    name: string;
    description?: string;
    parameters: string[];
  }>;
}

/**
 * Base class for all behaviors. Handles parameter validation and coordinate system conversion.
 */
export abstract class BaseBehavior implements BehaviorLifecycle, BehaviorImplementation {
  protected parameters: Record<string, ParameterValue> = {};
  protected validator: BehaviorParameterValidator;
  protected isInitialized: boolean = false;
  protected coordinateSystem: 'xyz' | 'aed' = 'xyz';

  constructor(protected parameterDefinitions: ParameterDefinitions) {
    this.validator = new BehaviorParameterValidator(parameterDefinitions);
    this.reset();
    this.initialize();
  }

  protected initialize(): void {
    try {
      this.onInit?.();
      this.isInitialized = true;
    } catch (error) {
      throw new BehaviorExecutionError(`Failed to initialize behavior: ${error.message}`);
    }
  }

  abstract update(time: number): HolophonixPosition;
  
  protected abstract updatePosition(time: number): HolophonixPosition;

  reset(): void {
    // Reset parameters to defaults
    this.parameters = Object.entries(this.parameterDefinitions).reduce(
      (acc, [name, metadata]) => ({
        ...acc,
        [name]: metadata.defaultValue
      }),
      {}
    );
  }

  destroy(): void {
    try {
      this.onDestroy?.();
    } catch (error) {
      throw new BehaviorExecutionError(`Cleanup failed: ${error.message}`);
    }
  }

  getParameters(): Record<string, ParameterValue> {
    return { ...this.parameters };
  }

  setParameters(params: Record<string, ParameterValue>): void {
    const errors = this.validator.validateParameters(params);
    if (errors.length > 0) {
      throw errors[0];
    }

    Object.entries(params).forEach(([name, value]) => {
      this.setParameterValue(name, value);
    });
  }

  protected setParameterValue<T extends ParameterValue>(paramName: string, value: T): void {
    const oldValue = this.parameters[paramName];
    this.parameters[paramName] = value;

    try {
      this.onParameterChange?.(paramName, value);
    } catch (error) {
      // Rollback on error
      this.parameters[paramName] = oldValue;
      throw new BehaviorExecutionError(`Parameter change failed: ${error.message}`);
    }
  }

  getParameterMetadata(): Record<string, ParameterMetadata> {
    return this.parameterDefinitions;
  }

  setCoordinateSystem(system: 'xyz' | 'aed'): void {
    this.coordinateSystem = system;
  }

  getParameterGroups?(): Array<{
    name: string;
    description?: string;
    parameters: string[];
  }>;
}
