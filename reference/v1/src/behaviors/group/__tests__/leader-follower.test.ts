import { LeaderFollowerManager, LEADER_FOLLOWER_PARAMETERS } from '../leader-follower';
import { BaseBehavior } from '../../base';
import { HolophonixPosition, XYZPosition, createXYZPosition, isXYZPosition } from '../../../types/position';
import { ParameterDefinitions } from '../../../types/parameters';

class MockBehavior extends BaseBehavior {
  private position: XYZPosition;

  constructor(initialPosition: XYZPosition = createXYZPosition(0, 0, 0)) {
    const params: ParameterDefinitions = {
      x: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'X position' },
      y: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'Y position' },
      z: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'Z position' }
    };
    super(params);
    this.position = initialPosition;
  }

  update(_time: number): HolophonixPosition {
    return this.position;
  }

  reset(): void {
    this.position = createXYZPosition(0, 0, 0);
  }

  setPosition(position: XYZPosition): void {
    this.position = position;
  }
}

describe('LeaderFollowerManager', () => {
  let leader: MockBehavior;
  let manager: LeaderFollowerManager;
  let follower: MockBehavior;

  beforeEach(() => {
    leader = new MockBehavior();
    manager = new LeaderFollowerManager(leader);
    follower = new MockBehavior();
  });

  describe('Constructor', () => {
    it('should initialize with default parameters', () => {
      expect(manager).toBeDefined();
      expect(manager.getLeaderPosition()).toBeNull();
    });
  });

  describe('Member Management', () => {
    it('should add and remove members correctly', () => {
      const memberId = manager.addMember(1, follower, {
        xOffset: 1,
        yOffset: 0,
        zOffset: 0,
        delay: 0,
        scale: 1
      });

      expect(memberId).toBe(1);
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();

      manager.removeMember(1);
      const updatedPositions = manager.update(0);
      expect(isXYZPosition(updatedPositions)).toBeTruthy();
    });

    it('should validate member configuration', () => {
      expect(() => {
        manager.addMember(1, follower, {
          xOffset: 1,
          yOffset: 0,
          zOffset: 0,
          delay: -1, // Invalid delay
          scale: 1
        });
      }).toThrow();

      expect(() => {
        manager.addMember(2, follower, {
          xOffset: 1,
          yOffset: 0,
          zOffset: 0,
          delay: 0,
          scale: 0 // Invalid scale
        });
      }).toThrow();
    });
  });

  describe('Position Updates', () => {
    it('should update positions correctly with no delay', () => {
      const leaderPos = createXYZPosition(1, 2, 3);
      leader.setPosition(leaderPos);
      follower.setPosition(createXYZPosition(0, 0, 0));

      const memberId = manager.addMember(1, follower, {
        xOffset: 1,
        yOffset: 1,
        zOffset: 1,
        delay: 0,
        scale: 1,
        relative: true
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should handle relative positioning', () => {
      const leaderPos = createXYZPosition(1, 2, 3);
      leader.setPosition(leaderPos);
      follower.setPosition(createXYZPosition(0, 0, 0));

      const memberId = manager.addMember(1, follower, {
        xOffset: 2,
        yOffset: 2,
        zOffset: 2,
        delay: 0,
        scale: 1,
        relative: true
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });

    it('should apply scale correctly', () => {
      const leaderPos = createXYZPosition(1, 2, 3);
      leader.setPosition(leaderPos);
      follower.setPosition(createXYZPosition(0, 0, 0));

      const memberId = manager.addMember(1, follower, {
        xOffset: 1,
        yOffset: 1,
        zOffset: 1,
        delay: 0,
        scale: 2,
        relative: true
      });

      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });
  });

  describe('Parameter Management', () => {
    beforeEach(() => {
      manager.addMember(1, follower, {
        xOffset: 1,
        yOffset: 1,
        zOffset: 1,
        delay: 0,
        scale: 1
      });
    });

    it('should validate parameter values', () => {
      expect(() => {
        manager.updateMemberParameter(1, 'delay', -1);
      }).toThrow();

      expect(() => {
        manager.updateMemberParameter(1, 'scale', 0);
      }).toThrow();

      expect(() => {
        manager.updateMemberParameter(1, 'nonexistent', 1);
      }).toThrow();
    });

    it('should accept valid parameter values', () => {
      expect(() => {
        manager.updateMemberParameter(1, 'delay', 1);
        manager.updateMemberParameter(1, 'scale', 1);
      }).not.toThrow();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const leaderPos = createXYZPosition(1, 2, 3);
      leader.setPosition(leaderPos);

      manager.addMember(1, follower, {
        xOffset: 1,
        yOffset: 1,
        zOffset: 1,
        delay: 0,
        scale: 1
      });

      manager.update(0);
      manager.reset();

      expect(manager.getLeaderPosition()).toBeNull();
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
    });
  });

  describe('Member Configuration', () => {
    it('should handle member configuration correctly', () => {
      manager.addMember({
        xOffset: 1,
        yOffset: 0,
        zOffset: 0,
        delay: 0.5,
        scale: 1
      });

      const pos = manager.update(1000);
      expect(pos).toBeDefined();
    });

    it('should handle relative positioning', () => {
      manager.addMember({
        xOffset: 1,
        yOffset: 0,
        zOffset: 0,
        delay: 0.5,
        scale: 1,
        relative: true
      });

      const pos = manager.update(1000);
      expect(pos).toBeDefined();
    });
  });

  describe('LeaderFollowerGroup', () => {
    it('should correctly update follower positions relative to leader', () => {
      const group = new LeaderFollowerManager(leader);
      const config = {
        members: [
          {
            id: 'leader',
            role: 'leader',
            behavior: leader,
            config: {
              radius: 5,
              speed: 1,
              direction: 'clockwise',
              phase: 0,
              plane: 'xy',
              centerX: 0,
              centerY: 0,
              centerZ: 0
            }
          },
          {
            id: 'follower1',
            role: 'follower',
            config: {
              xOffset: 2,
              yOffset: 0,
              zOffset: 0
            }
          },
          {
            id: 'follower2',
            role: 'follower',
            config: {
              xOffset: -2,
              yOffset: 0,
              zOffset: 0
            }
          }
        ]
      };

      group.addMember(1, follower, config.members[1].config);
      group.addMember(2, follower, config.members[2].config);
      
      // Test initial positions
      const positions = group.update(0);
      expect(positions).toHaveLength(3);
      
      // Leader should be at initial circle position
      expect(positions[0].x).toBeCloseTo(1);  // radius * cos(0)
      expect(positions[0].y).toBeCloseTo(2);  // radius * sin(0)
      expect(positions[0].z).toBeCloseTo(3);
      
      // Follower1 should be offset from leader
      expect(positions[1].x).toBeCloseTo(3);  // leader.x + xOffset
      expect(positions[1].y).toBeCloseTo(2);  // leader.y + yOffset
      expect(positions[1].z).toBeCloseTo(3);  // leader.z + zOffset
      
      // Follower2 should be offset from leader
      expect(positions[2].x).toBeCloseTo(-1);  // leader.x - xOffset
      expect(positions[2].y).toBeCloseTo(2);  // leader.y + yOffset
      expect(positions[2].z).toBeCloseTo(3);  // leader.z + zOffset
    });

    it('should handle multiple updates correctly', () => {
      const group = new LeaderFollowerManager(leader);
      const config = {
        members: [
          {
            id: 'leader',
            role: 'leader',
            behavior: leader,
            config: {
              radius: 5,
              speed: 1,
              direction: 'clockwise',
              phase: 0,
              plane: 'xy',
              centerX: 0,
              centerY: 0,
              centerZ: 0
            }
          },
          {
            id: 'follower1',
            role: 'follower',
            config: {
              xOffset: 2,
              yOffset: 0,
              zOffset: 0
            }
          }
        ]
      };

      group.addMember(1, follower, config.members[1].config);
      
      // Test multiple position updates
      const positions1 = group.update(0);
      const positions2 = group.update(500); // Half second later
      
      // Verify leader movement
      expect(positions2[0].x).not.toBeCloseTo(positions1[0].x);
      expect(positions2[0].y).not.toBeCloseTo(positions1[0].y);
      
      // Verify follower maintains offset
      const xOffset = positions2[1].x - positions2[0].x;
      const yOffset = positions2[1].y - positions2[0].y;
      expect(xOffset).toBeCloseTo(2);
      expect(yOffset).toBeCloseTo(0);
    });
  });
});
