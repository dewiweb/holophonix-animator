import { BaseBehavior } from '../../base';
import { ParameterDefinitions } from '../../../types/parameters';
import { 
  XYZPosition, 
  AEDPosition,
  createXYZPosition, 
  createAEDPosition,
  normalizePosition,
  CoordinateSystem,
  HolophonixPosition
} from '../../../types/position';

// Common parameters for both coordinate systems
const COMMON_PARAMETERS: ParameterDefinitions = {
  coordinateMode: {
    default: 'xyz',
    enum: ['xyz', 'aed'],
    unit: 'enum',
    description: 'Coordinate system mode'
  },
  speed: {
    min: 0.1,
    max: 10,
    default: 1,
    step: 0.1,
    unit: 'units/second',
    description: 'Movement speed'
  }
};

// XYZ-specific parameters
const XYZ_PARAMETERS: ParameterDefinitions = {
  axis: {
    default: 'X',
    enum: ['X', 'Y', 'Z'],
    unit: 'enum',
    description: 'Movement axis'
  },
  range: {
    min: 0.1,
    max: 100,
    default: 10,
    step: 0.1,
    unit: 'meters',
    description: 'Movement range'
  },
  center: {
    min: -100,
    max: 100,
    default: 0,
    step: 0.1,
    unit: 'meters',
    description: 'Center position'
  }
};

// AED-specific parameters
const AED_PARAMETERS: ParameterDefinitions = {
  dimension: {
    default: 'azimuth',
    enum: ['azimuth', 'elevation', 'distance'],
    unit: 'enum',
    description: 'Movement dimension'
  },
  azimuthRange: {
    min: 0,
    max: 360,
    default: 90,
    step: 1,
    unit: 'degrees',
    description: 'Azimuth movement range'
  },
  elevationRange: {
    min: 0,
    max: 180,
    default: 45,
    step: 1,
    unit: 'degrees',
    description: 'Elevation movement range'
  },
  distanceRange: {
    min: 0.1,
    max: 100,
    default: 5,
    step: 0.1,
    unit: 'meters',
    description: 'Distance movement range'
  },
  baseDistance: {
    min: 1,
    max: 100,
    default: 10,
    step: 0.1,
    unit: 'meters',
    description: 'Base distance (for azimuth/elevation movement)'
  },
  centerAzimuth: {
    min: -180,
    max: 180,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Center azimuth'
  },
  centerElevation: {
    min: -90,
    max: 90,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Center elevation'
  }
};

export class LinearBehavior extends BaseBehavior {
  private time: number = 0;
  private direction: number = 1;
  protected coordinateSystem: CoordinateSystem = 'xyz';

  constructor() {
    super({
      ...COMMON_PARAMETERS,
      ...XYZ_PARAMETERS,
      ...AED_PARAMETERS
    });
  }

  update(time: number): HolophonixPosition {
    const speed = this.parameters.speed as number;
    this.time += time * speed * this.direction;

    let position: HolophonixPosition;
    if (this.coordinateSystem === 'xyz') {
      position = this.calculateXYZPosition();
    } else {
      position = this.calculateAEDPosition();
    }

    // Check for direction change
    if (this.time >= 1) {
      this.time = 1;
      this.direction = -1;
    } else if (this.time <= 0) {
      this.time = 0;
      this.direction = 1;
    }

    return normalizePosition(position);
  }

  private calculateXYZPosition(): XYZPosition {
    const range = this.parameters.range as number;
    const center = this.parameters.center as number;
    const axis = this.parameters.axis as string;
    const position = center + (range * this.time);

    switch (axis) {
      case 'X':
        return createXYZPosition(position, 0, 0);
      case 'Y':
        return createXYZPosition(0, position, 0);
      case 'Z':
        return createXYZPosition(0, 0, position);
      default:
        return createXYZPosition(0, 0, 0);
    }
  }

  private calculateAEDPosition(): AEDPosition {
    const dimension = this.parameters.dimension as string;
    const baseDistance = this.parameters.baseDistance as number;
    
    switch (dimension) {
      case 'azimuth': {
        const range = this.parameters.azimuthRange as number;
        const center = this.parameters.centerAzimuth as number;
        const azimuth = center + (range * this.time);
        return createAEDPosition(azimuth, 0, baseDistance);
      }
      case 'elevation': {
        const range = this.parameters.elevationRange as number;
        const center = this.parameters.centerElevation as number;
        const elevation = center + (range * this.time);
        return createAEDPosition(0, elevation, baseDistance);
      }
      case 'distance': {
        const range = this.parameters.distanceRange as number;
        const distance = baseDistance + (range * this.time);
        return createAEDPosition(0, 0, distance);
      }
      default:
        return createAEDPosition(0, 0, baseDistance);
    }
  }

  protected onParameterChanged(params: Record<string, number | string>): void {
    if ('coordinateMode' in params) {
      const mode = params.coordinateMode as CoordinateSystem;
      if (mode !== this.coordinateSystem) {
        this.coordinateSystem = mode;
        
        // Update parameter definitions based on new mode
        this.parameterDefinitions = {
          ...COMMON_PARAMETERS,
          ...(mode === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS)
        };

        // Reset motion state
        this.reset();
        this.time = 0;
        this.direction = 1;
      }
    }
  }

  reset(): void {
    super.reset();
    this.time = 0;
    this.direction = 1;
  }
}
