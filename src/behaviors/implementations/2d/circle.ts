import { BaseBehavior } from '../../base';
import { ParameterDefinitions } from '../../../types/parameters';
import { 
  XYZPosition, 
  AEDPosition,
  createXYZPosition, 
  createAEDPosition,
  normalizePosition,
  COORDINATE_BOUNDS
} from '../../../types/position';

// Common parameters for both coordinate systems
const COMMON_PARAMETERS: ParameterDefinitions = {
  speed: {
    default: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: 'revolutions/second',
    description: 'Rotation speed'
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
  radius: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Circle radius'
  },
  plane: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Rotation plane (0: XY, 1: YZ, 2: XZ)'
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
  },
  tiltAngle: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Circle tilt angle'
  }
};

// AED-specific parameters
const AED_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  radius: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Circle radius (distance from center)'
  },
  elevation: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Circle elevation angle'
  },
  tiltAngle: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Circle tilt from vertical'
  },
  centerAzimuth: {
    default: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: 'degrees',
    description: 'Center azimuth angle'
  },
  radiusVariation: {
    default: 0,
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'meters',
    description: 'Radius variation (creates elliptical path)'
  }
};

export class CircleBehavior extends BaseBehavior {
  private time: number = 0;

  constructor(coordinateSystem: 'xyz' | 'aed' = 'xyz') {
    super(coordinateSystem === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS, coordinateSystem);
  }

  protected calculateXYZPosition(deltaTime: number): XYZPosition {
    this.time += deltaTime;
    const radius = this.parameters.radius;
    const speed = this.parameters.speed;
    const phase = (this.parameters.phase * Math.PI) / 180;
    const plane = Math.floor(this.parameters.plane);
    const tiltAngle = (this.parameters.tiltAngle * Math.PI) / 180;
    const centerX = this.parameters.centerX;
    const centerY = this.parameters.centerY;
    const centerZ = this.parameters.centerZ;

    // Calculate angle based on time and speed
    const angle = 2 * Math.PI * speed * this.time + phase;

    // Calculate position based on selected plane
    let x = centerX;
    let y = centerY;
    let z = centerZ;

    switch (plane) {
      case 0: // XY plane
        x += radius * Math.cos(angle);
        y += radius * Math.sin(angle);
        // Apply tilt around X axis
        const tiltedY = y * Math.cos(tiltAngle);
        z += y * Math.sin(tiltAngle);
        y = tiltedY;
        break;
      case 1: // YZ plane
        y += radius * Math.cos(angle);
        z += radius * Math.sin(angle);
        // Apply tilt around Y axis
        const tiltedZ = z * Math.cos(tiltAngle);
        x += z * Math.sin(tiltAngle);
        z = tiltedZ;
        break;
      case 2: // XZ plane
        x += radius * Math.cos(angle);
        z += radius * Math.sin(angle);
        // Apply tilt around Z axis
        const tiltedX = x * Math.cos(tiltAngle);
        y += x * Math.sin(tiltAngle);
        x = tiltedX;
        break;
    }

    return normalizePosition(createXYZPosition(x, y, z)) as XYZPosition;
  }

  protected calculateAEDPosition(deltaTime: number): AEDPosition {
    this.time += deltaTime;
    const radius = this.parameters.radius;
    const speed = this.parameters.speed;
    const phase = this.parameters.phase;
    const elevation = this.parameters.elevation;
    const tiltAngle = this.parameters.tiltAngle;
    const centerAzimuth = this.parameters.centerAzimuth;
    const radiusVariation = this.parameters.radiusVariation;

    // Calculate base angle
    const angle = speed * 360 * this.time + phase;
    
    // Calculate azimuth with tilt influence
    const baseAzimuth = angle % 360;
    const azimuth = ((centerAzimuth + baseAzimuth * Math.cos(tiltAngle * Math.PI / 180)) + 540) % 360 - 180;
    
    // Calculate elevation with tilt
    const elevationOffset = Math.sin(angle * Math.PI / 180) * Math.sin(tiltAngle * Math.PI / 180) * 45;
    const finalElevation = Math.max(-90, Math.min(90, elevation + elevationOffset));
    
    // Calculate distance with optional variation
    const distance = radius + radiusVariation * Math.cos(angle * Math.PI / 180);

    return normalizePosition(createAEDPosition(
      azimuth,
      finalElevation,
      Math.max(1, distance)
    )) as AEDPosition;
  }

  setCoordinateSystem(system: 'xyz' | 'aed'): void {
    if (system !== this.coordinateSystem) {
      // Save current parameters that are common
      const commonParams = {
        speed: this.parameters.speed,
        phase: this.parameters.phase
      };

      // Update parameter definitions
      this.parameterDefinitions = system === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS;
      this.validator = new ParameterValidator(this.parameterDefinitions);

      // Reset parameters to defaults
      Object.entries(this.parameterDefinitions).forEach(([key, def]) => {
        this.parameters[key] = def.default;
      });

      // Restore common parameters
      Object.assign(this.parameters, commonParams);

      // Update coordinate system
      this.coordinateSystem = system;
      
      // Reset time
      this.time = 0;
    }
  }

  reset(): void {
    super.reset();
    this.time = 0;
  }
}
