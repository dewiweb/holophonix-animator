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
import { ParameterValidator } from '../../validation';

// Common parameters for both coordinate systems
const COMMON_PARAMETERS: ParameterDefinitions = {
  speed: {
    default: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: 'revolutions/second',
    description: 'Motion speed'
  },
  phase: {
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: 'degrees',
    description: 'Starting angle'
  }
};

// XYZ-specific parameters
const XYZ_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  width: {
    default: 20,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Figure-8 width'
  },
  height: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Figure-8 height'
  },
  plane: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Motion plane (0: XY, 1: YZ, 2: XZ)'
  },
  centerX: {
    default: 0,
    min: -100,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Center X position'
  },
  centerY: {
    default: 0,
    min: -100,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Center Y position'
  },
  centerZ: {
    default: 0,
    min: -100,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Center Z position'
  }
};

// AED-specific parameters
const AED_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  width: {
    default: 20,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Figure-8 width'
  },
  height: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Figure-8 height'
  },
  centerAzimuth: {
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: 'degrees',
    description: 'Center azimuth'
  },
  centerElevation: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Center elevation'
  },
  centerDistance: {
    default: 10,
    min: 0,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Center distance'
  },
  tilt: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Figure-8 tilt angle'
  }
};

export class Figure8Behavior extends BaseBehavior {
  private time: number = 0;

  constructor(coordinateSystem: CoordinateSystem = 'xyz') {
    const params = coordinateSystem === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS;
    super(params, coordinateSystem);
    this.validator = new ParameterValidator(params);
  }

  calculateXYZPosition(deltaTime: number): XYZPosition {
    this.time += deltaTime * this.parameters.speed;
    const t = (this.time * 2 * Math.PI + this.parameters.phase * Math.PI / 180) % (2 * Math.PI);
    
    const width = this.parameters.width;
    const height = this.parameters.height;
    const plane = Math.floor(this.parameters.plane || 0);
    
    // Calculate lemniscate of Bernoulli
    const scale = Math.sqrt(2);
    const x = (width * Math.sin(t)) / (1 + Math.pow(Math.cos(t), 2));
    const y = (height * Math.sin(t) * Math.cos(t)) / (1 + Math.pow(Math.cos(t), 2));

    // Apply plane rotation and center offset
    let position: XYZPosition;
    switch (plane) {
      case 0: // XY plane
        position = createXYZPosition(
          x + (this.parameters.centerX || 0),
          y + (this.parameters.centerY || 0),
          this.parameters.centerZ || 0
        );
        break;
      case 1: // YZ plane
        position = createXYZPosition(
          this.parameters.centerX || 0,
          x + (this.parameters.centerY || 0),
          y + (this.parameters.centerZ || 0)
        );
        break;
      case 2: // XZ plane
        position = createXYZPosition(
          x + (this.parameters.centerX || 0),
          this.parameters.centerY || 0,
          y + (this.parameters.centerZ || 0)
        );
        break;
      default:
        position = createXYZPosition(
          this.parameters.centerX || 0,
          this.parameters.centerY || 0,
          this.parameters.centerZ || 0
        );
    }

    return normalizePosition(position);
  }

  calculateAEDPosition(deltaTime: number): AEDPosition {
    this.time += deltaTime * this.parameters.speed;
    const t = (this.time * 2 * Math.PI + this.parameters.phase * Math.PI / 180) % (2 * Math.PI);
    
    const width = this.parameters.width;
    const height = this.parameters.height;
    const centerAzimuth = this.parameters.centerAzimuth || 0;
    const centerElevation = this.parameters.centerElevation || 0;
    const centerDistance = this.parameters.centerDistance || 10;
    const tilt = (this.parameters.tilt || 0) * Math.PI / 180;
    
    // Calculate base lemniscate shape
    const scale = Math.sqrt(2);
    const x = (width * Math.sin(t)) / (1 + Math.pow(Math.cos(t), 2));
    const y = (height * Math.sin(t) * Math.cos(t)) / (1 + Math.pow(Math.cos(t), 2));
    
    // Apply tilt rotation
    const xTilted = x;
    const yTilted = y * Math.cos(tilt);
    
    // Convert to spherical coordinates (simplified for small angles)
    const azimuthOffset = Math.atan2(xTilted, centerDistance) * 180 / Math.PI;
    const elevationOffset = Math.atan2(yTilted, centerDistance) * 180 / Math.PI;
    
    // Create final AED position
    const position = createAEDPosition(
      (centerAzimuth + azimuthOffset + 360) % 360,
      Math.max(-90, Math.min(90, centerElevation + elevationOffset)),
      centerDistance
    );
    
    return normalizePosition(position);
  }

  setCoordinateSystem(system: CoordinateSystem): void {
    if (system === this.coordinateSystem) return;

    // Store current parameters before switching
    const commonParams = {
      speed: this.parameters.speed,
      phase: this.parameters.phase,
      width: this.parameters.width,
      height: this.parameters.height
    };

    // Switch coordinate system and parameters
    this.coordinateSystem = system;
    this.parameterDefinitions = system === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS;
    this.validator = new ParameterValidator(this.parameterDefinitions);
    
    // Reset parameters to defaults
    Object.entries(this.parameterDefinitions).forEach(([key, def]) => {
      this.parameters[key] = def.default;
    });

    // Restore common parameters
    Object.entries(commonParams).forEach(([key, value]) => {
      this.parameters[key] = value;
    });
  }

  reset(): void {
    this.time = 0;
  }

  update(deltaTime: number): HolophonixPosition {
    return this.coordinateSystem === 'xyz' 
      ? this.calculateXYZPosition(deltaTime)
      : this.calculateAEDPosition(deltaTime);
  }
}
