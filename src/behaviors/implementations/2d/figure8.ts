import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const FIGURE8_PARAMETERS: ParameterDefinitions = {
  frequency: {
    type: 'numeric',
    defaultValue: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Frequency of figure-8 motion',
    label: 'Frequency'
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
  size: {
    type: 'numeric',
    defaultValue: 10,
    min: 1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Size of figure-8 pattern',
    label: 'Size'
  },
  ratio: {
    type: 'numeric',
    defaultValue: 0.5,
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: ParameterUnit.RATIO,
    description: 'Width to height ratio',
    label: 'Ratio'
  },
  tilt: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Tilt angle of figure-8',
    label: 'Tilt'
  },
  plane: {
    type: 'enum',
    defaultValue: 'xy',
    values: ['xy', 'xz', 'yz'],
    unit: ParameterUnit.NONE,
    description: 'Movement plane',
    label: 'Plane'
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

export class Figure8Behavior extends BaseBehavior {
  private position: Vector3;
  private center: Vector3;

  constructor() {
    super(FIGURE8_PARAMETERS);
    this.position = new Vector3();
    this.center = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { frequency, phase, size, ratio, tilt, plane, centerX, centerY, centerZ } = this.parameters;
    
    // Calculate angle based on time and frequency
    const angle = (time * frequency * Math.PI * 2 + phase * Math.PI / 180) % (Math.PI * 2);
    
    // Calculate tilt angle in radians
    const tiltRad = tilt * Math.PI / 180;
    
    // Calculate base figure-8 position
    const x = size * Math.sin(angle);
    const y = size * ratio * Math.sin(2 * angle);
    
    // Apply tilt rotation
    const xt = x * Math.cos(tiltRad) - y * Math.sin(tiltRad);
    const yt = x * Math.sin(tiltRad) + y * Math.cos(tiltRad);
    
    // Update center position
    this.center.set(centerX, centerY, centerZ);
    
    // Apply position based on selected plane
    switch (plane) {
      case 'xy':
        this.position.set(
          this.center.x + xt,
          this.center.y + yt,
          this.center.z
        );
        break;
      case 'xz':
        this.position.set(
          this.center.x + xt,
          this.center.y,
          this.center.z + yt
        );
        break;
      case 'yz':
        this.position.set(
          this.center.x,
          this.center.y + xt,
          this.center.z + yt
        );
        break;
    }

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
