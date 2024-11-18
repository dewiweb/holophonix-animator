import { LinearBehavior } from '../implementations/linear';
import { SineWaveBehavior } from '../implementations/sine';
import { CircleBehavior } from '../implementations/circle';
import { OrbitBehavior } from '../implementations/orbit';
import { isXYZPosition, isAEDPosition, validatePosition } from '../../types/position';

describe('Behavior Implementations', () => {
  describe('Linear Behavior', () => {
    let behavior: LinearBehavior;

    beforeEach(() => {
      behavior = new LinearBehavior();
    });

    it('should move along specified axis', () => {
      // Test X axis
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
      const posX = behavior.update(1000).xyz;
      expect(posX.values.x.value).not.toBe(0);
      expect(posX.values.y.value).toBe(0);
      expect(posX.values.z.value).toBe(0);

      // Test Y axis
      behavior.setParameters({ axis: 1, speed: 1, distance: 10 });
      const posY = behavior.update(1000).xyz;
      expect(posY.values.x.value).toBe(0);
      expect(posY.values.y.value).not.toBe(0);
      expect(posY.values.z.value).toBe(0);

      // Test Z axis
      behavior.setParameters({ axis: 2, speed: 1, distance: 10 });
      const posZ = behavior.update(1000).xyz;
      expect(posZ.values.x.value).toBe(0);
      expect(posZ.values.y.value).toBe(0);
      expect(posZ.values.z.value).not.toBe(0);
    });

    it('should respect speed parameter', () => {
      behavior.setParameters({ axis: 0, speed: 2, distance: 10 });
      const pos1 = behavior.update(1000).xyz;
      
      behavior.reset();
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
      const pos2 = behavior.update(1000).xyz;
      
      expect(Math.abs(pos1.values.x.value)).toBeGreaterThan(Math.abs(pos2.values.x.value));
    });

    it('should respect distance bounds', () => {
      behavior.setParameters({ axis: 0, speed: 10, distance: 5 });
      const pos = behavior.update(10000).xyz; // Long time to ensure we hit bounds
      expect(Math.abs(pos.values.x.value)).toBeLessThanOrEqual(5);
    });
  });

  describe('Sine Wave Behavior', () => {
    let behavior: SineWaveBehavior;

    beforeEach(() => {
      behavior = new SineWaveBehavior();
    });

    it('should oscillate along specified axis', () => {
      // Test X axis
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250).xyz);
      
      // Check oscillation
      const xValues = positions.map(p => p.values.x.value);
      expect(Math.max(...xValues)).toBeGreaterThan(0);
      expect(Math.min(...xValues)).toBeLessThan(0);
      
      // Check other axes remain at 0
      positions.forEach(p => {
        expect(p.values.y.value).toBe(0);
        expect(p.values.z.value).toBe(0);
      });
    });

    it('should respect frequency parameter', () => {
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const pos1 = behavior.update(250).xyz;
      
      behavior.reset();
      behavior.setParameters({ axis: 0, frequency: 2, amplitude: 10, phase: 0 });
      const pos2 = behavior.update(250).xyz;
      
      expect(Math.abs(pos1.values.x.value)).not.toBeCloseTo(Math.abs(pos2.values.x.value));
    });

    it('should respect phase parameter', () => {
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const pos1 = behavior.update(0).xyz;
      
      behavior.reset();
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 180 });
      const pos2 = behavior.update(0).xyz;
      
      expect(pos1.values.x.value).toBeCloseTo(-pos2.values.x.value);
    });
  });

  describe('Circle Behavior', () => {
    let behavior: CircleBehavior;

    beforeEach(() => {
      behavior = new CircleBehavior();
    });

    it('should move in a circle on specified plane', () => {
      // Test XY plane
      behavior.setParameters({ 
        plane: 0, 
        radius: 10, 
        speed: 1, 
        phase: 0,
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250).xyz);
      
      // Check circular motion
      positions.forEach(p => {
        const radius = Math.sqrt(p.values.x.value ** 2 + p.values.y.value ** 2);
        expect(radius).toBeCloseTo(10);
        expect(p.values.z.value).toBe(0);
      });
    });

    it('should respect center position', () => {
      behavior.setParameters({ 
        plane: 0, 
        radius: 10, 
        speed: 1, 
        phase: 0,
        centerX: 5,
        centerY: 5,
        centerZ: 5
      });

      const pos = behavior.update(0).xyz;
      const centerDistance = Math.sqrt(
        (pos.values.x.value - 5) ** 2 + 
        (pos.values.y.value - 5) ** 2
      );
      expect(centerDistance).toBeCloseTo(10);
      expect(pos.values.z.value).toBe(5);
    });
  });

  describe('Orbit Behavior', () => {
    let behavior: OrbitBehavior;

    beforeEach(() => {
      behavior = new OrbitBehavior();
    });

    it('should maintain constant distance', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 0,
        wobbleSpeed: 0
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250).aed);
      
      positions.forEach(p => {
        expect(p.values.distance.value).toBeCloseTo(10);
      });
    });

    it('should respect elevation parameter', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 0,
        wobbleSpeed: 0
      });

      const pos = behavior.update(0).aed;
      expect(pos.values.elevation.value).toBeCloseTo(45);
    });

    it('should apply wobble effect', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 10,
        wobbleSpeed: 1
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250).aed);
      const elevations = positions.map(p => p.values.elevation.value);
      
      // Check elevation varies
      expect(Math.max(...elevations)).toBeGreaterThan(45);
      expect(Math.min(...elevations)).toBeLessThan(45);
    });
  });

  describe('Common Behavior Requirements', () => {
    const behaviors = [
      new LinearBehavior(),
      new SineWaveBehavior(),
      new CircleBehavior(),
      new OrbitBehavior()
    ];

    it('should provide both XYZ and AED positions', () => {
      behaviors.forEach(behavior => {
        const result = behavior.update(0);
        expect(isXYZPosition(result.xyz)).toBe(true);
        expect(isAEDPosition(result.aed)).toBe(true);
      });
    });

    it('should produce valid positions', () => {
      behaviors.forEach(behavior => {
        const result = behavior.update(0);
        expect(validatePosition(result.xyz)).toBe(true);
        expect(validatePosition(result.aed)).toBe(true);
      });
    });

    it('should handle reset correctly', () => {
      behaviors.forEach(behavior => {
        const pos1 = behavior.update(1000);
        behavior.reset();
        const pos2 = behavior.update(0);
        
        // After reset, position should be different from position at t=1000
        expect(pos1.xyz.values.x.value).not.toBeCloseTo(pos2.xyz.values.x.value);
      });
    });
  });
});
