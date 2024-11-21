import { z } from 'zod';

// Parameter Units
export enum ParameterUnit {
  NONE = 'none',
  METERS = 'm',
  DEGREES = '°',
  RADIANS = 'rad',
  HERTZ = 'Hz',
  SECONDS = 's',
  RATIO = '%',
  RADIANS_PER_SECOND = 'rad/s',
  DEGREES_PER_SECOND = '°/s',
  METERS_PER_SECOND = 'm/s',
}

export type ParameterType = 'numeric' | 'enum' | 'boolean';
export type ParameterValue = number | string | boolean;

export interface BaseParameterMetadata {
  type: ParameterType;
  description: string;
  label: string;
  unit: ParameterUnit;
  defaultValue: ParameterValue;
}

export interface NumericParameterMetadata extends BaseParameterMetadata {
  type: 'numeric';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface EnumParameterMetadata extends BaseParameterMetadata {
  type: 'enum';
  values: string[];
  defaultValue: string;
}

export interface BooleanParameterMetadata extends BaseParameterMetadata {
  type: 'boolean';
  defaultValue: boolean;
}

export type ParameterMetadata = NumericParameterMetadata | EnumParameterMetadata | BooleanParameterMetadata;

export type ParameterDefinitions = Record<string, ParameterMetadata>;

// Error Codes
export const ParameterErrorCode = {
  INVALID_TYPE: 'INVALID_TYPE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',
  REQUIRED_PARAMETER_MISSING: 'REQUIRED_PARAMETER_MISSING',
  INVALID_UNIT: 'INVALID_UNIT',
} as const;

export type ParameterErrorCode = typeof ParameterErrorCode[keyof typeof ParameterErrorCode];

// Parameter Validation Error
export interface ParameterValidationError {
  code: ParameterErrorCode;
  parameter: string;
  message: string;
  expected?: string;
  received?: string;
}

// Zod Schemas for Runtime Validation
const baseParameterSchema = z.object({
  type: z.enum(['numeric', 'enum', 'boolean']),
  description: z.string(),
  label: z.string(),
  unit: z.nativeEnum(ParameterUnit),
  defaultValue: z.union([z.number(), z.string(), z.boolean()]),
});

export const numericParameterSchema = baseParameterSchema.extend({
  type: z.literal('numeric'),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  defaultValue: z.number(),
});

export const enumParameterSchema = baseParameterSchema.extend({
  type: z.literal('enum'),
  values: z.array(z.string()),
  defaultValue: z.string(),
});

export const booleanParameterSchema = baseParameterSchema.extend({
  type: z.literal('boolean'),
  defaultValue: z.boolean(),
});

export const parameterMetadataSchema = z.discriminatedUnion('type', [
  numericParameterSchema,
  enumParameterSchema,
  booleanParameterSchema,
]);

export class BehaviorParameterValidator {
  constructor(private parameterDefinitions: ParameterDefinitions) {
    // Validate parameter definitions at construction time
    this.validateParameterDefinitions();
  }

  validateParameterDefinitions(): void {
    Object.entries(this.parameterDefinitions).forEach(([name, metadata]) => {
      try {
        parameterMetadataSchema.parse(metadata);
      } catch (error) {
        throw new Error(`Invalid parameter definition for ${name}: ${error}`);
      }
    });
  }

  validateParameters(params: Record<string, unknown>): ParameterValidationError[] {
    return Object.entries(params)
      .map(([name, value]) => {
        const metadata = this.parameterDefinitions[name];
        if (!metadata) {
          return {
            code: ParameterErrorCode.REQUIRED_PARAMETER_MISSING,
            parameter: name,
            message: `Parameter ${name} is not defined`,
          };
        }
        return this.validateParameterValue(name, value, metadata);
      })
      .filter((error): error is ParameterValidationError => error !== null);
  }

  validateParameterValue(
    name: string,
    value: unknown,
    metadata: ParameterMetadata
  ): ParameterValidationError | null {
    switch (metadata.type) {
      case 'numeric':
        return this.validateNumericParameter(name, value, metadata);
      case 'enum':
        return this.validateEnumParameter(name, value, metadata);
      case 'boolean':
        return this.validateBooleanParameter(name, value, metadata);
      default:
        return {
          code: ParameterErrorCode.INVALID_TYPE,
          parameter: name,
          message: `Unknown parameter type: ${metadata.type}`,
        };
    }
  }

  private validateNumericParameter(
    name: string,
    value: unknown,
    metadata: NumericParameterMetadata
  ): ParameterValidationError | null {
    if (typeof value !== 'number') {
      return {
        code: ParameterErrorCode.INVALID_TYPE,
        parameter: name,
        message: `Parameter ${name} must be a number`,
        expected: 'number',
        received: typeof value,
      };
    }

    if (value < metadata.min || value > metadata.max) {
      return {
        code: ParameterErrorCode.OUT_OF_RANGE,
        parameter: name,
        message: `Parameter ${name} must be between ${metadata.min} and ${metadata.max}`,
        expected: `${metadata.min} <= value <= ${metadata.max}`,
        received: value.toString(),
      };
    }

    return null;
  }

  private validateEnumParameter(
    name: string,
    value: unknown,
    metadata: EnumParameterMetadata
  ): ParameterValidationError | null {
    if (typeof value !== 'string') {
      return {
        code: ParameterErrorCode.INVALID_TYPE,
        parameter: name,
        message: `Parameter ${name} must be a string`,
        expected: 'string',
        received: typeof value,
      };
    }

    if (!metadata.values.includes(value)) {
      return {
        code: ParameterErrorCode.INVALID_ENUM_VALUE,
        parameter: name,
        message: `Parameter ${name} must be one of: ${metadata.values.join(', ')}`,
        expected: metadata.values.join(' | '),
        received: value,
      };
    }

    return null;
  }

  private validateBooleanParameter(
    name: string,
    value: unknown,
    metadata: BooleanParameterMetadata
  ): ParameterValidationError | null {
    if (typeof value !== 'boolean') {
      return {
        code: ParameterErrorCode.INVALID_TYPE,
        parameter: name,
        message: `Parameter ${name} must be a boolean`,
        expected: 'boolean',
        received: typeof value,
      };
    }

    return null;
  }
}

// Common parameter ranges
export const ANGLE_RANGE = { min: -180, max: 180 };
export const POSITIVE_ANGLE_RANGE = { min: 0, max: 360 };
export const DISTANCE_RANGE = { min: 0, max: 100 };
export const NORMALIZED_RANGE = { min: 0, max: 1 };
export const FREQUENCY_RANGE = { min: 0.1, max: 10 };
export const SPEED_RANGE = { min: -10, max: 10 };
export const SIZE_RANGE = { min: 0.1, max: 100 };
export const RATIO_RANGE = { min: 0, max: 1 };
export const POSITION_RANGE = { min: -100, max: 100 };

// Common parameter steps
export const ANGLE_STEP = 1;
export const DISTANCE_STEP = 0.1;
export const NORMALIZED_STEP = 0.01;
export const FREQUENCY_STEP = 0.1;
export const SPEED_STEP = 0.1;
export const SIZE_STEP = 0.1;
export const RATIO_STEP = 0.01;
export const POSITION_STEP = 0.1;

// Unit compatibility groups
export const UNIT_COMPATIBILITY: Record<ParameterUnit, ParameterUnit[]> = {
  [ParameterUnit.NONE]: [ParameterUnit.NONE],
  [ParameterUnit.METERS]: [ParameterUnit.METERS],
  [ParameterUnit.DEGREES]: [ParameterUnit.DEGREES, ParameterUnit.RADIANS],
  [ParameterUnit.RADIANS]: [ParameterUnit.RADIANS, ParameterUnit.DEGREES],
  [ParameterUnit.HERTZ]: [ParameterUnit.HERTZ],
  [ParameterUnit.SECONDS]: [ParameterUnit.SECONDS],
  [ParameterUnit.RATIO]: [ParameterUnit.RATIO],
  [ParameterUnit.RADIANS_PER_SECOND]: [ParameterUnit.RADIANS_PER_SECOND, ParameterUnit.DEGREES_PER_SECOND],
  [ParameterUnit.DEGREES_PER_SECOND]: [ParameterUnit.DEGREES_PER_SECOND, ParameterUnit.RADIANS_PER_SECOND],
  [ParameterUnit.METERS_PER_SECOND]: [ParameterUnit.METERS_PER_SECOND],
};

// Common parameter definitions
export const COMMON_PARAMETERS: ParameterDefinitions = {
  azimuth: {
    type: 'numeric',
    description: 'Horizontal angle in degrees (-180 to 180)',
    label: '',
    unit: ParameterUnit.DEGREES,
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
  },
  elevation: {
    type: 'numeric',
    description: 'Vertical angle in degrees (-90 to 90)',
    label: '',
    unit: ParameterUnit.DEGREES,
    min: -90,
    max: 90,
    step: 1,
    defaultValue: 0,
  },
  distance: {
    type: 'numeric',
    description: 'Distance in meters (0 to infinity)',
    label: '',
    unit: ParameterUnit.METERS,
    min: 0,
    max: Infinity,
    step: 1,
    defaultValue: 10,
  },
  speed: {
    type: 'numeric',
    description: 'Speed in units per second',
    label: '',
    unit: ParameterUnit.RATIO,
    min: -10,
    max: 10,
    step: 1,
    defaultValue: 1,
  },
  phase: {
    type: 'numeric',
    description: 'Phase offset in degrees',
    label: '',
    unit: ParameterUnit.DEGREES,
    min: -180,
    max: 180,
    step: 1,
    defaultValue: 0,
  },
  frequency: {
    type: 'numeric',
    description: 'Frequency in Hertz',
    label: '',
    unit: ParameterUnit.HERTZ,
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 1,
  },
  axis: {
    type: 'enum',
    description: 'Movement axis (X, Y, Z)',
    label: '',
    unit: ParameterUnit.NONE,
    values: ['X', 'Y', 'Z'],
    defaultValue: 'X',
  },
  plane: {
    type: 'enum',
    description: 'Rotation plane (XY, YZ, XZ)',
    label: '',
    unit: ParameterUnit.NONE,
    values: ['XY', 'YZ', 'XZ'],
    defaultValue: 'XY',
  },
};
