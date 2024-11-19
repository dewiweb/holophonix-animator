import { LinearBehavior } from '../../behaviors/implementations/1d/linear';
import { SineBehavior } from '../../behaviors/implementations/1d/sine';
import { CircleBehavior } from '../../behaviors/implementations/2d/circle';
import { LeaderFollowerManager } from '../../behaviors/group/leader-follower';
import { IsobarycentricManager } from '../../behaviors/group/isobarycentric';
import { createXYZPosition } from '../../types/position';

describe('Group Behavior Performance', () => {
  const measureTime = (fn: () => void, iterations: number = 1000): number => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = performance.now();
    return (end - start) / iterations; // Average time per operation in ms
  };

  const PERFORMANCE_THRESHOLD = {
    SINGLE_UPDATE: 0.1, // 0.1ms per update
    BATCH_UPDATE: 1.0, // 1ms per batch update
    MEMBER_ADD: 0.05, // 0.05ms per member addition
    CENTER_CALC: 0.2, // 0.2ms for center calculation
    POSITION_CALC: 0.1 // 0.1ms for position calculation
  };

  describe('Leader-Follower Performance', () => {
    let leader: LinearBehavior;
    let manager: LeaderFollowerManager;

    beforeEach(() => {
      leader = new LinearBehavior();
      leader.setParameters({ axis: 0, speed: 1, distance: 10 });
      manager = new LeaderFollowerManager(leader);
    });

    it('should handle single follower updates efficiently', () => {
      const follower = new LinearBehavior();
      follower.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      manager.addFollower(1, follower, {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        delay: 1,
        scale: 1
      });

      const time = measureTime(() => {
        manager.update(1000);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_UPDATE);
    });

    it('should handle multiple followers efficiently', () => {
      const FOLLOWER_COUNT = 100;
      
      // Add multiple followers
      for (let i = 0; i < FOLLOWER_COUNT; i++) {
        const follower = new LinearBehavior();
        follower.setParameters({ axis: 0, speed: 1, distance: 10 });
        
        manager.addFollower(i, follower, {
          offsetX: i,
          offsetY: 0,
          offsetZ: 0,
          delay: 0,
          scale: 1
        });
      }

      const time = measureTime(() => {
        manager.update(1000);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.BATCH_UPDATE);
    });

    it('should handle rapid follower addition efficiently', () => {
      const FOLLOWER_COUNT = 100;
      const follower = new LinearBehavior();
      follower.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      const time = measureTime(() => {
        manager.addFollower(1, follower, {
          offsetX: 0,
          offsetY: 0,
          offsetZ: 0,
          delay: 0,
          scale: 1
        });
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.MEMBER_ADD);
    });

    it('should handle continuous updates efficiently', () => {
      const FOLLOWER_COUNT = 10;
      const UPDATE_COUNT = 100;
      
      // Add followers
      for (let i = 0; i < FOLLOWER_COUNT; i++) {
        const follower = new LinearBehavior();
        follower.setParameters({ axis: 0, speed: 1, distance: 10 });
        
        manager.addFollower(i, follower, {
          offsetX: i,
          offsetY: 0,
          offsetZ: 0,
          delay: 0,
          scale: 1
        });
      }

      const time = measureTime(() => {
        for (let t = 0; t < UPDATE_COUNT; t++) {
          manager.update(t * 16); // 60fps simulation
        }
      });
      
      expect(time * UPDATE_COUNT).toBeLessThan(PERFORMANCE_THRESHOLD.BATCH_UPDATE * UPDATE_COUNT);
    });
  });

  describe('Isobarycentric Performance', () => {
    let manager: IsobarycentricManager;

    beforeEach(() => {
      manager = new IsobarycentricManager();
    });

    it('should calculate center efficiently', () => {
      const MEMBER_COUNT = 100;
      
      // Add members
      for (let i = 0; i < MEMBER_COUNT; i++) {
        const behavior = new LinearBehavior();
        behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
        
        manager.addMember(i, behavior, {
          weight: 1,
          radius: 10,
          phase: i * (360 / MEMBER_COUNT),
          speed: 1
        });
      }

      const time = measureTime(() => {
        manager.update(0);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.CENTER_CALC);
    });

    it('should handle mixed behavior types efficiently', () => {
      const MEMBER_COUNT = 100;
      
      // Add different behavior types
      for (let i = 0; i < MEMBER_COUNT; i++) {
        let behavior;
        switch (i % 3) {
          case 0:
            behavior = new LinearBehavior();
            behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
            break;
          case 1:
            behavior = new SineBehavior();
            behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
            break;
          default:
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
        }
        
        manager.addMember(i, behavior, {
          weight: 1,
          radius: 10,
          phase: i * (360 / MEMBER_COUNT),
          speed: 1
        });
      }

      const time = measureTime(() => {
        manager.update(1000);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.BATCH_UPDATE);
    });

    it('should handle continuous rotation efficiently', () => {
      const MEMBER_COUNT = 10;
      const UPDATE_COUNT = 100;
      
      // Add members
      for (let i = 0; i < MEMBER_COUNT; i++) {
        const behavior = new LinearBehavior();
        behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
        
        manager.addMember(i, behavior, {
          weight: 1,
          radius: 10,
          phase: i * (360 / MEMBER_COUNT),
          speed: 1
        });
      }

      const time = measureTime(() => {
        for (let t = 0; t < UPDATE_COUNT; t++) {
          manager.update(t * 16); // 60fps simulation
        }
      });
      
      expect(time * UPDATE_COUNT).toBeLessThan(PERFORMANCE_THRESHOLD.BATCH_UPDATE * UPDATE_COUNT);
    });

    it('should handle member addition/removal efficiently', () => {
      const behavior = new LinearBehavior();
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });

      const addTime = measureTime(() => {
        manager.addMember(1, behavior, {
          weight: 1,
          radius: 10,
          phase: 0,
          speed: 1
        });
      });
      
      expect(addTime).toBeLessThan(PERFORMANCE_THRESHOLD.MEMBER_ADD);

      const removeTime = measureTime(() => {
        manager.removeMember(1);
      });
      
      expect(removeTime).toBeLessThan(PERFORMANCE_THRESHOLD.MEMBER_ADD);
    });

    it('should handle position calculations efficiently', () => {
      const behavior = new LinearBehavior();
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      manager.addMember(1, behavior, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      const time = measureTime(() => {
        manager.update(1000);
      });
      
      expect(time).toBeLessThan(PERFORMANCE_THRESHOLD.POSITION_CALC);
    });
  });
});
