import type { BehaviorImplementation } from './base';
import { LinearBehavior } from './implementations/1d/linear';
import { SineBehavior } from './implementations/1d/sine';
import { CircleBehavior } from './implementations/2d/circle';
import { Figure8Behavior } from './implementations/2d/figure8';
import { OrbitBehavior } from './implementations/3d/orbit';
import { LeaderFollowerBehavior } from './group/leader-follower';
import { BehaviorCategory } from '../types/behaviors';

export type BehaviorType = 'linear' | 'sine' | 'circle' | 'figure8' | 'orbit' | 'leader-follower';

export interface BehaviorFactory {
  create(type: BehaviorType): BehaviorImplementation;
  getCategory(type: BehaviorType): BehaviorCategory;
}

class DefaultBehaviorFactory implements BehaviorFactory {
  create(type: BehaviorType): BehaviorImplementation {
    switch (type) {
      case 'linear':
        return new LinearBehavior();
      case 'sine':
        return new SineBehavior();
      case 'circle':
        return new CircleBehavior();
      case 'figure8':
        return new Figure8Behavior();
      case 'orbit':
        return new OrbitBehavior();
      case 'leader-follower':
        return new LeaderFollowerBehavior(this.create('linear')); // Default to linear leader
      default:
        throw new Error(`Unknown behavior type: ${type}`);
    }
  }

  getCategory(type: BehaviorType): BehaviorCategory {
    switch (type) {
      case 'linear':
      case 'sine':
        return '1D';
      case 'circle':
      case 'figure8':
        return '2D';
      case 'orbit':
        return '3D';
      case 'leader-follower':
        return 'Group';
      default:
        throw new Error(`Unknown behavior type: ${type}`);
    }
  }
}

export const behaviorFactory = new DefaultBehaviorFactory();

export function createBehavior(type: BehaviorType): BehaviorImplementation {
  return behaviorFactory.create(type);
}

export function getBehaviorCategory(type: BehaviorType): BehaviorCategory {
  return behaviorFactory.getCategory(type);
}
