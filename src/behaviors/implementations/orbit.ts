import { BaseBehavior } from '../base';
import type { Position } from '../../types/behaviors';

export class OrbitBehavior extends BaseBehavior {
    constructor(params: Record<string, number>) {
        super(params);
    }

    update(time: number): Position {
        const t = this.getElapsedTime(time);
        const { radius, speed, tilt } = this.parameters;
        const angle = speed * t;
        const tiltRad = tilt * Math.PI / 180;
        
        return {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle) * Math.cos(tiltRad),
            z: radius * Math.sin(angle) * Math.sin(tiltRad)
        };
    }
}
