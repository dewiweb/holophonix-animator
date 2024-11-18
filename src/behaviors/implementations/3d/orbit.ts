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
    description: 'Orbit speed'
  },
  phase: {
    default: 0,
    min: 0,
    max: 360,
    step: 1,
    unit: 'degrees',
    description: 'Starting phase angle'
  }
};

// XYZ-specific parameters - Allows for complex 3D orbits
const XYZ_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  mode: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Orbit type (0: Circular, 1: Elliptical, 2: Lissajous)'
  },
  radiusX: {
    default: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'X-axis radius'
  },
  radiusY: {
    default: 10,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Y-axis radius'
  },
  radiusZ: {
    default: 5,
    min: 0.1,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Z-axis radius (for Lissajous)'
  },
  centerX: {
    default: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Orbit center X coordinate'
  },
  centerY: {
    default: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Orbit center Y coordinate'
  },
  centerZ: {
    default: 0,
    min: -100,
    max: 100,
    step: 0.1,
    unit: 'meters',
    description: 'Orbit center Z coordinate'
  },
  tiltAngle: {
    default: 0,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Orbit tilt angle'
  },
  frequencyRatio: {
    default: 2,
    min: 1,
    max: 10,
    step: 0.1,
    unit: 'ratio',
    description: 'Frequency ratio for Lissajous patterns'
  }
};

// AED-specific parameters - Focuses on spherical motion patterns
const AED_PARAMETERS: ParameterDefinitions = {
  ...COMMON_PARAMETERS,
  mode: {
    default: 0,
    min: 0,
    max: 2,
    step: 1,
    unit: 'enum',
    description: 'Orbit type (0: Horizontal, 1: Spiral, 2: Figure-8)'
  },
  distance: {
    default: 10,
    min: 1,
    max: 100,
    step: 1,
    unit: 'meters',
    description: 'Base orbit radius'
  },
  elevation: {
    default: 45,
    min: -90,
    max: 90,
    step: 1,
    unit: 'degrees',
    description: 'Base elevation angle'
  },
  wobble: {
    default: 0,
    min: 0,
    max: 45,
    step: 1,
    unit: 'degrees',
    description: 'Elevation wobble amplitude'
  },
  wobbleSpeed: {
    default: 0.5,
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: 'Hz',
    description: 'Elevation wobble frequency'
  },
  spiralRate: {
    default: 0.1,
    min: -1,
    max: 1,
    step: 0.01,
    unit: 'ratio',
    description: 'Spiral elevation change rate'
  },
  distanceVariation: {
    default: 0,
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'meters',
    description: 'Distance variation amplitude'
  }
};

export class OrbitBehavior extends BaseBehavior {
  private time: number = 0;

  constructor(coordinateSystem: 'xyz' | 'aed' = 'aed') {
    super(coordinateSystem === 'xyz' ? XYZ_PARAMETERS : AED_PARAMETERS, coordinateSystem);
  }

  protected calculateXYZPosition(deltaTime: number): XYZPosition {
    this.time += deltaTime;
    const mode = Math.floor(this.parameters.mode);
    const speed = this.parameters.speed;
    const phase = (this.parameters.phase * Math.PI) / 180;
    const tiltAngle = (this.parameters.tiltAngle * Math.PI) / 180;
    
    // Base angle for the orbit
    const angle = 2 * Math.PI * speed * this.time + phase;
    
    let x = 0, y = 0, z = 0;
    
    switch (mode) {
      case 0: // Circular orbit
        const radiusX = this.parameters.radiusX;
        const radiusY = this.parameters.radiusY;
        
        // Calculate basic circular orbit
        x = radiusX * Math.cos(angle);
        y = radiusY * Math.sin(angle);
        
        // Apply tilt
        const tiltedY = y * Math.cos(tiltAngle);
        z = y * Math.sin(tiltAngle);
        y = tiltedY;
        break;
        
      case 1: // Elliptical orbit
        // Similar to circular but with independent X and Y radii
        x = this.parameters.radiusX * Math.cos(angle);
        y = this.parameters.radiusY * Math.sin(angle);
        z = this.parameters.radiusZ * Math.sin(angle * 0.5); // Add vertical motion
        break;
        
      case 2: // Lissajous pattern
        const freqRatio = this.parameters.frequencyRatio;
        x = this.parameters.radiusX * Math.cos(angle);
        y = this.parameters.radiusY * Math.cos(angle * freqRatio);
        z = this.parameters.radiusZ * Math.sin(angle * freqRatio * 0.5);
        break;
    }
    
    // Add center offset
    x += this.parameters.centerX;
    y += this.parameters.centerY;
    z += this.parameters.centerZ;
    
    return normalizePosition(createXYZPosition(x, y, z)) as XYZPosition;
  }

  protected calculateAEDPosition(deltaTime: number): AEDPosition {
    this.time += deltaTime;
    const mode = Math.floor(this.parameters.mode);
    const speed = this.parameters.speed;
    const phase = this.parameters.phase;
    const distance = this.parameters.distance;
    const baseElevation = this.parameters.elevation;
    
    // Calculate base orbit angle
    const angle = speed * 360 * this.time + phase;
    
    let azimuth: number, elevation: number, finalDistance: number;
    
    switch (mode) {
      case 0: // Horizontal orbit with wobble
        azimuth = angle % 360;
        if (azimuth > 180) azimuth -= 360;
        
        // Add wobble to elevation
        const wobbleAngle = this.parameters.wobble * 
          Math.sin(2 * Math.PI * this.parameters.wobbleSpeed * this.time);
        elevation = baseElevation + wobbleAngle;
        
        // Add distance variation
        finalDistance = distance + 
          this.parameters.distanceVariation * Math.sin(angle * Math.PI / 180);
        break;
        
      case 1: // Spiral orbit
        azimuth = angle % 360;
        if (azimuth > 180) azimuth -= 360;
        
        // Gradually change elevation
        elevation = baseElevation + 
          this.parameters.spiralRate * (angle / 360) * 90;
        elevation = Math.max(-90, Math.min(90, elevation));
        
        // Distance varies with elevation
        finalDistance = distance * (1 + Math.abs(elevation) / 90 * 0.5);
        break;
        
      case 2: // Figure-8 pattern
        azimuth = angle % 360;
        if (azimuth > 180) azimuth -= 360;
        
        // Create figure-8 pattern in elevation
        elevation = baseElevation + 
          this.parameters.wobble * Math.sin(2 * angle * Math.PI / 180);
        
        // Distance varies to maintain consistent speed
        finalDistance = distance / Math.cos(elevation * Math.PI / 180);
        break;
        
      default:
        azimuth = angle % 360;
        elevation = baseElevation;
        finalDistance = distance;
    }
    
    return normalizePosition(createAEDPosition(
      azimuth,
      elevation,
      Math.max(1, finalDistance)
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
