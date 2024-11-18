import type { BehaviorType, Behavior, BehaviorParameter, BehaviorCategory, BehaviorImplementation } from '../types/behaviors';
import { LinearBehavior } from './implementations/linear';
import { SineWaveBehavior } from './implementations/sine';
import { CircleBehavior } from './implementations/circle';

interface BehaviorDefinition {
  type: string;
  name: string;
  category: BehaviorCategory;
  implementation: new () => BehaviorImplementation;
}

const behaviors: Record<string, Omit<BehaviorDefinition, 'type'>> = {
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
  'random-1d': {
    name: 'Random Walk',
    category: '1D',
    implementation: LinearBehavior // TODO: Implement RandomBehavior
  },
  'circle': {
    name: 'Circular Motion',
    category: '2D',
    implementation: CircleBehavior
  },
  'spiral': {
    name: 'Spiral Motion',
    category: '2D',
    implementation: CircleBehavior // TODO: Implement SpiralBehavior
  },
  'lissajous': {
    name: 'Lissajous Curve',
    category: '2D',
    implementation: CircleBehavior // TODO: Implement LissajousBehavior
  },
  'random-2d': {
    name: '2D Random Walk',
    category: '2D',
    implementation: CircleBehavior // TODO: Implement Random2DBehavior
  },
  'sphere': {
    name: 'Spherical Motion',
    category: '3D',
    implementation: CircleBehavior // TODO: Implement SphereBehavior
  },
  'helix': {
    name: 'Helical Motion',
    category: '3D',
    implementation: CircleBehavior // TODO: Implement HelixBehavior
  },
  'random-3d': {
    name: '3D Random Walk',
    category: '3D',
    implementation: CircleBehavior // TODO: Implement Random3DBehavior
  }
};

export const getBehaviorDefinition = (type: string): BehaviorDefinition | null => {
  const definition = behaviors[type];
  return definition ? { ...definition, type } : null;
};

export const getBehaviorsByCategory = (category: BehaviorCategory): BehaviorDefinition[] => {
  return Object.entries(behaviors)
    .filter(([_, b]) => b.category === category)
    .map(([type, def]) => ({
      ...def,
      type
    }));
};

export const getAllBehaviors = (): BehaviorDefinition[] => {
  return Object.entries(behaviors).map(([type, def]) => ({
    ...def,
    type
  }));
};

export const createBehavior = (type: string, id: string): Behavior | null => {
  const definition = getBehaviorDefinition(type);
  if (!definition) return null;

  const implementation = new definition.implementation();
  
  // Get parameter metadata and default values from implementation
  const metadata = implementation.getParameterMetadata();
  const parameters = implementation.getParameters();

  return {
    id,
    type,
    name: definition.name,
    active: true,
    parameters,
    implementation
  };
};
