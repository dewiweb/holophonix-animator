import { BaseBehavior } from '../base';
import { Position } from '../../types/behaviors';
import { ParameterDefinitions } from '../../types/parameters';

const CIRCULAR_PARAMETERS: ParameterDefinitions = {
    speed: {
        min: 0.01,
        max: 10,
        default: 1,
        step: 0.01,
        unit: 'hertz',
        description: 'Rotation speed in Hz'
    },
    radius: {
        min: 0,
        max: 100,
        default: 10,
        step: 1,
        unit: 'meters',
        description: 'Circle radius'
    },
    centerX: {
        min: -100,
        max: 100,
        default: 0,
        step: 1,
        unit: 'meters',
        description: 'Center X position'
    },
    centerY: {
        min: -100,
        max: 100,
        default: 0,
        step: 1,
        unit: 'meters',
        description: 'Center Y position'
    },
    phase: {
        min: 0,
        max: 360,
        default: 0,
        step: 1,
        unit: 'degrees',
        description: 'Starting angle in degrees'
    }
};

export class CircularBehavior extends BaseBehavior {
    constructor() {
        super(CIRCULAR_PARAMETERS, false);
    }

    update(deltaTime: number): Position {
        const params = this.getParameters();
        const elapsedTime = this.getElapsedTime(deltaTime);
        
        // Convert phase from degrees to radians and calculate current angle
        const phaseRadians = (params.phase * Math.PI) / 180;
        const angle = 2 * Math.PI * params.speed * elapsedTime + phaseRadians;
        
        // Calculate position on circle
        const x = params.centerX + params.radius * Math.cos(angle);
        const y = params.centerY + params.radius * Math.sin(angle);

        return {
            x,
            y,
            z: 0
        };
    }
}
