import { LinearBehavior } from '../../implementations/linear';
import { SineWaveBehavior } from '../../implementations/sine';
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
      const positions = manager.update(1000);
      const leaderPos = positions.get(-1)!;
      expect(isXYZPosition(leaderPos)).toBe(true);
      if (isXYZPosition(leaderPos)) {
        expect(getXValue(leaderPos)).not.toBe(0);
        expect(getYValue(leaderPos)).toBe(0);
        expect(getZValue(leaderPos)).toBe(0);
      }
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

      const t1 = manager.update(1000);
      const t2 = manager.update(2000);
      
      const followerPos1 = t1.get(1)!;
      const followerPos2 = t2.get(1)!;
      
      expect(isXYZPosition(followerPos1) && isXYZPosition(followerPos2)).toBe(true);
      if (isXYZPosition(followerPos1) && isXYZPosition(followerPos2)) {
        expect(getXValue(followerPos2)).toBeGreaterThan(getXValue(followerPos1));
      }
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

      const positions = manager.update(1000);
      const leaderPos = positions.get(-1)!;
      const followerPos = positions.get(1)!;
      
      expect(isXYZPosition(leaderPos) && isXYZPosition(followerPos)).toBe(true);
      if (isXYZPosition(leaderPos) && isXYZPosition(followerPos)) {
        expect(getXValue(followerPos)).toBe(getXValue(leaderPos) + 5);
        expect(getYValue(followerPos)).toBe(5);
        expect(getZValue(followerPos)).toBe(5);
      }
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

      const positions = manager.update(1000);
      const leaderPos = positions.get(-1)!;
      const followerPos = positions.get(1)!;
      
      expect(isXYZPosition(leaderPos) && isXYZPosition(followerPos)).toBe(true);
      if (isXYZPosition(leaderPos) && isXYZPosition(followerPos)) {
        expect(getXValue(followerPos)).toBe(getXValue(leaderPos) * 2);
      }
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

      const positions = manager.update(1000);
      const pos1 = positions.get(1)!;
      const pos2 = positions.get(2)!;
      
      expect(isXYZPosition(pos1) && isXYZPosition(pos2)).toBe(true);
      if (isXYZPosition(pos1) && isXYZPosition(pos2)) {
        expect(getXValue(pos1)).not.toBe(0);
        expect(getYValue(pos2)).not.toBe(0);
      }
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

      const positions = manager.update(1000);
      const pos1 = positions.get(1)!;
      const pos2 = positions.get(2)!;
      
      expect(isXYZPosition(pos1) && isXYZPosition(pos2)).toBe(true);
      if (isXYZPosition(pos1) && isXYZPosition(pos2)) {
        const centerX = (getXValue(pos1) * 2 + getXValue(pos2)) / 3;
        expect(Math.abs(centerX)).toBeGreaterThan(0);
      }
    });

    it('should maintain constant radius', () => {
      const behavior = new SineWaveBehavior();
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
      
      expect(positions1.size).toBe(2);
      expect(positions2.size).toBe(1);
    });
  });
});
