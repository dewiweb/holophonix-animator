import type { BehaviorType, Behavior, BehaviorParameter, BehaviorCategory } from '../types/behaviors';

interface BehaviorDefinition {
  name: string;
  category: BehaviorCategory;
  parameters: BehaviorParameter[];
}

const createParameter = (
  name: string,
  min: number,
  max: number,
  defaultValue: number
): BehaviorParameter => ({
  name,
  min,
  max,
  default: defaultValue,
});

const behaviors: Record<string, BehaviorDefinition> = {
  // 1D Behaviors
  'linear': {
    name: 'Linear Oscillation',
    category: '1D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('amplitude', 0, 100, 10),
      createParameter('offset', -100, 100, 0),
    ],
  },
  'sine': {
    name: 'Sine Wave',
    category: '1D',
    parameters: [
      createParameter('frequency', 0.1, 10, 1),
      createParameter('amplitude', 0, 100, 10),
      createParameter('phase', 0, 360, 0),
    ],
  },
  'random-1d': {
    name: 'Random Walk',
    category: '1D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('range', 0, 100, 10),
    ],
  },

  // 2D Behaviors
  'circle': {
    name: 'Circular Motion',
    category: '2D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('radius', 0, 100, 10),
      createParameter('phase', 0, 360, 0),
    ],
  },
  'lissajous': {
    name: 'Lissajous Curve',
    category: '2D',
    parameters: [
      createParameter('frequencyX', 0.1, 10, 1),
      createParameter('frequencyY', 0.1, 10, 1),
      createParameter('amplitude', 0, 100, 10),
      createParameter('phase', 0, 360, 0),
    ],
  },
  'random-2d': {
    name: '2D Random Walk',
    category: '2D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('range', 0, 100, 10),
    ],
  },

  // 3D Behaviors
  'sphere': {
    name: 'Spherical Motion',
    category: '3D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('radius', 0, 100, 10),
      createParameter('elevation', -90, 90, 0),
    ],
  },
  'spiral': {
    name: 'Spiral Motion',
    category: '3D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('radius', 0, 100, 10),
      createParameter('height', 0, 100, 10),
      createParameter('turns', 1, 10, 3),
    ],
  },
  'random-3d': {
    name: '3D Random Walk',
    category: '3D',
    parameters: [
      createParameter('speed', 0.1, 10, 1),
      createParameter('range', 0, 100, 10),
    ],
  },
};

export const getBehaviorDefinition = (type: string): BehaviorDefinition | null => {
  return behaviors[type] || null;
};

export const getBehaviorsByCategory = (category: BehaviorCategory): BehaviorDefinition[] => {
  return Object.values(behaviors).filter(b => b.category === category);
};

export const getAllBehaviors = (): BehaviorDefinition[] => {
  return Object.values(behaviors);
};

export const createBehavior = (type: string, id: string): Behavior | null => {
  const definition = getBehaviorDefinition(type);
  if (!definition) return null;

  const defaultParameters: Record<string, number> = {};
  definition.parameters.forEach(param => {
    defaultParameters[param.name] = param.default;
  });

  return {
    id,
    type,
    name: definition.name,
    active: true,
    parameters: defaultParameters,
  };
};
