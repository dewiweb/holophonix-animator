import { validateCartesian, validatePolar, validateTrackParameters } from '../coordinate-validator';
import { CartesianCoordinates, PolarCoordinates } from '../../types/osc.types';

describe('Coordinate Validator', () => {
  describe('validateCartesian', () => {
    it('should validate valid cartesian coordinates', () => {
      const coords: CartesianCoordinates = { x: 0.5, y: -0.3, z: 0.1 };
      const result = validateCartesian(coords);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject coordinates outside valid range', () => {
      const coords: CartesianCoordinates = { x: 1.5, y: 0, z: 0 };
      const result = validateCartesian(coords);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('X coordinate must be between -1.0 and 1.0');
    });

    it('should reject non-number values', () => {
      const coords = { x: 'invalid', y: 0, z: 0 } as any;
      const result = validateCartesian(coords);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cartesian coordinates must be numbers');
    });
  });

  describe('validatePolar', () => {
    it('should validate valid polar coordinates', () => {
      const coords: PolarCoordinates = { azim: 180, elev: 45, dist: 0.5 };
      const result = validatePolar(coords);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject azimuth outside valid range', () => {
      const coords: PolarCoordinates = { azim: 400, elev: 0, dist: 0.5 };
      const result = validatePolar(coords);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Azimuth must be between 0° and 360°');
    });

    it('should reject elevation outside valid range', () => {
      const coords: PolarCoordinates = { azim: 180, elev: 100, dist: 0.5 };
      const result = validatePolar(coords);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Elevation must be between -90° and +90°');
    });

    it('should reject distance outside valid range', () => {
      const coords: PolarCoordinates = { azim: 180, elev: 0, dist: 1.5 };
      const result = validatePolar(coords);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Distance must be between 0 and 1.0');
    });
  });

  describe('validateTrackParameters', () => {
    it('should validate cartesian parameters', () => {
      const value = { x: 0.5, y: -0.3, z: 0.1 };
      const result = validateTrackParameters('cartesian', value);
      expect(result.valid).toBe(true);
    });

    it('should validate polar parameters', () => {
      const value = { azim: 180, elev: 45, dist: 0.5 };
      const result = validateTrackParameters('polar', value);
      expect(result.valid).toBe(true);
    });

    it('should pass through non-coordinate parameters', () => {
      const result = validateTrackParameters('gain', 0.5);
      expect(result.valid).toBe(true);
    });
  });
});
