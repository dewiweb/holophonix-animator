import { BaseBehavior } from '../base';
import type { Position } from '../../types/behaviors';

export class LinearBehavior extends BaseBehavior {
    constructor(params: Record<string, number>, axis: 'x' | 'y' | 'z' = 'x') {
        super(params);
        this.parameters.axis = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    }

    update(time: number): Position {
        const t = this.getElapsedTime(time);
        const { amplitude, frequency, axis } = this.parameters;
        
        const position = { x: 0, y: 0, z: 0 };
        const value = amplitude * Math.sin(2 * Math.PI * frequency * t);
        
        if (axis === 0) position.x = value;
        else if (axis === 1) position.y = value;
        else position.z = value;

        return position;
    }
}
