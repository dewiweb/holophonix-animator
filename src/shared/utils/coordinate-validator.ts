import { CartesianCoordinates, PolarCoordinates, TrackParameters } from '../types/osc.types';

/**
 * Validates cartesian coordinates according to system requirements
 * X, Y, Z must be between -1.0 and 1.0
 */
export function validateCartesian(coords: CartesianCoordinates): { valid: boolean; error?: string } {
  const { x, y, z } = coords;
  
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return { valid: false, error: 'Cartesian coordinates must be numbers' };
  }

  if (x < -1.0 || x > 1.0) {
    return { valid: false, error: 'X coordinate must be between -1.0 and 1.0' };
  }

  if (y < -1.0 || y > 1.0) {
    return { valid: false, error: 'Y coordinate must be between -1.0 and 1.0' };
  }

  if (z < -1.0 || z > 1.0) {
    return { valid: false, error: 'Z coordinate must be between -1.0 and 1.0' };
  }

  return { valid: true };
}

/**
 * Validates polar coordinates according to system requirements
 * Azimuth: 0° to 360°
 * Elevation: -90° to +90°
 * Distance: 0 to 1.0
 */
export function validatePolar(coords: PolarCoordinates): { valid: boolean; error?: string } {
  const { azim, elev, dist } = coords;

  if (typeof azim !== 'number' || typeof elev !== 'number' || typeof dist !== 'number') {
    return { valid: false, error: 'Polar coordinates must be numbers' };
  }

  if (azim < 0 || azim > 360) {
    return { valid: false, error: 'Azimuth must be between 0° and 360°' };
  }

  if (elev < -90 || elev > 90) {
    return { valid: false, error: 'Elevation must be between -90° and +90°' };
  }

  if (dist < 0 || dist > 1.0) {
    return { valid: false, error: 'Distance must be between 0 and 1.0' };
  }

  return { valid: true };
}

/**
 * Validates track parameters based on the coordinate system being used
 */
export function validateTrackParameters(parameter: keyof TrackParameters, value: any): { valid: boolean; error?: string } {
  if (parameter === 'cartesian' && typeof value === 'object') {
    return validateCartesian(value as CartesianCoordinates);
  }

  if (parameter === 'polar' && typeof value === 'object') {
    return validatePolar(value as PolarCoordinates);
  }

  // For non-coordinate parameters, return valid
  return { valid: true };
}
