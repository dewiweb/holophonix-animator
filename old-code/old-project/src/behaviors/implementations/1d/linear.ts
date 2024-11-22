import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const LINEAR_PARAMETERS: ParameterDefinitions = {
  speed: {
    type: 'numeric',
    defaultValue: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.METERS_PER_SECOND,
    description: 'Movement speed',
    label: 'Speed'
  },
  range: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Movement range',
    label: 'Range'
  },
  axis: {
    type: 'enum',
    defaultValue: 'x',
    values: ['x', 'y', 'z'],
    unit: ParameterUnit.NONE,
    description: 'Movement axis',
    label: 'Axis'
  },
  center: {
    type: 'numeric',
    defaultValue: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Center position',
    label: 'Center'
  },
  direction: {
    type: 'enum',
    defaultValue: 'forward',
    values: ['forward', 'backward', 'pingpong'],
    unit: ParameterUnit.NONE,
    description: 'Movement direction',
    label: 'Direction'
  }
};

export class LinearBehavior extends BaseBehavior {
  private position: Vector3;
  private currentDirection: number = 1;

  constructor() {
    super(LINEAR_PARAMETERS);
    this.position = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { speed, range, axis, center, direction } = this.parameters;
    
    // Calculate normalized position (0 to 1)
    let normalizedPos = (time * speed) % range;
    
    // Handle direction
    if (direction === 'backward') {
      normalizedPos = range - normalizedPos;
    } else if (direction === 'pingpong') {
      const cycle = Math.floor((time * speed) / range);
      if (cycle % 2 === 1) {
        normalizedPos = range - normalizedPos;
      }
    }
    
    // Calculate offset from center
    const offset = normalizedPos - (range / 2);
    
    // Apply position based on selected axis
    switch (axis) {
      case 'x':
        this.position.set(center + offset, 0, 0);
        break;
      case 'y':
        this.position.set(0, center + offset, 0);
        break;
      case 'z':
        this.position.set(0, 0, center + offset);
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
    this.currentDirection = 1;
    super.reset();
  }
}
