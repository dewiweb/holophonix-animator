import type { BehaviorType } from '../behaviors/factory';
import type { ParameterMetadata, ParameterValidationError } from './parameters';
import type { XYZPosition, AEDPosition } from './position';

export interface BehaviorImplementation {
  update(deltaTime: number): void;
  getParameters(): Record<string, number | string>;
  setParameters(params: Record<string, number | string>): ParameterValidationError[];
  reset(): void;
  getParameterMetadata(): Record<string, ParameterMetadata>;
}

export interface Behavior {
  id: string;
  type: BehaviorType;
  name: string;
  parameters: Record<string, number | string>;
  implementation: BehaviorImplementation;
  active?: boolean;
}

export type BehaviorCategory = '1D' | '2D' | '3D' | 'Group';

export interface BehaviorDefinition {
  name: string;
  category: BehaviorCategory;
  description: string;
  parameterMetadata: Record<string, ParameterMetadata>;
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
