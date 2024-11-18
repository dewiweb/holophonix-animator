import type { BehaviorImplementation } from './base';
import { LinearBehavior } from './implementations/1d/linear';
import { SineWaveBehavior } from './implementations/1d/sine';
import { CircleBehavior } from './implementations/2d/circle';
import { Figure8Behavior } from './implementations/2d/figure8';
import { OrbitBehavior } from './implementations/3d/orbit';

export type BehaviorType = 'linear' | 'sine' | 'circle' | 'figure8' | 'orbit';

export function createBehaviorImplementation(behaviorType: BehaviorType): BehaviorImplementation {
  switch (behaviorType) {
    case 'linear':
      return new LinearBehavior();
    case 'sine':
      return new SineWaveBehavior();
    case 'circle':
      return new CircleBehavior();
    case 'figure8':
      return new Figure8Behavior();
    case 'orbit':
      return new OrbitBehavior();
    default:
      throw new Error(`Unknown behavior type: ${behaviorType}`);
  }
}
