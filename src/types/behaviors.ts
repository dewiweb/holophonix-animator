import type { BehaviorType } from '../behaviors/factory';
import type { ParameterMetadata, ParameterValidationError } from './parameters';
import type { XYZPosition, AEDPosition } from './position';

export interface BehaviorImplementation {
  update(deltaTime: number): void;
  getParameters(): Record<string, number>;
  setParameters(params: Record<string, number>): ParameterValidationError[];
  reset(): void;
  getParameterMetadata(): Record<string, ParameterMetadata>;
}

export interface Behavior {
  id: string;
  type: BehaviorType;
  name: string;
  parameters: Record<string, number>;
  implementation: BehaviorImplementation;
  active: boolean;
}

export type BehaviorCategory = '1D' | '2D' | '3D';

export interface BehaviorParameter {
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
}

export interface Track {
  id: string;
  name: string;
  position: XYZPosition;
  aedPosition: AEDPosition;
  behaviors: Behavior[];
  active: boolean;
  oscPath: string;
}
