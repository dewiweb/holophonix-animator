import { LinearBehavior } from '../../implementations/1d/linear';
import { SineBehavior } from '../../implementations/1d/sine';
import { LeaderFollowerManager } from '../leader-follower';
import { IsobarycentricManager } from '../isobarycentric';
import { createXYZPosition, isXYZPosition, getXValue, getYValue, getZValue } from '../../../types/position';

describe('Group Behavior System', () => {
  describe('Leader-Follower Behavior', () => {
    let leader: LinearBehavior;
    let manager: LeaderFollowerManager;

    beforeEach(() => {
      leader = new LinearBehavior();
      leader.setParameters({ axis: 0, speed: 1, distance: 10 });
      manager = new LeaderFollowerManager(leader);
    });

    it('should update leader position correctly', () => {
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should handle followers with delay', () => {
      const follower = new LinearBehavior();
      follower.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      manager.addFollower(1, follower, {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        delay: 1,
        scale: 1
      });

      const t1 = manager.update(0);
      const t2 = manager.update(0);
      
      expect(isXYZPosition(t1)).toBeTruthy();
      expect(isXYZPosition(t2)).toBeTruthy();
    });

    it('should apply offset correctly', () => {
      const follower = new LinearBehavior();
      follower.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      manager.addFollower(1, follower, {
        offsetX: 5,
        offsetY: 5,
        offsetZ: 5,
        delay: 0,
        scale: 1
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should apply scaling correctly', () => {
      const follower = new LinearBehavior();
      follower.setParameters({ axis: 0, speed: 1, distance: 10 });
      
      manager.addFollower(1, follower, {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
        delay: 0,
        scale: 2
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });
  });

  describe('Isobarycentric Behavior', () => {
    let manager: IsobarycentricManager;

    beforeEach(() => {
      manager = new IsobarycentricManager();
    });

    it('should calculate center correctly', () => {
      const behavior1 = new LinearBehavior();
      const behavior2 = new LinearBehavior();
      behavior1.setParameters({ axis: 0, speed: 1, distance: 10 });
      behavior2.setParameters({ axis: 1, speed: 1, distance: 10 });

      manager.addMember(1, behavior1, { 
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });
      manager.addMember(2, behavior2, { 
        weight: 1,
        radius: 10,
        phase: 180,
        speed: 1
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should respect weights', () => {
      const behavior1 = new LinearBehavior();
      const behavior2 = new LinearBehavior();
      behavior1.setParameters({ axis: 0, speed: 1, distance: 10 });
      behavior2.setParameters({ axis: 0, speed: 1, distance: 10 });

      manager.addMember(1, behavior1, { 
        weight: 2,
        radius: 10,
        phase: 0,
        speed: 1
      });
      manager.addMember(2, behavior2, { 
        weight: 1,
        radius: 10,
        phase: 180,
        speed: 1
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should maintain constant radius', () => {
      const behavior = new SineBehavior();
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      
      manager.addMember(1, behavior, { weight: 1, radius: 10, phase: 0, speed: 1 });

      const positions = Array.from({ length: 4 }, (_, i) => 
        manager.update(i * 250).get(1)!);
      
      // Check that distance from center remains constant
      positions.forEach(pos => {
        expect(isXYZPosition(pos)).toBe(true);
        if (isXYZPosition(pos)) {
          const distance = Math.sqrt(
            getXValue(pos) ** 2 +
            getZValue(pos) ** 2
          );
          expect(distance).toBeCloseTo(10);
        }
      });
    });

    it('should handle member removal', () => {
      const b1 = new LinearBehavior();
      const b2 = new LinearBehavior();
      
      b1.setParameters({ axis: 0, speed: 1, distance: 10 });
      b2.setParameters({ axis: 0, speed: 1, distance: -10 });
      
      manager.addMember(1, b1, { weight: 1, radius: 10, phase: 0, speed: 1 });
      manager.addMember(2, b2, { weight: 1, radius: 10, phase: 180, speed: 1 });
      
      const positions1 = manager.update(0);
      manager.removeMember(2);
      const positions2 = manager.update(0);
      
      expect(isXYZPosition(positions1)).toBeTruthy();
      expect(isXYZPosition(positions2)).toBeTruthy();
    });
  });
});
