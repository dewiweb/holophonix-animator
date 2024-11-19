import { BaseBehavior } from '../../base';
import { ParameterDefinitions, ParameterUnit } from '../../../types/parameters';
import { 
  HolophonixPosition,
  createXYZPosition, 
  normalizePosition,
} from '../../../types/position';
import { Vector3 } from 'three';

const LISSAJOUS_PARAMETERS: ParameterDefinitions = {
  sizeX: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'X-axis size',
    label: 'Size X'
  },
  sizeY: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Y-axis size',
    label: 'Size Y'
  },
  sizeZ: {
    type: 'numeric',
    defaultValue: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: ParameterUnit.METERS,
    description: 'Z-axis size',
    label: 'Size Z'
  },
  freqX: {
    type: 'numeric',
    defaultValue: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'X-axis frequency',
    label: 'Frequency X'
  },
  freqY: {
    type: 'numeric',
    defaultValue: 2,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Y-axis frequency',
    label: 'Frequency Y'
  },
  freqZ: {
    type: 'numeric',
    defaultValue: 3,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: ParameterUnit.HERTZ,
    description: 'Z-axis frequency',
    label: 'Frequency Z'
  },
  phaseX: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'X-axis phase offset',
    label: 'Phase X'
  },
  phaseY: {
    type: 'numeric',
    defaultValue: 90,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Y-axis phase offset',
    label: 'Phase Y'
  },
  phaseZ: {
    type: 'numeric',
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: ParameterUnit.DEGREES,
    description: 'Z-axis phase offset',
    label: 'Phase Z'
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

export class LissajousBehavior extends BaseBehavior {
  private position: Vector3;
  private center: Vector3;

  constructor() {
    super(LISSAJOUS_PARAMETERS);
    this.position = new Vector3();
    this.center = new Vector3();
  }

  update(time: number): HolophonixPosition {
    const { 
      sizeX, sizeY, sizeZ,
      freqX, freqY, freqZ,
      phaseX, phaseY, phaseZ,
      centerX, centerY, centerZ 
    } = this.parameters;
    
    // Convert phases to radians
    const phaseXRad = phaseX * Math.PI / 180;
    const phaseYRad = phaseY * Math.PI / 180;
    const phaseZRad = phaseZ * Math.PI / 180;
    
    // Calculate positions using Lissajous equations
    const x = sizeX * Math.sin(2 * Math.PI * freqX * time + phaseXRad);
    const y = sizeY * Math.sin(2 * Math.PI * freqY * time + phaseYRad);
    const z = sizeZ * Math.sin(2 * Math.PI * freqZ * time + phaseZRad);
    
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
