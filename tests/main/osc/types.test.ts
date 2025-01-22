import { OscMessage, createOscMessage, validateOscAddress, Position3D, createPositionMessage } from '../../../src/main/osc/types';

describe('OSC Message Types', () => {
  test('should create valid OSC message', () => {
    const message = createOscMessage('/track/1/position', [0, 0, 0]);
    expect(message).toBeDefined();
    expect(message.address).toBe('/track/1/position');
    expect(message.args).toEqual([0, 0, 0]);
  });

  test('should validate OSC address format', () => {
    expect(validateOscAddress('/track/1/position')).toBe(true);
    expect(validateOscAddress('invalid')).toBe(false);
    expect(validateOscAddress('/track/invalid/position/')).toBe(false);
  });

  test('should reject invalid OSC address format', () => {
    expect(() => createOscMessage('invalid', [0])).toThrow('Invalid OSC address format');
  });

  describe('Position Messages', () => {
    test('should create valid position message', () => {
      const position: Position3D = { x: 0.5, y: -0.5, z: 0 };
      const message = createPositionMessage(1, position);
      
      expect(message.address).toBe('/track/1/position');
      expect(message.args).toEqual([0.5, -0.5, 0]);
    });

    test('should reject position outside bounds', () => {
      const invalidPosition: Position3D = { x: 2, y: 0, z: 0 }; // x > 1
      expect(() => createPositionMessage(1, invalidPosition)).toThrow('Position values must be between -1 and 1');
    });

    test('should reject negative track ID', () => {
      const position: Position3D = { x: 0, y: 0, z: 0 };
      expect(() => createPositionMessage(-1, position)).toThrow('Invalid track ID');
    });
  });
});
