import {
  createXYZPosition,
  createAEDPosition,
  isXYZPosition,
  isAEDPosition,
  interpolatePositions,
  normalizePosition,
  aedToXYZ,
  xyzToAED,
  ensureXYZPosition,
  ensureAEDPosition
} from '../position';

describe('Position Types', () => {
  describe('Type Guards', () => {
    it('should correctly identify XYZ positions', () => {
      const xyz = createXYZPosition(1, 2, 3);
      expect(isXYZPosition(xyz)).toBe(true);
      expect(isAEDPosition(xyz)).toBe(false);
    });

    it('should correctly identify AED positions', () => {
      const aed = createAEDPosition(45, 30, 10);
      expect(isXYZPosition(aed)).toBe(false);
      expect(isAEDPosition(aed)).toBe(true);
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert from XYZ to AED', () => {
      const xyz = createXYZPosition(1, 1, 1);
      const aed = xyzToAED(xyz);
      
      expect(aed.type).toBe('aed');
      expect(Math.round(aed.azimuth)).toBe(45);
      expect(Math.round(aed.elevation)).toBe(35);
      expect(Math.round(aed.distance * 100) / 100).toBe(1.73);
    });

    it('should convert from AED to XYZ', () => {
      const aed = createAEDPosition(45, 30, 10);
      const xyz = aedToXYZ(aed);
      
      expect(xyz.type).toBe('xyz');
      expect(Math.round(xyz.x * 100) / 100).toBe(6.12);
      expect(Math.round(xyz.y * 100) / 100).toBe(6.12);
      expect(Math.round(xyz.z * 100) / 100).toBe(5);
    });
  });

  describe('Position Interpolation', () => {
    it('should interpolate between XYZ positions', () => {
      const pos1 = createXYZPosition(0, 0, 0);
      const pos2 = createXYZPosition(2, 4, 6);
      const mid = interpolatePositions(pos1, pos2, 0.5);
      
      const xyz = ensureXYZPosition(mid);
      expect(xyz.x).toBe(1);
      expect(xyz.y).toBe(2);
      expect(xyz.z).toBe(3);
    });

    it('should interpolate between AED positions', () => {
      const pos1 = createAEDPosition(0, 0, 1);
      const pos2 = createAEDPosition(90, 45, 2);
      const mid = interpolatePositions(pos1, pos2, 0.5);
      
      const aed = ensureAEDPosition(mid);
      expect(aed.azimuth).toBe(45);
      expect(aed.elevation).toBe(22.5);
      expect(aed.distance).toBe(1.5);
    });

    it('should handle cross-coordinate interpolation', () => {
      const xyz = createXYZPosition(1, 1, 1);
      const aed = createAEDPosition(45, 30, 2);
      const mid = interpolatePositions(xyz, aed, 0.5);
      
      expect(isXYZPosition(mid) || isAEDPosition(mid)).toBe(true);
    });
  });

  describe('Position Normalization', () => {
    it('should normalize XYZ positions to bounds', () => {
      const pos = createXYZPosition(200, -200, 200);
      const normalized = normalizePosition(pos);
      
      const xyz = ensureXYZPosition(normalized);
      expect(xyz.x).toBe(100);
      expect(xyz.y).toBe(-100);
      expect(xyz.z).toBe(100);
    });

    it('should normalize AED positions to bounds', () => {
      const pos = createAEDPosition(270, 120, 200);
      const normalized = normalizePosition(pos);
      
      const aed = ensureAEDPosition(normalized);
      expect(aed.azimuth).toBe(-90);
      expect(aed.elevation).toBe(90);
      expect(aed.distance).toBe(100);
    });
  });
});
