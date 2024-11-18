import {
  XYZPosition,
  AEDPosition,
  createXYZPosition,
  createAEDPosition,
  convertXYZtoAED,
  convertAEDtoXYZ,
  interpolatePositions,
  validatePosition,
  normalizePosition,
  isXYZPosition,
  isAEDPosition
} from '../position';

describe('Position Types', () => {
  describe('Type Guards', () => {
    it('should correctly identify XYZ positions', () => {
      const xyz = createXYZPosition(1, 2, 3);
      const aed = createAEDPosition(45, 30, 5);
      
      expect(isXYZPosition(xyz)).toBe(true);
      expect(isXYZPosition(aed)).toBe(false);
    });

    it('should correctly identify AED positions', () => {
      const xyz = createXYZPosition(1, 2, 3);
      const aed = createAEDPosition(45, 30, 5);
      
      expect(isAEDPosition(aed)).toBe(true);
      expect(isAEDPosition(xyz)).toBe(false);
    });
  });

  describe('Position Creation', () => {
    it('should create valid XYZ positions', () => {
      const pos = createXYZPosition(1, 2, 3);
      expect(pos.coordinate).toBe('xyz');
      expect(pos.values.x.value).toBe(1);
      expect(pos.values.y.value).toBe(2);
      expect(pos.values.z.value).toBe(3);
    });

    it('should create valid AED positions', () => {
      const pos = createAEDPosition(45, 30, 5);
      expect(pos.coordinate).toBe('aed');
      expect(pos.values.azimuth.value).toBe(45);
      expect(pos.values.elevation.value).toBe(30);
      expect(pos.values.distance.value).toBe(5);
    });
  });

  describe('Coordinate Conversions', () => {
    it('should convert from XYZ to AED', () => {
      const xyz = createXYZPosition(1, 0, 1); // 45 degrees azimuth, 0 elevation, ~1.414 distance
      const aed = convertXYZtoAED(xyz);
      
      expect(aed.values.azimuth.value).toBeCloseTo(45);
      expect(aed.values.elevation.value).toBeCloseTo(0);
      expect(aed.values.distance.value).toBeCloseTo(Math.sqrt(2));
    });

    it('should convert from AED to XYZ', () => {
      const aed = createAEDPosition(45, 0, Math.sqrt(2)); // Should give x=1, y=0, z=1
      const xyz = convertAEDtoXYZ(aed);
      
      expect(xyz.values.x.value).toBeCloseTo(1);
      expect(xyz.values.y.value).toBeCloseTo(0);
      expect(xyz.values.z.value).toBeCloseTo(1);
    });

    it('should handle edge cases in conversions', () => {
      // Test zero distance
      const zeroDistance = createAEDPosition(45, 30, 0);
      const xyz = convertAEDtoXYZ(zeroDistance);
      expect(xyz.values.x.value).toBeCloseTo(0);
      expect(xyz.values.y.value).toBeCloseTo(0);
      expect(xyz.values.z.value).toBeCloseTo(0);

      // Test vertical position (90° elevation)
      const vertical = createAEDPosition(0, 90, 1);
      const xyzVertical = convertAEDtoXYZ(vertical);
      expect(xyzVertical.values.x.value).toBeCloseTo(0);
      expect(xyzVertical.values.y.value).toBeCloseTo(1);
      expect(xyzVertical.values.z.value).toBeCloseTo(0);
    });
  });

  describe('Position Interpolation', () => {
    it('should interpolate between XYZ positions', () => {
      const start = createXYZPosition(0, 0, 0);
      const end = createXYZPosition(2, 4, 6);
      const mid = interpolatePositions(start, end, 0.5);
      
      expect(mid.values.x.value).toBe(1);
      expect(mid.values.y.value).toBe(2);
      expect(mid.values.z.value).toBe(3);
    });

    it('should interpolate between AED positions', () => {
      const start = createAEDPosition(0, 0, 1);
      const end = createAEDPosition(90, 45, 2);
      const mid = interpolatePositions(start, end, 0.5);
      
      expect(mid.values.azimuth.value).toBe(45);
      expect(mid.values.elevation.value).toBe(22.5);
      expect(mid.values.distance.value).toBe(1.5);
    });

    it('should handle cross-coordinate interpolation', () => {
      const xyz = createXYZPosition(1, 0, 0);
      const aed = createAEDPosition(90, 0, 1);
      const mid = interpolatePositions(xyz, aed, 0.5);
      
      // Result should be in the start position's coordinate system
      expect(isXYZPosition(mid)).toBe(true);
    });
  });

  describe('Position Validation', () => {
    it('should validate XYZ positions within bounds', () => {
      const valid = createXYZPosition(10, 10, 10);
      const invalid = createXYZPosition(200, 200, 200);
      
      expect(validatePosition(valid)).toBe(true);
      expect(validatePosition(invalid)).toBe(false);
    });

    it('should validate AED positions within bounds', () => {
      const valid = createAEDPosition(45, 30, 10);
      const invalid = createAEDPosition(200, 100, 200);
      
      expect(validatePosition(valid)).toBe(true);
      expect(validatePosition(invalid)).toBe(false);
    });
  });

  describe('Position Normalization', () => {
    it('should normalize XYZ positions to bounds', () => {
      const pos = createXYZPosition(200, -200, 150);
      const normalized = normalizePosition(pos);
      
      expect(normalized.values.x.value).toBe(100);
      expect(normalized.values.y.value).toBe(-100);
      expect(normalized.values.z.value).toBe(100);
    });

    it('should normalize AED positions to bounds', () => {
      const pos = createAEDPosition(200, 100, 200);
      const normalized = normalizePosition(pos);
      
      expect(normalized.values.azimuth.value).toBe(180);
      expect(normalized.values.elevation.value).toBe(90);
      expect(normalized.values.distance.value).toBe(100);
    });
  });
});
