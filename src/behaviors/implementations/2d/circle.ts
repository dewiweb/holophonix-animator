import { BaseBehavior } from '../../base';
import { Vector3 } from 'three';
import { HolophonixPosition, XYZPosition, createXYZPosition, normalizePosition } from '../../../types/position';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';

const CIRCLE_PARAMETERS: ParameterDefinitions = {
  radius: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Circle radius',
    label: 'Radius'
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
    min: 0,
    max: 360,
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

export class CircleBehavior extends BaseBehavior {
  private position: Vector3;
  private center: Vector3;

  constructor() {
    super(CIRCLE_PARAMETERS);
    this.position = new Vector3();
    this.center = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { radius, speed, phase, direction, plane, centerX, centerY, centerZ } = this.parameters;
    
    // Calculate angle based on time and speed
    const directionMultiplier = direction === 'clockwise' ? 1 : -1;
    const angle = (time * speed * directionMultiplier * Math.PI * 2 + phase * Math.PI / 180) % (Math.PI * 2);

    // Update center position
    this.center.set(centerX, centerY, centerZ);

    // Calculate position based on plane
    switch (plane) {
      case 'xy':
        this.position.set(
          this.center.x + radius * Math.cos(angle),
          this.center.y + radius * Math.sin(angle),
          this.center.z
        );
        break;
      case 'xz':
        this.position.set(
          this.center.x + radius * Math.cos(angle),
          this.center.y,
          this.center.z + radius * Math.sin(angle)
        );
        break;
      case 'yz':
        this.position.set(
          this.center.x,
          this.center.y + radius * Math.cos(angle),
          this.center.z + radius * Math.sin(angle)
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
