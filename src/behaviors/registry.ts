import type { Behavior, BehaviorCategory, BehaviorImplementation } from '../types/behaviors';
import type { BehaviorType } from './factory';
import { LinearBehavior } from './implementations/1d/linear';
import { SineWaveBehavior } from './implementations/1d/sine';
import { CircleBehavior } from './implementations/2d/circle';
import { Figure8Behavior } from './implementations/2d/figure8';
import { OrbitBehavior } from './implementations/3d/orbit';

interface BehaviorDefinition {
  type: BehaviorType;
  name: string;
  category: BehaviorCategory;
  implementation: new () => BehaviorImplementation;
}

const behaviors: Record<BehaviorType, Omit<BehaviorDefinition, 'type'>> = {
  'linear': {
    name: 'Linear Oscillation',
    category: '1D',
    implementation: LinearBehavior
  },
  'sine': {
    name: 'Sine Wave',
    category: '1D',
    implementation: SineWaveBehavior
  },
  'circle': {
    name: 'Circular Motion',
    category: '2D',
    implementation: CircleBehavior
  },
  'figure8': {
    name: 'Figure-8 Motion',
    category: '2D',
    implementation: Figure8Behavior
  },
  'orbit': {
    name: 'Orbit Motion',
    category: '3D',
    implementation: OrbitBehavior
  }
};

export function getBehaviorDefinition(type: BehaviorType): BehaviorDefinition | null {
  const definition = behaviors[type];
  return definition ? { type, ...definition } : null;
}

export function getBehaviorsByCategory(category: BehaviorCategory): BehaviorDefinition[] {
  return Object.entries(behaviors)
    .filter(([_, def]) => def.category === category)
    .map(([type, def]) => ({ type: type as BehaviorType, ...def }));
}

export function getAllBehaviors(): BehaviorDefinition[] {
  return Object.entries(behaviors)
    .map(([type, def]) => ({ type: type as BehaviorType, ...def }));
}

export function createBehavior(type: BehaviorType, id: string): Behavior | null {
  const definition = getBehaviorDefinition(type);
  if (!definition) {
    return null;
  }

  const implementation = new definition.implementation();
  const parameters = Object.fromEntries(
    Object.entries(implementation.getParameterMetadata())
      .map(([key, meta]) => [key, meta.default])
  );

  return {
    id,
    type,
    name: definition.name,
    active: true,
    parameters,
    implementation
  };
}
