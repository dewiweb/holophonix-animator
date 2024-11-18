import { BaseBehavior } from '../base';
import { Position } from '../../types/behaviors';
import { ParameterDefinitions, COMMON_PARAMETERS } from '../../types/parameters';

const ORBIT_PARAMETERS: ParameterDefinitions = {
    radius: {
        min: 0,
        max: 10,
        default: 1,
        step: 0.1,
        unit: 'meters',
        description: 'Radius of the orbital path',
    },
    speed: {
        min: 0,
        max: 10,
        default: 1,
        step: 0.1,
        unit: 'hertz',
        description: 'Orbital speed in revolutions per second',
    },
    tilt: {
        ...COMMON_PARAMETERS.elevation as any,
        description: 'Orbital plane tilt angle in degrees',
    },
    phase: COMMON_PARAMETERS.phase as any,
    direction: {
        min: -1,
        max: 1,
        default: 1,
        step: 2,
        unit: 'normalized',
        description: 'Direction of orbit (-1: clockwise, 1: counter-clockwise)',
    },
    precession: {
        min: -10,
        max: 10,
        default: 0,
        step: 0.1,
        unit: 'degrees',
        description: 'Precession rate in degrees per second',
    },
};

export class OrbitBehavior extends BaseBehavior {
    constructor() {
        super(ORBIT_PARAMETERS, false);
    }

    update(time: number): Position {
        const t = this.getElapsedTime(time);
        const { radius, speed, tilt, phase, direction, precession } = this.parameters;
        
        // Convert angles to radians
        const tiltRad = (tilt * Math.PI) / 180;
        const phaseRad = (phase * Math.PI) / 180;
        const precessionAngle = (precession * t * Math.PI) / 180;
        
        // Calculate orbital position
        const orbitalAngle = direction * 2 * Math.PI * speed * t + phaseRad;
        
        // Calculate position with tilt and precession
        const position: Position = {
            x: radius * Math.cos(orbitalAngle) * Math.cos(precessionAngle) - 
               radius * Math.sin(orbitalAngle) * Math.cos(tiltRad) * Math.sin(precessionAngle),
               
            y: radius * Math.cos(orbitalAngle) * Math.sin(precessionAngle) +
               radius * Math.sin(orbitalAngle) * Math.cos(tiltRad) * Math.cos(precessionAngle),
               
            z: radius * Math.sin(orbitalAngle) * Math.sin(tiltRad)
        };
        
        return position;
    }
}
