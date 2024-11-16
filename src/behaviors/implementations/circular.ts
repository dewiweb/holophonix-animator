import { BaseBehavior } from '../base';
import type { Position } from '../../types/behaviors';

export class CircularBehavior extends BaseBehavior {
    constructor(params: Record<string, number>, plane: 'xy' | 'xz' | 'yz' = 'xy') {
        super(params);
        this.parameters.plane = plane === 'xy' ? 0 : plane === 'xz' ? 1 : 2;
    }

    update(time: number): Position {
        const t = this.getElapsedTime(time);
        const { radius, speed, plane } = this.parameters;
        const angle = speed * t;
        
        const position = { x: 0, y: 0, z: 0 };
        
        switch (plane) {
            case 0: // XY plane
                position.x = radius * Math.cos(angle);
                position.y = radius * Math.sin(angle);
                break;
            case 1: // XZ plane
                position.x = radius * Math.cos(angle);
                position.z = radius * Math.sin(angle);
                break;
            case 2: // YZ plane
                position.y = radius * Math.cos(angle);
                position.z = radius * Math.sin(angle);
                break;
        }

        return position;
    }
}
