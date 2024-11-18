import type { BehaviorType, BehaviorImplementation } from '../types/behaviors';
import { LinearBehavior } from './implementations/linear';
import { SineWaveBehavior } from './implementations/sine';
import { CircularBehavior } from './implementations/circular';
import { OrbitBehavior } from './implementations/orbit';

export function createBehaviorImplementation(behaviorType: BehaviorType): BehaviorImplementation {
    switch (behaviorType.type) {
        case 'linear':
            return new LinearBehavior();
        case 'sine':
            return new SineWaveBehavior();
        case 'circular':
            return new CircularBehavior();
        case 'orbit':
            return new OrbitBehavior();
        default:
            throw new Error(`Unknown behavior type: ${behaviorType.type}`);
    }
}
