import { ParameterUnit, UNIT_COMPATIBILITY } from '../types/parameters';

// Conversion factors
const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

interface TransformOptions {
  clamp?: boolean;
  round?: boolean;
  precision?: number;
}

export class ParameterTransform {
  /**
   * Check if two units are compatible for conversion
   */
  static areUnitsCompatible(fromUnit: ParameterUnit, toUnit: ParameterUnit): boolean {
    return UNIT_COMPATIBILITY[fromUnit]?.includes(toUnit) ?? false;
  }

  /**
   * Convert between different parameter units
   */
  static convertUnit(
    value: number,
    fromUnit: ParameterUnit,
    toUnit: ParameterUnit
  ): number {
    // Same unit, no conversion needed
    if (fromUnit === toUnit) return value;

    // Check unit compatibility
    if (!this.areUnitsCompatible(fromUnit, toUnit)) {
      throw new Error(`Incompatible units: Cannot convert from ${fromUnit} to ${toUnit}`);
    }

    // Angular conversions
    if (fromUnit === ParameterUnit.DEGREES && toUnit === ParameterUnit.RADIANS) {
      return value * DEGREES_TO_RADIANS;
    }
    if (fromUnit === ParameterUnit.RADIANS && toUnit === ParameterUnit.DEGREES) {
      return value * RADIANS_TO_DEGREES;
    }

    // Rate conversions
    if (fromUnit === ParameterUnit.DEGREES_PER_SECOND && toUnit === ParameterUnit.RADIANS_PER_SECOND) {
      return value * DEGREES_TO_RADIANS;
    }
    if (fromUnit === ParameterUnit.RADIANS_PER_SECOND && toUnit === ParameterUnit.DEGREES_PER_SECOND) {
      return value * RADIANS_TO_DEGREES;
    }

    // For compatible units with no conversion needed
    return value;
  }

  /**
   * Normalize a value to a 0-1 range based on min/max
   */
  static normalize(
    value: number,
    min: number,
    max: number,
    options: TransformOptions = {}
  ): number {
    const normalized = (value - min) / (max - min);
    return options.clamp ? Math.max(0, Math.min(1, normalized)) : normalized;
  }

  /**
   * Denormalize a value from 0-1 range to min/max range
   */
  static denormalize(
    normalized: number,
    min: number,
    max: number,
    options: TransformOptions = {}
  ): number {
    const value = normalized * (max - min) + min;
    return options.clamp ? Math.max(min, Math.min(max, value)) : value;
  }

  /**
   * Snap a value to the nearest step
   */
  static snap(
    value: number,
    step: number,
    options: TransformOptions = {}
  ): number {
    const snapped = Math.round(value / step) * step;
    if (options.round) {
      const precision = options.precision ?? 6;
      return Number(snapped.toFixed(precision));
    }
    return snapped;
  }

  /**
   * Format a value for display based on its unit
   */
  static format(
    value: number,
    unit: ParameterUnit,
    options: TransformOptions = {}
  ): string {
    const precision = options.precision ?? 2;
    const formatted = Number(value.toFixed(precision));

    switch (unit) {
      case ParameterUnit.DEGREES:
      case ParameterUnit.DEGREES_PER_SECOND:
        return `${formatted}°`;
      case ParameterUnit.RADIANS:
      case ParameterUnit.RADIANS_PER_SECOND:
        return `${formatted} rad`;
      case ParameterUnit.METERS:
        return `${formatted}m`;
      case ParameterUnit.METERS_PER_SECOND:
        return `${formatted}m/s`;
      case ParameterUnit.HERTZ:
        return `${formatted}Hz`;
      case ParameterUnit.SECONDS:
        return `${formatted}s`;
      case ParameterUnit.RATIO:
        return `${formatted}%`;
      case ParameterUnit.NONE:
      default:
        return `${formatted}`;
    }
  }

  /**
   * Parse a formatted string back to a number
   */
  static parse(
    formatted: string,
    unit: ParameterUnit
  ): number {
    // Unit-specific parsing patterns
    const patterns: Record<ParameterUnit, RegExp> = {
      [ParameterUnit.DEGREES]: /^([+-]?\d*\.?\d+)\s*°?$/,
      [ParameterUnit.RADIANS]: /^([+-]?\d*\.?\d+)\s*rad?$/,
      [ParameterUnit.METERS]: /^([+-]?\d*\.?\d+)\s*m$/,
      [ParameterUnit.HERTZ]: /^([+-]?\d*\.?\d+)\s*Hz$/,
      [ParameterUnit.SECONDS]: /^([+-]?\d*\.?\d+)\s*s$/,
      [ParameterUnit.RATIO]: /^([+-]?\d*\.?\d+)\s*%?$/,
      [ParameterUnit.DEGREES_PER_SECOND]: /^([+-]?\d*\.?\d+)\s*°\/s$/,
      [ParameterUnit.RADIANS_PER_SECOND]: /^([+-]?\d*\.?\d+)\s*rad\/s$/,
      [ParameterUnit.METERS_PER_SECOND]: /^([+-]?\d*\.?\d+)\s*m\/s$/,
      [ParameterUnit.NONE]: /^([+-]?\d*\.?\d+)$/,
    };

    const pattern = patterns[unit];
    const match = formatted.trim().match(pattern);

    if (!match) {
      throw new Error(`Invalid format for ${unit}: ${formatted}`);
    }

    const value = parseFloat(match[1]);
    if (isNaN(value)) {
      throw new Error(`Invalid number format: ${formatted}`);
    }

    return value;
  }

  /**
   * Interpolate between two values
   */
  static interpolate(
    start: number,
    end: number,
    t: number,
    options: TransformOptions = {}
  ): number {
    const value = start + (end - start) * t;
    if (options.round) {
      const precision = options.precision ?? 6;
      return Number(value.toFixed(precision));
    }
    return value;
  }
}
