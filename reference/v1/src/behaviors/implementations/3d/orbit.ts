import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const ORBIT_PARAMETERS: ParameterDefinitions = {
  radius: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Orbit radius',
    label: 'Radius'
  },
  speed: {
    type: 'numeric',
    defaultValue: 1,
    min: -10,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Orbit speed',
    label: 'Speed'
  },
  phase: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Phase offset',
    label: 'Phase'
  },
  elevation: {
    type: 'numeric',
    defaultValue: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Orbit elevation angle',
    label: 'Elevation'
  },
  tilt: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Orbit tilt angle',
    label: 'Tilt'
  },
  eccentricity: {
    type: 'numeric',
    defaultValue: 0,
    min: 0,
    max: 1,
    step: 0.01,
    unit: ParameterUnit.RATIO,
    description: 'Orbit eccentricity (0 = circular, 1 = highly elliptical)',
    label: 'Eccentricity'
  },
  direction: {
    type: 'enum',
    defaultValue: 'clockwise',
    values: ['clockwise', 'counterclockwise'],
    unit: ParameterUnit.NONE,
    description: 'Orbit direction',
    label: 'Direction'
  },
  centerX: {
    type: 'numeric',
    defaultValue: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Center X coordinate',
    label: 'Center X'
  },
  centerY: {
    type: 'numeric',
    defaultValue: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Center Y coordinate',
    label: 'Center Y'
  },
  centerZ: {
    type: 'numeric',
    defaultValue: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Center Z coordinate',
    label: 'Center Z'
  }
};

export class OrbitBehavior extends BaseBehavior {
  private position: Vector3;
  private center: Vector3;

  constructor() {
    super(ORBIT_PARAMETERS);
    this.position = new Vector3();
    this.center = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { 
      radius, speed, phase, elevation, tilt, eccentricity,
      direction, centerX, centerY, centerZ 
    } = this.parameters;
    
    // Calculate angle based on time and speed
    const directionMultiplier = direction === 'clockwise' ? 1 : -1;
    const angle = (time * speed * directionMultiplier * Math.PI * 2 + phase * Math.PI / 180) % (Math.PI * 2);
    
    // Convert angles to radians
    const elevationRad = elevation * Math.PI / 180;
    const tiltRad = tilt * Math.PI / 180;
    
    // Calculate elliptical radius
    const a = radius;
    const b = radius * (1 - eccentricity);
    const r = (a * b) / Math.sqrt((b * Math.cos(angle))**2 + (a * Math.sin(angle))**2);
    
    // Calculate base position
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = r * Math.sin(elevationRad);
    
    // Apply tilt rotation
    const xt = x;
    const yt = y * Math.cos(tiltRad) - z * Math.sin(tiltRad);
    const zt = y * Math.sin(tiltRad) + z * Math.cos(tiltRad);
    
    // Update center and position
    this.center.set(centerX, centerY, centerZ);
    this.position.set(
      this.center.x + xt,
      this.center.y + yt,
      this.center.z + zt
    );

    return normalizePosition(createXYZPosition(
      this.position.x,
      this.position.y,
      this.position.z
    ));
  }

  reset(): void {
    this.position.set(0, 0, 0);
    this.center.set(0, 0, 0);
    super.reset();
  }
}
