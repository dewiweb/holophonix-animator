import { LinearBehavior } from '../../behaviors/implementations/1d/linear';
import { SineBehavior } from '../../behaviors/implementations/1d/sine';
import { CircleBehavior } from '../../behaviors/implementations/2d/circle';
import { OrbitBehavior } from '../../behaviors/implementations/3d/orbit';
import { BaseBehavior } from '../../behaviors/base';

describe('Behavior System Performance', () => {
  const measureTime = (fn: () => void, iterations: number = 1000): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    return (end - start) / iterations; // Average time per operation in ms
  };

  const PERFORMANCE_THRESHOLD = {
    UPDATE: 0.05, // 0.05ms per update
    PARAMETER_SET: 0.01, // 0.01ms per parameter set
    BATCH_UPDATE: 5 // 5ms for 100 updates
  };

  describe('Individual Behavior Performance', () => {
    let behaviors: BaseBehavior[];

    beforeEach(() => {
      const linear = new LinearBehavior();
      linear.setParameters({ axis: 0, speed: 1, distance: 10 });

      const sine = new SineBehavior();
      sine.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });

      const circle = new CircleBehavior();
      circle.setParameters({ 
        plane: 0, 
        radius: 10, 
        speed: 1, 
        phase: 0,
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });

      const orbit = new OrbitBehavior();
      orbit.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 0,
        wobbleSpeed: 0
      });

      behaviors = [linear, sine, circle, orbit];
    });

    it('should update positions efficiently', () => {
      behaviors.forEach(behavior => {
        const time = measureTime(() => {
          behavior.update(1000);
        });
        
        expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.UPDATE);
      });
    });

    it('should set parameters efficiently', () => {
      const linear = new LinearBehavior();
      const time = measureTime(() => {
        linear.setParameters({ axis: 0, speed: 1, distance: 10 });
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.PARAMETER_SET);
    });

    it('should handle rapid updates efficiently', () => {
      behaviors.forEach(behavior => {
        const UPDATE_COUNT = 100;
        const time = measureTime(() => {
          for (let i = 0; i < UPDATE_COUNT; i++) {
            behavior.update(i * 16); // 60fps simulation
          }
        });
        
        expect(time * UPDATE_COUNT).toBeLessThan(PERFORMANCE_THRESHOLD.BATCH_UPDATE);
      });
    });
  });

  describe('Multiple Behavior Performance', () => {
    it('should handle multiple behaviors efficiently', () => {
      const BEHAVIOR_COUNT = 100;
      const behaviors: BaseBehavior[] = [];

      // Create behaviors
      for (let i = 0; i < BEHAVIOR_COUNT; i++) {
        const behavior = new LinearBehavior();
        behavior.setParameters({ axis: i % 3, speed: 1, distance: 10 });
        behaviors.push(behavior);
      }

      const time = measureTime(() => {
        behaviors.forEach(behavior => behavior.update(1000));
      }, 10); // 10 iterations of 100 behavior updates

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.UPDATE * BEHAVIOR_COUNT);
    });

    it('should handle mixed behavior types efficiently', () => {
      const BEHAVIOR_COUNT = 100;
      const behaviors: BaseBehavior[] = [];

      // Create mixed behaviors
      for (let i = 0; i < BEHAVIOR_COUNT; i++) {
        let behavior: BaseBehavior;
        switch (i % 4) {
          case 0:
            behavior = new LinearBehavior();
            behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
            break;
          case 1:
            behavior = new SineBehavior();
            behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
            break;
          case 2:
            behavior = new CircleBehavior();
            behavior.setParameters({ 
              plane: 0, 
              radius: 10, 
              speed: 1, 
              phase: 0,
              centerX: 0,
              centerY: 0,
              centerZ: 0
            });
            break;
          default:
            behavior = new OrbitBehavior();
            behavior.setParameters({ 
              distance: 10,
              speed: 1,
              elevation: 45,
              phase: 0,
              wobble: 0,
              wobbleSpeed: 0
            });
        }
        behaviors.push(behavior);
      }

      const time = measureTime(() => {
        behaviors.forEach(behavior => behavior.update(1000));
      }, 10); // 10 iterations of 100 behavior updates

      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.UPDATE * BEHAVIOR_COUNT);
    });
  });

  describe('Memory Management', () => {
    it('should handle behavior cleanup efficiently', () => {
      const BEHAVIOR_COUNT = 1000;
      const behaviors: BaseBehavior[] = [];

      // Create and destroy behaviors
      const time = measureTime(() => {
        // Create behaviors
        for (let i = 0; i < BEHAVIOR_COUNT; i++) {
          const behavior = new LinearBehavior();
          behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
          behaviors.push(behavior);
        }

        // Use behaviors
        behaviors.forEach(behavior => behavior.update(1000));

        // Clean up
        behaviors.length = 0;
      }, 1);

      expect(time).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle parameter updates efficiently', () => {
      const behavior = new LinearBehavior();
      const UPDATE_COUNT = 10000;

      const time = measureTime(() => {
        for (let i = 0; i < UPDATE_COUNT; i++) {
          behavior.setParameters({ 
            axis: i % 3, 
            speed: Math.sin(i), 
            distance: Math.cos(i) * 10 
          });
        }
      });

      expect(time * UPDATE_COUNT).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
