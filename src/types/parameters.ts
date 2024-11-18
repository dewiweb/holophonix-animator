export type ParameterUnit = 'degrees' | 'radians' | 'meters' | 'seconds' | 'hertz' | 'normalized';

export interface ParameterMetadata {
    min: number;
    max: number;
    default: number;
    step: number;
    unit: ParameterUnit;
    description: string;
}

export interface ParameterValidationError {
    parameter: string;
    value: number;
    message: string;
    code: 'OUT_OF_RANGE' | 'INVALID_TYPE' | 'INVALID_STEP';
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
        min: 0,
        max: 100,
        default: 1,
        step: 0.1,
        unit: 'meters',
        description: 'Distance from origin in meters',
    },
    frequency: {
        min: 0.01,
        max: 10,
        default: 1,
        step: 0.01,
        unit: 'hertz',
        description: 'Frequency of oscillation in Hz',
    },
    amplitude: {
        ...NORMALIZED_RANGE,
        default: 1,
        step: 0.1,
        unit: 'normalized',
        description: 'Amplitude of oscillation (-1 to 1)',
    },
    phase: {
        ...ANGLE_RANGE,
        default: 0,
        step: 1,
        unit: 'degrees',
        description: 'Phase offset in degrees',
    },
};
