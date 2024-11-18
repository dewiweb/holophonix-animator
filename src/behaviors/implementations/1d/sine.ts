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
  frequency: {
    default: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: 'Hz',
    description: 'Oscillation frequency'
  },
  phase: {
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: 'degrees',
    description: 'Wave phase offset'
  }
};

// XYZ-specific parameters
const XYZ_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  amplitude: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Wave amplitude in meters'
  },
  axis: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Movement axis (0: X, 1: Y, 2: Z)'
  },
  center: {
    default: 0,
    min: -100,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Center position of oscillation'
  }
};

// AED-specific parameters
const AED_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  mode: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Oscillation mode (0: Azimuth, 1: Elevation, 2: Distance)'
  },
  azimuthAmplitude: {
    default: 45,
    min: 1,
    max: 180,
    step: 1,
    unit: 'degrees',
    description: 'Azimuth oscillation amplitude'
  },
  elevationAmplitude: {
    default: 30,
    min: 1,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Elevation oscillation amplitude'
  },
  distanceAmplitude: {
    default: 5,
    min: 0.1,
    max: 20,
    step: 0.1,
    unit: 'meters',
    description: 'Distance oscillation amplitude'
  },
  baseDistance: {
    default: 10,
    min: 1,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Base distance from center'
  },
  centerAzimuth: {
    default: 0,
    min: -180,
    max: 180,
    step: 1,
    unit: 'degrees',
    description: 'Center azimuth for oscillation'
  },
  centerElevation: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Center elevation for oscillation'
  }
};

export class SineWaveBehavior extends BaseBehavior {
  constructor(coordinateSystem: 'xyz' | 'aed' = 'xyz') {
    super(coordinateSystem === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS, coordinateSystem);
  }

  protected calculateXYZPosition(deltaTime: number): XYZPosition {
    const frequency = this.parameters.frequency;
    const phase = (this.parameters.phase * Math.PI) / 180; // Convert to radians
    const amplitude = this.parameters.amplitude;
    const axis = Math.floor(this.parameters.axis);
    const center = this.parameters.center;

    // Calculate sine wave position
    const angle = 2 * Math.PI * frequency * deltaTime + phase;
    const position = center + amplitude * Math.sin(angle);

    // Create position based on selected axis
    const values = [0, 0, 0];
    values[axis] = position;

    return normalizePosition(createXYZPosition(
      values[0],
      values[1],
      values[2]
    )) as XYZPosition;
  }

  protected calculateAEDPosition(deltaTime: number): AEDPosition {
    const frequency = this.parameters.frequency;
    const phase = (this.parameters.phase * Math.PI) / 180;
    const mode = Math.floor(this.parameters.mode);
    const baseDistance = this.parameters.baseDistance;
    
    // Calculate base angle for the sine wave
    const angle = 2 * Math.PI * frequency * deltaTime + phase;
    
    // Initialize with center values
    let azimuth = this.parameters.centerAzimuth;
    let elevation = this.parameters.centerElevation;
    let distance = baseDistance;
    
    switch (mode) {
      case 0: // Azimuth oscillation
        // Oscillate around center azimuth with smooth wraparound at ±180°
        const azimuthOffset = this.parameters.azimuthAmplitude * Math.sin(angle);
        azimuth = ((azimuth + azimuthOffset + 540) % 360) - 180;
        break;
        
      case 1: // Elevation oscillation
        // Oscillate elevation with natural damping at poles
        const rawElevation = elevation + this.parameters.elevationAmplitude * Math.sin(angle);
        // Clamp to valid elevation range
        elevation = Math.max(-90, Math.min(90, rawElevation));
        break;
        
      case 2: // Distance oscillation
        // Oscillate distance with minimum threshold to prevent crossing center
        const distOffset = this.parameters.distanceAmplitude * Math.sin(angle);
        distance = Math.max(1, baseDistance + distOffset);
        break;
    }
    
    return normalizePosition(createAEDPosition(
      azimuth,
      elevation,
      distance
    )) as AEDPosition;
  }

  setCoordinateSystem(system: 'xyz' | 'aed'): void {
    if (system !== this.coordinateSystem) {
      // Save current parameters that are common
      const commonParams = {
        frequency: this.parameters.frequency,
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
    }
  }
}
