import { ParameterDefinitions, ParameterValidationError, ParameterMetadata } from '../types/parameters';
import { ParameterValidator } from './validation';
import {
  XYZPosition,
  AEDPosition,
  convertXYZtoAED,
  convertAEDtoXYZ,
  createXYZPosition,
  createAEDPosition,
  validatePosition,
  normalizePosition,
  HolophonixPosition,
  CoordinateSystem
} from '../types/position';

export interface BehaviorImplementation {
  update(time: number): HolophonixPosition;
  reset(): void;
  setParameters(params: Record<string, number | string>): ParameterValidationError[];
  getParameters(): Record<string, number | string>;
  getParameterMetadata(): Record<string, ParameterMetadata>;
  getCoordinateSystem(): CoordinateSystem;
  setCoordinateSystem(system: CoordinateSystem): void;
}

export abstract class BaseBehavior implements BehaviorImplementation {
  protected parameters: Record<string, number | string>;
  protected parameterDefinitions: ParameterDefinitions;
  protected validator: ParameterValidator;
  protected startTime: number;
  protected coordinateSystem: CoordinateSystem;

  constructor(parameterDefinitions: ParameterDefinitions, defaultSystem: CoordinateSystem = 'xyz') {
    this.parameterDefinitions = parameterDefinitions;
    this.validator = new ParameterValidator(parameterDefinitions);
    this.parameters = {};
    this.startTime = Date.now();
    this.coordinateSystem = defaultSystem;

    // Initialize parameters with default values
    Object.entries(parameterDefinitions).forEach(([key, def]) => {
      this.parameters[key] = def.default;
    });
  }

  abstract update(time: number): HolophonixPosition;

  reset(): void {
    this.startTime = Date.now();
  }

  setParameters(params: Record<string, number | string>): ParameterValidationError[] {
    const errors = this.validator.validate(params);
    if (errors.length === 0) {
      // Only update parameters if there are no validation errors
      Object.entries(params).forEach(([key, value]) => {
        this.parameters[key] = value;
      });
      this.onParameterChanged(params);
    }
    return errors;
  }

  getParameters(): Record<string, number | string> {
    return { ...this.parameters };
  }

  getParameterMetadata(): Record<string, ParameterMetadata> {
    return { ...this.parameterDefinitions };
  }

  getCoordinateSystem(): CoordinateSystem {
    return this.coordinateSystem;
  }

  setCoordinateSystem(system: CoordinateSystem): void {
    if (system !== this.coordinateSystem) {
      this.coordinateSystem = system;
      this.onCoordinateSystemChanged(system);
    }
  }

  protected getElapsedTime(currentTime: number): number {
    return (currentTime - this.startTime) / 1000;
  }

  protected onParameterChanged(params: Record<string, number | string>): void {
    // Override in subclasses if needed
  }

  protected onCoordinateSystemChanged(system: CoordinateSystem): void {
    // Override in subclasses if needed
  }

  protected createPosition(x: number, y: number, z: number): HolophonixPosition {
    return this.coordinateSystem === 'xyz'
      ? createXYZPosition(x, y, z)
      : convertXYZtoAED(createXYZPosition(x, y, z));
  }
}
