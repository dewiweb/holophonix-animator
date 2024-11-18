export type ParameterUnit = 
  | 'degrees' 
  | 'radians' 
  | 'meters' 
  | 'seconds' 
  | 'hertz' 
  | 'Hz'
  | 'normalized'
  | 'meters/second'
  | 'revolutions/second'
  | 'units/second'
  | 'enum';

export interface BaseParameterMetadata {
  unit: ParameterUnit;
  description: string;
}

export interface NumericParameterMetadata extends BaseParameterMetadata {
  min: number;
  max: number;
  default: number;
  step: number;
  enum?: never;
}

export interface EnumParameterMetadata extends BaseParameterMetadata {
  default: string;
  enum: string[];
  min?: never;
  max?: never;
  step?: never;
}

export type ParameterMetadata = NumericParameterMetadata | EnumParameterMetadata;

export interface ParameterValidationError {
  parameter: string;
  value: number | string;
  message: string;
  code: 'OUT_OF_RANGE' | 'INVALID_TYPE' | 'INVALID_STEP' | 'INVALID_ENUM';
}

export type ParameterDefinitions = Record<string, ParameterMetadata>;

// Common parameter ranges
export const ANGLE_RANGE = { min: -180, max: 180 };
export const POSITIVE_ANGLE_RANGE = { min: 0, max: 360 };
export const ELEVATION_RANGE = { min: -90, max: 90 };
export const NORMALIZED_RANGE = { min: -1, max: 1 };
export const POSITIVE_RANGE = { min: 0, max: Number.POSITIVE_INFINITY };

// Common parameter metadata
export const COMMON_PARAMETERS: Record<string, Partial<ParameterMetadata>> = {
  azimuth: {
    ...ANGLE_RANGE,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Horizontal angle in degrees (-180 to 180)',
  },
  elevation: {
    ...ELEVATION_RANGE,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Vertical angle in degrees (-90 to 90)',
  },
  distance: {
    ...POSITIVE_RANGE,
    default: 10,
    step: 0.1,
    unit: 'meters',
    description: 'Distance in meters (0 to infinity)',
  },
  speed: {
    ...POSITIVE_RANGE,
    default: 1,
    step: 0.1,
    unit: 'units/second',
    description: 'Speed in units per second',
  },
  phase: {
    ...ANGLE_RANGE,
    default: 0,
    step: 1,
    unit: 'degrees',
    description: 'Phase offset in degrees',
  },
  frequency: {
    ...POSITIVE_RANGE,
    default: 1,
    step: 0.1,
    unit: 'Hz',
    description: 'Frequency in Hertz',
  },
  axis: {
    default: 'X',
    enum: ['X', 'Y', 'Z'],
    unit: 'enum',
    description: 'Movement axis (X, Y, Z)',
  },
  plane: {
    default: 'XY',
    enum: ['XY', 'YZ', 'XZ'],
    unit: 'enum',
    description: 'Rotation plane (XY, YZ, XZ)',
  }
};
