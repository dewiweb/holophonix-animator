import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const SINE_PARAMETERS: ParameterDefinitions = {
  frequency: {
    type: 'numeric',
    defaultValue: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Oscillation frequency',
    label: 'Frequency'
  },
  amplitude: {
    type: 'numeric',
    defaultValue: 10,
    min: 1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Wave amplitude in meters',
    label: 'Amplitude'
  },
  phase: {
    type: 'numeric',
    defaultValue: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Phase offset',
    label: 'Phase'
  },
  axis: {
    type: 'enum',
    defaultValue: 'x',
    values: ['x', 'y', 'z'],
    unit: ParameterUnit.NONE,
    description: 'Movement axis (X, Y, or Z)',
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
  }
};

export class SineBehavior extends BaseBehavior {
  private position: Vector3;

  constructor() {
    super(SINE_PARAMETERS);
    this.position = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { frequency, amplitude, phase, axis, center } = this.parameters;
    
    // Calculate angle based on time and frequency
    const angle = (time * frequency * Math.PI * 2 + phase * Math.PI / 180) % (Math.PI * 2);
    
    // Calculate position based on sine wave
    const offset = amplitude * Math.sin(angle);
    
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
    super.reset();
  }
}
