import { GroupBehaviorBase } from '../base';
import { GroupMember } from '../member';
import { HolophonixPosition, createXYZPosition } from '../../../types/position';
import { ParameterDefinitions } from '../../../types/parameters';

class MockGroupBehavior extends GroupBehaviorBase {
  constructor() {
    const params: ParameterDefinitions = {
      testParam: { 
        default: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: 'meters',
        description: 'Test parameter',
        type: 'number'
      }
    };
    super(params);
    this.addMember(0, createXYZPosition(0, 0, 0), {});
  }

  protected validateConfig(): void {
    // No validation needed for mock
  }

  protected validateParameterValue(parameter: string, value: any): boolean {
    if (parameter === 'testParam') {
      const numValue = Number(value);
      return numValue >= 0 && numValue <= 100;
    }
    return false;
  }

  calculateGroupPosition(positions: Map<number, HolophonixPosition>): HolophonixPosition {
    // Return first position for testing
    return positions.values().next().value;
  }

  getMemberParameters(memberId: number): Record<string, any> {
    const member = this.members.get(memberId);
    return member ? member.getParameters() : {};
  }

  getMemberCount(): number {
    return this.members.size;
  }

  hasMember(id: number): boolean {
    return this.members.has(id);
  }
}

describe('GroupBehaviorBase', () => {
  let behavior: MockGroupBehavior;

  beforeEach(() => {
    behavior = new MockGroupBehavior();
  });

  describe('Parameter Management', () => {
    it('should initialize with default parameters', () => {
      const params = behavior.getMemberParameters(0);
      expect(params.testParam).toBe(50);
    });

    it('should update parameters correctly', () => {
      behavior.setParameterValue('testParam', 60, 0);
      const params = behavior.getMemberParameters(0);
      expect(params.testParam).toBe(60);
    });

    it('should throw on invalid parameter value', () => {
      expect(() => {
        behavior.setParameterValue('testParam', -10, 0);
      }).toThrow('Invalid parameter value');
    });
  });

  describe('Member Management', () => {
    it('should add and remove members correctly', () => {
      behavior.addMember(1, createXYZPosition(0, 0, 0), {});
      expect(behavior.hasMember(1)).toBe(true);

      behavior.removeMember(1);
      expect(behavior.hasMember(1)).toBe(false);
    });

    it('should handle member parameter initialization', () => {
      behavior.setParameterValue('testParam', 5, 0);
      behavior.addMember(1, createXYZPosition(0, 0, 0), {});
      
      const params = behavior.getMemberParameters(1);
      expect(params.testParam).toBe(5);
    });
  });
});
