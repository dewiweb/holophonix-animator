import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const SPIRAL_PARAMETERS: ParameterDefinitions = {
  startRadius: {
    type: 'numeric',
    defaultValue: 1,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Starting radius of spiral',
    label: 'Start Radius'
  },
  endRadius: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Ending radius of spiral',
    label: 'End Radius'
  },
  turns: {
    type: 'numeric',
    defaultValue: 3,
    min: 0.1,
    max: 20,
    step: 0.1,
    unit: ParameterUnit.RATIO,
    description: 'Number of spiral turns',
    label: 'Turns'
  },
  speed: {
    type: 'numeric',
    defaultValue: 1,
    min: -10,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Rotation speed',
    label: 'Speed'
  },
  direction: {
    type: 'enum',
    defaultValue: 'clockwise',
    values: ['clockwise', 'counterclockwise'],
    unit: ParameterUnit.NONE,
    description: 'Rotation direction',
    label: 'Direction'
  },
  phase: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Initial phase angle',
    label: 'Phase'
  },
  plane: {
    type: 'enum',
    defaultValue: 'xy',
    values: ['xy', 'xz', 'yz'],
    unit: ParameterUnit.NONE,
    description: 'Rotation plane',
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

export class SpiralBehavior extends BaseBehavior {
  private position: Vector3;
  private center: Vector3;

  constructor() {
    super(SPIRAL_PARAMETERS);
    this.position = new Vector3();
    this.center = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { 
      startRadius, endRadius, turns, speed, direction, phase,
      plane, centerX, centerY, centerZ 
    } = this.parameters;
    
    // Calculate angle based on time and speed
    const directionMultiplier = direction === 'clockwise' ? 1 : -1;
    const angle = (time * speed * directionMultiplier * Math.PI * 2 + phase * Math.PI / 180) % (Math.PI * 2);
    
    // Calculate progress through spiral (0 to 1)
    const progress = (angle % (2 * Math.PI * turns)) / (2 * Math.PI * turns);
    
    // Calculate current radius using linear interpolation
    const radius = startRadius + (endRadius - startRadius) * progress;
    
    // Calculate position based on plane
    let x = 0, y = 0, z = 0;
    const baseX = radius * Math.cos(angle);
    const baseY = radius * Math.sin(angle);
    
    switch (plane) {
      case 'xy':
        x = baseX;
        y = baseY;
        z = 0;
        break;
      case 'xz':
        x = baseX;
        y = 0;
        z = baseY;
        break;
      case 'yz':
        x = 0;
        y = baseX;
        z = baseY;
        break;
    }
    
    // Update center and position
    this.center.set(centerX, centerY, centerZ);
    this.position.set(
      this.center.x + x,
      this.center.y + y,
      this.center.z + z
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
