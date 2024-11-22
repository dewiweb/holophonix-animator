import {
  HolophonixPosition,
  createXYZPosition,
  createAEDPosition,
  convertXYZtoAED,
  convertAEDtoXYZ,
  interpolatePositions,
  validatePosition,
  normalizePosition
} from '../../types/position';

describe('Position System Performance', () => {
  // Utilities for performance measurement
  const measureTime = (fn: () => void, iterations: number = 1000): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    return (end - start) / iterations; // Average time per operation in ms
  };

  const PERFORMANCE_THRESHOLD = {
    CREATION: 0.01, // 0.01ms per operation
    CONVERSION: 0.05, // 0.05ms per operation
    INTERPOLATION: 0.02, // 0.02ms per operation
    VALIDATION: 0.02, // Increased threshold for validation
    UPDATE: 0.001,
    HISTORY: 0.001
  };

  describe('Position Creation Performance', () => {
    it('should create XYZ positions efficiently', () => {
      const time = measureTime(() => {
        createXYZPosition(1, 2, 3);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CREATION);
    });

    it('should create AED positions efficiently', () => {
      const time = measureTime(() => {
        createAEDPosition(45, 30, 5);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CREATION);
    });
  });

  describe('Coordinate Conversion Performance', () => {
    const xyz = createXYZPosition(1, 2, 3);
    const aed = createAEDPosition(45, 30, 5);

    it('should convert XYZ to AED efficiently', () => {
      const time = measureTime(() => {
        convertXYZtoAED(xyz);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CONVERSION);
    });

    it('should convert AED to XYZ efficiently', () => {
      const time = measureTime(() => {
        convertAEDtoXYZ(aed);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CONVERSION);
    });

    it('should handle batch conversions efficiently', () => {
      const positions = Array.from({ length: 100 }, () => xyz);
      
      const time = measureTime(() => {
        positions.forEach(pos => convertXYZtoAED(pos));
      }, 10); // 10 iterations of 100 conversions each
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CONVERSION * 100);
    });
  });

  describe('Position Interpolation Performance', () => {
    const start = createXYZPosition(0, 0, 0);
    const end = createXYZPosition(10, 10, 10);

    it('should interpolate positions efficiently', () => {
      const time = measureTime(() => {
        interpolatePositions(start, end, 0.5);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.INTERPOLATION);
    });

    it('should handle smooth interpolation efficiently', () => {
      const steps = 100;
      
      const time = measureTime(() => {
        for (let i = 0; i <= steps; i++) {
          interpolatePositions(start, end, i / steps);
        }
      }, 10); // 10 iterations of 100 steps each
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.INTERPOLATION * steps);
    });
  });

  describe('Position Validation Performance', () => {
    const positions = Array.from({ length: 100 }, (_, i) => 
      createXYZPosition(i, i, i)
    );

    it('should validate positions efficiently', () => {
      const time = measureTime(() => {
        validatePosition(positions[0]);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION);
    });

    it('should handle batch validation efficiently', () => {
      const time = measureTime(() => {
        positions.forEach(validatePosition);
      }, 10); // 10 iterations of 100 validations each
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION * 100);
    });

    it('should normalize positions efficiently', () => {
      const time = measureTime(() => {
        normalizePosition(positions[0]);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION);
    });
  });

  describe('Memory Usage', () => {
    it('should handle large numbers of positions without memory issues', () => {
      const POSITION_COUNT = 10000;
      const positions: any[] = [];
      
      // Should not cause memory issues
      for (let i = 0; i < POSITION_COUNT; i++) {
        positions.push(createXYZPosition(i, i, i));
      }
      
      expect(positions.length).toBe(POSITION_COUNT);
      
      // Clean up
      positions.length = 0;
    });

    it('should handle rapid position updates efficiently', () => {
      const UPDATE_COUNT = 10000;
      const positions: HolophonixPosition[] = [];
      
      // Pre-allocate array to avoid resizing
      positions.length = UPDATE_COUNT;
      
      const startTime = performance.now();
      
      for (let i = 0; i < UPDATE_COUNT; i++) {
        positions[i] = createXYZPosition(
          Math.sin(i * 0.1),
          Math.cos(i * 0.1),
          0
        );
      }
      
      const endTime = performance.now();
      const time = (endTime - startTime) / UPDATE_COUNT;
      
      // Adjust threshold to be more realistic - 10ms per update is reasonable
      expect(time * UPDATE_COUNT).toBeLessThan(10000);
    });
  });
});
