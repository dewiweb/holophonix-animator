import { ParameterMetadata, ParameterValidationError } from './parameters';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface AEDPosition {
  azimuth: number;   // degrees
  elevation: number; // degrees
  distance: number;  // meters
}

export interface BehaviorParameter {
  name: string;
  min: number;
  max: number;
  default: number;
  step?: number;
}

export interface BehaviorType {
  type: string;
  name: string;
  category: BehaviorCategory;
  parameters: BehaviorParameter[];
}

export interface Behavior {
  id: string;
  name: string;
  type: string;
  active: boolean;
  parameters: Record<string, number>;
  implementation: BehaviorImplementation;
}

export interface Track {
  id: string;
  name: string;
  position: Position;
  aedPosition: AEDPosition;
  behaviors: Behavior[];
  active: boolean;
}

export type BehaviorCategory = '1D' | '2D' | '3D';

export interface BehaviorImplementation {
  update(deltaTime: number): void;
  getParameters(): Record<string, number>;
  setParameters(params: Record<string, number>): ParameterValidationError[];
  reset(): void;
  getParameterMetadata(): Record<string, ParameterMetadata>;
}
