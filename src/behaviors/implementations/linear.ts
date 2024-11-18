import { BaseBehavior } from '../base';
import { Position } from '../../types/behaviors';
import { ParameterDefinitions } from '../../types/parameters';

const LINEAR_PARAMETERS: ParameterDefinitions = {
    speed: {
        min: 0.1,
        max: 10,
        default: 1,
        step: 0.01,
        unit: 'hertz',
        description: 'Speed of oscillation in Hz'
    },
    amplitude: {
        min: 0,
        max: 100,
        default: 10,
        step: 1,
        unit: 'meters',
        description: 'Size of movement'
    },
    offset: {
        min: -100,
        max: 100,
        default: 0,
        step: 1,
        unit: 'meters',
        description: 'Center point offset'
    }
};

export class LinearBehavior extends BaseBehavior {
    private time: number = 0;
    private direction: number = 1;

    constructor() {
        super(LINEAR_PARAMETERS, false);
    }

    reset(): void {
        super.reset();
        this.time = 0;
        this.direction = 1;
    }

    update(deltaTime: number): Position {
        const params = this.getParameters(); // This ensures we have all parameters with defaults
        
        this.time += deltaTime * params.speed;
        
        if (this.time >= 1) {
            this.direction *= -1;
            this.time = 0;
        }

        const value = params.offset + 
            params.amplitude * this.direction * this.time;

        return {
            x: value,
            y: 0,
            z: 0
        };
    }
}
