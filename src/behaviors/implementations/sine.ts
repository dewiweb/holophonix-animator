import { BaseBehavior } from '../base';
import { Position } from '../../types/behaviors';
import { ParameterDefinitions } from '../../types/parameters';

const SINE_PARAMETERS: ParameterDefinitions = {
    frequency: {
        min: 0.01,
        max: 10,
        default: 1,
        step: 0.01,
        unit: 'hertz',
        description: 'Oscillation frequency in Hz'
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
    },
    phase: {
        min: 0,
        max: 360,
        default: 0,
        step: 1,
        unit: 'degrees',
        description: 'Phase offset in degrees'
    }
};

export class SineWaveBehavior extends BaseBehavior {
    constructor() {
        super(SINE_PARAMETERS, false);
    }

    update(deltaTime: number): Position {
        const params = this.getParameters();
        const elapsedTime = this.getElapsedTime(deltaTime);
        
        // Convert phase from degrees to radians
        const phaseRadians = (params.phase * Math.PI) / 180;
        
        // Calculate sine wave value
        const value = params.offset + 
            params.amplitude * Math.sin(2 * Math.PI * params.frequency * elapsedTime + phaseRadians);

        return {
            x: value,
            y: 0,
            z: 0
        };
    }
}
