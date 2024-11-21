import { IsobarycentricManager } from '../isobarycentric';
import { BaseBehavior } from '../../base';
import { HolophonixPosition, XYZPosition, createXYZPosition, getXValue, getYValue, getZValue, isXYZPosition } from '../../../types/position';
import { ParameterDefinitions } from '../../../types/parameters';

class MockBehavior extends BaseBehavior {
  private position: XYZPosition;

  constructor(position: XYZPosition = createXYZPosition(0, 0, 0)) {
    const params: ParameterDefinitions = {
      x: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'X position' },
      y: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'Y position' },
      z: { min: -100, max: 100, default: 0, step: 0.1, unit: 'meters', description: 'Z position' }
    };
    super(params);
    this.position = position;
  }

  setPosition(position: XYZPosition) {
    this.position = position;
  }

  update(_time: number): HolophonixPosition {
    return this.position;
  }

  reset(): void {
    this.position = createXYZPosition(0, 0, 0);
  }
}

describe('IsobarycentricManager', () => {
  let manager: IsobarycentricManager;
  let behavior1: MockBehavior;
  let behavior2: MockBehavior;

  beforeEach(() => {
    manager = new IsobarycentricManager();
    behavior1 = new MockBehavior(createXYZPosition(1, 1, 1));
    behavior2 = new MockBehavior(createXYZPosition(-1, -1, -1));
  });

  describe('Member Management', () => {
    test('should add members correctly', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      expect(manager.getMemberCount()).toBe(1);
      expect(manager.isMember(1)).toBe(true);
    });

    test('should remove members correctly', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });
      manager.removeMember(1);

      expect(manager.getMemberCount()).toBe(0);
      expect(manager.isMember(1)).toBe(false);
    });

    test('should validate member configuration', () => {
      expect(() => {
        manager.addMember(1, behavior1, {
          weight: -1, // Invalid weight
          radius: 10,
          phase: 0,
          speed: 1
        });
      }).toThrow();
    });
  });

  describe('Center Calculation', () => {
    test('should calculate center correctly', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 0,
        phase: 0,
        speed: 0
      });
      manager.addMember(2, behavior2, {
        weight: 1,
        radius: 0,
        phase: 0,
        speed: 0
      });

      // Update to trigger center calculation
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();

      const center = manager.getCenter();
      expect(getXValue(center)).toBe(0);
      expect(getYValue(center)).toBe(0);
      expect(getZValue(center)).toBe(0);
    });

    test('should handle weighted center calculation', () => {
      manager.addMember(1, behavior1, {
        weight: 2,
        radius: 0,
        phase: 0,
        speed: 0
      });
      manager.addMember(2, behavior2, {
        weight: 1,
        radius: 0,
        phase: 0,
        speed: 0
      });

      manager.update(0);

      const center = manager.getCenter();
      expect(getXValue(center)).toBeCloseTo(0.333, 3);
      expect(getYValue(center)).toBeCloseTo(0.333, 3);
      expect(getZValue(center)).toBeCloseTo(0.333, 3);
    });
  });

  describe('Position Updates', () => {
    test('should update member positions correctly', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 90, // 90 degrees per second
        plane: 'xz'
      });

      // At t=0, should be at radius distance along x-axis
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
      let pos = positions as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(11); // base(1) + radius(10) * cos(0)
      expect(getYValue(pos)).toBe(1);
      expect(getZValue(pos)).toBeCloseTo(1); // base(1) + radius(10) * sin(0)

      // At t=1, should have rotated 90 degrees
      positions = manager.update(1);
      expect(isXYZPosition(positions)).toBeTruthy();
      pos = positions as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(1); // base(1) + radius(10) * cos(90)
      expect(getYValue(pos)).toBe(1);
      expect(getZValue(pos)).toBeCloseTo(11); // base(1) + radius(10) * sin(90)
    });

    test('should handle different rotation planes', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 90,
        plane: 'xy'
      });

      // At t=0, should be at radius distance along x-axis
      const positions = manager.update(0);
      expect(isXYZPosition(positions)).toBeTruthy();
      let pos = positions as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(11);
      expect(getYValue(pos)).toBeCloseTo(1);
      expect(getZValue(pos)).toBe(1);

      // At t=1, should have rotated 90 degrees in xy plane
      positions = manager.update(1);
      expect(isXYZPosition(positions)).toBeTruthy();
      pos = positions as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(1);
      expect(getYValue(pos)).toBeCloseTo(11);
      expect(getZValue(pos)).toBe(1);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset all members and center', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      manager.update(1); // Update positions
      manager.reset();

      const centerPos = manager.getCenter();
      expect(getXValue(centerPos)).toBe(0);
      expect(getYValue(centerPos)).toBe(0);
      expect(getZValue(centerPos)).toBe(0);
      expect(manager.getCenterVelocity()).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid member updates gracefully', () => {
      // Add a valid member first
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      // Add an invalid member that will cause an error during update
      const invalidBehavior = {
        update: () => { throw new Error('Update failed'); },
        reset: () => {}
      } as unknown as BaseBehavior;

      manager.addMember(2, invalidBehavior, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      expect(() => manager.update(0)).toThrow('Failed to update positions');
    });
  });

  describe('Parameter Synchronization', () => {
    beforeEach(() => {
      manager = new IsobarycentricManager();
      behavior1 = new MockBehavior(createXYZPosition(0, 0, 0));
      behavior2 = new MockBehavior(createXYZPosition(10, 0, 0));
    });

    test('should synchronize parameters between members', () => {
      // Add two members
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1,
        sync: {
          speed: true,
          radius: true
        }
      });

      manager.addMember(2, behavior2, {
        weight: 1,
        radius: 20,
        phase: 0,
        speed: 2,
        sync: {
          speed: true,
          radius: true
        }
      });

      // Update speed of member 1
      manager.updateMemberParameter(1, 'speed', 5);

      // Check if speed was synchronized
      expect(manager.getMemberConfig(2)?.speed).toBe(5);

      // Update radius of member 2
      manager.updateMemberParameter(2, 'radius', 15);

      // Check if radius was synchronized
      expect(manager.getMemberConfig(1)?.radius).toBe(15);
    });

    test('should respect sync settings', () => {
      // Add two members with different sync settings
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1,
        sync: {
          speed: true,
          radius: false
        }
      });

      manager.addMember(2, behavior2, {
        weight: 1,
        radius: 20,
        phase: 0,
        speed: 2,
        sync: {
          speed: true,
          radius: true
        }
      });

      // Update speed (should sync)
      manager.updateMemberParameter(1, 'speed', 5);
      expect(manager.getMemberConfig(2)?.speed).toBe(5);

      // Update radius (should not sync)
      manager.updateMemberParameter(1, 'radius', 15);
      expect(manager.getMemberConfig(2)?.radius).toBe(20);
    });

    test('should handle dynamic sync mode changes', () => {
      // Add two members
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      manager.addMember(2, behavior2, {
        weight: 1,
        radius: 20,
        phase: 0,
        speed: 2
      });

      // Enable speed sync for both members
      manager.setSyncMode(1, 'speed', true);
      manager.setSyncMode(2, 'speed', true);

      // Update speed (should sync)
      manager.updateMemberParameter(1, 'speed', 5);
      expect(manager.getMemberConfig(2)?.speed).toBe(5);

      // Disable sync for member 2
      manager.setSyncMode(2, 'speed', false);

      // Update speed (should not sync)
      manager.updateMemberParameter(1, 'speed', 3);
      expect(manager.getMemberConfig(2)?.speed).toBe(5);
    });

    test('should validate parameter values', () => {
      manager.addMember(1, behavior1, {
        weight: 1,
        radius: 10,
        phase: 0,
        speed: 1
      });

      // Test invalid values
      expect(() => manager.updateMemberParameter(1, 'speed', 1000)).toThrow();
      expect(() => manager.updateMemberParameter(1, 'radius', -1)).toThrow();
      expect(() => manager.updateMemberParameter(1, 'phase', 400)).toThrow();
      expect(() => manager.updateMemberParameter(1, 'plane', 'xy' as any)).not.toThrow();
      expect(() => manager.updateMemberParameter(1, 'followCenter', true)).not.toThrow();
      expect(() => manager.updateMemberParameter(1, 'sync', {})).not.toThrow();
    });
  });
});
