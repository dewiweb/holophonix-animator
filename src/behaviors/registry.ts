import type { BehaviorType, Behavior, BehaviorParameter } from '../types/behaviors';

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
      {
        name: 'stepSize',
        min: 0,
        max: 10,
        default: 1
      },
      {
        name: 'interval',
        min: 0.1,
        max: 5,
        default: 1
      }
    ]
  },
  'drift': {
    name: 'Drift',
    category: '1D',
    parameters: [
      {
        name: 'speed',
        min: -10,
        max: 10,
        default: 1
      },
      {
        name: 'variation',
        min: 0,
        max: 1,
        default: 0.1
      }
    ]
  },

  // 2D Behaviors
  'circular': {
    name: 'Circular Motion',
    category: '2D',
    parameters: [
      createParameter('radius', 0, 100, 10),
      createParameter('speed', 0.1, 10, 1),
      createParameter('centerX', -100, 100, 0),
      createParameter('centerY', -100, 100, 0),
    ],
  },
  'figure8': {
    name: 'Figure-8',
    category: '2D',
    parameters: [
      {
        name: 'size',
        min: 0,
        max: 100,
        default: 10
      },
      {
        name: 'speed',
        min: -10,
        max: 10,
        default: 1
      }
    ]
  },
  'random-2d': {
    name: 'Random Walk 2D',
    category: '2D',
    parameters: [
      {
        name: 'stepSize',
        min: 0,
        max: 10,
        default: 1
      },
      {
        name: 'interval',
        min: 0.1,
        max: 5,
        default: 1
      }
    ]
  },
  'spiral-2d': {
    name: 'Spiral',
    category: '2D',
    parameters: [
      {
        name: 'startRadius',
        min: 0,
        max: 100,
        default: 0
      },
      {
        name: 'growth',
        min: 0,
        max: 10,
        default: 1
      },
      {
        name: 'speed',
        min: -10,
        max: 10,
        default: 1
      }
    ]
  },

  // 3D Behaviors
  'orbit': {
    name: 'Orbit',
    category: '3D',
    parameters: [
      createParameter('radius', 0, 100, 10),
      createParameter('speed', 0.1, 10, 1),
      createParameter('tilt', -90, 90, 0),
      createParameter('height', -100, 100, 0),
    ],
  },
  'spiral-3d': {
    name: 'Helix',
    category: '3D',
    parameters: [
      {
        name: 'radius',
        min: 0,
        max: 100,
        default: 10
      },
      {
        name: 'height',
        min: 0,
        max: 100,
        default: 10
      },
      {
        name: 'speed',
        min: -10,
        max: 10,
        default: 1
      }
    ]
  },
  'random-3d': {
    name: 'Random Walk 3D',
    category: '3D',
    parameters: [
      {
        name: 'stepSize',
        min: 0,
        max: 10,
        default: 1
      },
      {
        name: 'interval',
        min: 0.1,
        max: 5,
        default: 1
      }
    ]
  }
};

export function getBehaviorDefinition(type: string): BehaviorDefinition | null {
  return behaviors[type] || null;
}

export function getBehaviorsByCategory(category: BehaviorCategory): BehaviorDefinition[] {
  return Object.values(behaviors).filter(b => b.category === category);
}

export function getAllBehaviors(): BehaviorDefinition[] {
  return Object.values(behaviors);
}

export function createBehavior(type: string, id: string): Behavior | null {
  const definition = getBehaviorDefinition(type);
  if (!definition) return null;

  return {
    id,
    type,
    name: definition.name,
    active: true,
    parameters: Object.fromEntries(
      definition.parameters.map(p => [p.name, p.default])
    ),
  };
}

export function createBehaviorNew(type: string): Behavior | null {
  const definition = getBehaviorDefinition(type);
  if (!definition) {
    console.warn(`Unknown behavior type: ${type}`);
    return null;
  }

  return {
    id: `behavior-${Math.random().toString(36).substr(2, 9)}`,
    type: definition.name,
    name: definition.name,
    active: true,
    parameters: Object.fromEntries(
      definition.parameters.map(p => [p.name, p.default])
    ),
  };
}
