import { BehaviorImplementation } from './base';
import { SineBehavior } from './implementations/1d/sine';
import { CircleBehavior } from './implementations/2d/circle';
import { OrbitBehavior } from './implementations/3d/orbit';
import { IsobarycentricBehavior } from './group/isobarycentric';
import { NumericParameterMetadata, EnumParameterMetadata, ParameterUnit } from '../types/parameters';

export type BehaviorCategory = '1D' | '2D' | '3D' | 'Group';

export interface BehaviorDefinition {
  type: string;
  name: string;
  category: BehaviorCategory;
  description: string;
  parameters: Record<string, NumericParameterMetadata | EnumParameterMetadata>;
  implementation: new () => BehaviorImplementation;
}

export const BEHAVIOR_REGISTRY: Record<string, BehaviorDefinition> = {
  'sine': {
    name: 'Sine',
    type: 'sine',
    category: '1D',
    description: 'Sinusoidal motion along a single axis',
    parameters: {
      axis: {
        type: 'enum',
        values: ['x', 'y', 'z'],
        defaultValue: 'x',
        unit: ParameterUnit.NONE,
        description: 'Movement axis',
        label: 'Axis'
      },
      frequency: {
        type: 'numeric',
        min: 0,
        max: 10,
        defaultValue: 1,
        step: 0.1,
        unit: ParameterUnit.HERTZ,
        description: 'Oscillation frequency',
        label: 'Frequency'
      },
      amplitude: {
        type: 'numeric',
        min: 0,
        max: 100,
        defaultValue: 10,
        step: 1,
        unit: ParameterUnit.METERS,
        description: 'Movement amplitude',
        label: 'Amplitude'
      },
      phase: {
        type: 'numeric',
        min: -180,
        max: 180,
        defaultValue: 0,
        step: 1,
        unit: ParameterUnit.DEGREES,
        description: 'Phase offset',
        label: 'Phase'
      }
    },
    implementation: SineBehavior
  },
  'circle': {
    name: 'Circle',
    type: 'circle',
    category: '2D',
    description: 'Circular motion in a plane',
    parameters: {
      plane: {
        type: 'enum',
        values: ['xy', 'xz', 'yz'],
        defaultValue: 'xy',
        unit: ParameterUnit.NONE,
        description: 'Movement plane',
        label: 'Plane'
      },
      radius: {
        type: 'numeric',
        min: 0,
        max: 100,
        defaultValue: 10,
        step: 1,
        unit: ParameterUnit.METERS,
        description: 'Circle radius',
        label: 'Radius'
      },
      speed: {
        type: 'numeric',
        min: -10,
        max: 10,
        defaultValue: 1,
        step: 0.1,
        unit: ParameterUnit.HERTZ,
        description: 'Rotation speed',
        label: 'Speed'
      },
      phase: {
        type: 'numeric',
        min: -180,
        max: 180,
        defaultValue: 0,
        step: 1,
        unit: ParameterUnit.DEGREES,
        description: 'Initial phase angle',
        label: 'Phase'
      }
    },
    implementation: CircleBehavior
  },
  'orbit': {
    name: 'Orbit',
    type: 'orbit',
    category: '3D',
    description: '3D orbital motion',
    parameters: {
      distance: {
        type: 'numeric',
        min: 0,
        max: 100,
        defaultValue: 10,
        step: 1,
        unit: ParameterUnit.METERS,
        description: 'Orbit distance',
        label: 'Distance'
      },
      speed: {
        type: 'numeric',
        min: -10,
        max: 10,
        defaultValue: 1,
        step: 0.1,
        unit: ParameterUnit.HERTZ,
        description: 'Orbit speed',
        label: 'Speed'
      },
      inclination: {
        type: 'numeric',
        min: -90,
        max: 90,
        defaultValue: 0,
        step: 1,
        unit: ParameterUnit.DEGREES,
        description: 'Orbit inclination',
        label: 'Inclination'
      },
      phase: {
        type: 'numeric',
        min: -180,
        max: 180,
        defaultValue: 0,
        step: 1,
        unit: ParameterUnit.DEGREES,
        description: 'Initial phase angle',
        label: 'Phase'
      }
    },
    implementation: OrbitBehavior
  },
  'isobarycentric': {
    name: 'Isobarycentric',
    type: 'isobarycentric',
    category: 'Group',
    description: 'Group behavior based on weighted positions',
    parameters: {
      radius: {
        type: 'numeric',
        min: 0,
        max: 100,
        defaultValue: 10,
        step: 1,
        unit: ParameterUnit.METERS,
        description: 'Group radius',
        label: 'Radius'
      },
      phase: {
        type: 'numeric',
        min: -180,
        max: 180,
        defaultValue: 0,
        step: 1,
        unit: ParameterUnit.DEGREES,
        description: 'Initial phase angle',
        label: 'Phase'
      },
      speed: {
        type: 'numeric',
        min: -10,
        max: 10,
        defaultValue: 1,
        step: 0.1,
        unit: ParameterUnit.HERTZ,
        description: 'Group speed',
        label: 'Speed'
      }
    },
    implementation: IsobarycentricBehavior
  }
};

export function getBehaviorDefinition(type: string): BehaviorDefinition | null {
  const definition = BEHAVIOR_REGISTRY[type];
  return definition ? definition : null;
}

export function getBehaviorsByCategory(category: BehaviorCategory): BehaviorDefinition[] {
  return Object.entries(BEHAVIOR_REGISTRY)
    .filter(([_, def]) => def.category === category)
    .map(([type, def]) => ({ ...def, type: type }));
}

export function getAllBehaviors(): BehaviorDefinition[] {
  return Object.entries(BEHAVIOR_REGISTRY)
    .map(([type, def]) => ({ ...def, type: type }));
}

export function createBehavior(type: string): BehaviorImplementation | null {
  const definition = getBehaviorDefinition(type);
  if (!definition) return null;
  
  try {
    return new definition.implementation();
  } catch (error) {
    console.error(`Failed to create behavior of type ${type}:`, error);
    return null;
  }
}
