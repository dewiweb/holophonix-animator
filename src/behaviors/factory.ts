import type { BehaviorType, BehaviorImplementation } from '../types/behaviors';
import { LinearBehavior } from './implementations/linear';
import { SineBehavior } from './implementations/sine';
import { CircularBehavior } from './implementations/circular';
import { OrbitBehavior } from './implementations/orbit';

const defaultParameters = (behaviorType: BehaviorType): Record<string, number> => {
  return Object.fromEntries(
    behaviorType.parameters.map(param => [param.name, param.default])
  );
};

export function createBehaviorImplementation(behaviorType: BehaviorType): BehaviorImplementation | null {
  const params = defaultParameters(behaviorType);

  switch (behaviorType.type) {
    case 'linear':
      return new LinearBehavior(params);
    case 'sine':
      return new SineBehavior(params);
    case 'circular':
      return new CircularBehavior(params);
    case 'orbit':
      return new OrbitBehavior(params);
    default:
      console.warn(`Unknown behavior type: ${behaviorType.type}`);
      return null;
  }
}
