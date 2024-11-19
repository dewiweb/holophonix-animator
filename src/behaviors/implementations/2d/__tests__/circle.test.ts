import { CircleBehavior } from '../circle';
import { 
  XYZPosition, 
  AEDPosition,
  getXValue,
  getYValue,
  getZValue,
  getAzimuthValue,
  getElevationValue,
  getDistanceValue
} from '../../../../types/position';

describe('CircleBehavior', () => {
  const defaultXYZParams = {
    radius: 5,
    speed: 1,
    direction: 'clockwise',
    phase: 0,
    plane: 'xy',
    centerX: 0,
    centerY: 0,
    centerZ: 0
  };

  describe('XYZ Mode', () => {
    it('should create a circle in xy plane', () => {
      const behavior = new CircleBehavior('xyz');
      behavior.setParameters(defaultXYZParams);

      // Test quarter points in the circle
      const quarterTime = 250; // 0.25 seconds
      
      // At 0 seconds (start)
      let pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(5); // radius * cos(0)
      expect(getYValue(pos)).toBeCloseTo(0); // radius * sin(0)
      expect(getZValue(pos)).toBeCloseTo(0);

      // At 0.25 seconds (quarter turn)
      pos = behavior.update(quarterTime) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0); // radius * cos(pi/2)
      expect(getYValue(pos)).toBeCloseTo(5); // radius * sin(pi/2)
      expect(getZValue(pos)).toBeCloseTo(0);

      // At 0.5 seconds (half turn)
      pos = behavior.update(500) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(-5); // radius * cos(pi)
      expect(getYValue(pos)).toBeCloseTo(0); // radius * sin(pi)
      expect(getZValue(pos)).toBeCloseTo(0);

      // At 0.75 seconds (three-quarter turn)
      pos = behavior.update(750) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0); // radius * cos(3pi/2)
      expect(getYValue(pos)).toBeCloseTo(-5); // radius * sin(3pi/2)
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should respect direction parameter', () => {
      const behavior = new CircleBehavior('xyz');
      behavior.setParameters({ ...defaultXYZParams, direction: 'counterclockwise' });

      // At 0.25 seconds (quarter turn counterclockwise)
      let pos = behavior.update(250) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(-5); // Note: opposite of clockwise
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should respect phase parameter', () => {
      const behavior = new CircleBehavior('xyz');
      behavior.setParameters({ ...defaultXYZParams, phase: 90 }); // 90 degree phase

      // At start (with 90 degree phase)
      let pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(5);
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should respect plane parameter', () => {
      const behavior = new CircleBehavior('xyz');
      behavior.setParameters({ ...defaultXYZParams, plane: 'yz' });

      // Test YZ plane rotation at quarter turn
      let pos = behavior.update(250) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(5);

      // Test XZ plane rotation
      behavior.setParameters({ ...defaultXYZParams, plane: 'xz' });
      pos = behavior.update(250) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(5);
    });

    it('should respect center parameters', () => {
      const behavior = new CircleBehavior('xyz');
      behavior.setParameters({
        ...defaultXYZParams,
        centerX: 1,
        centerY: 2,
        centerZ: 3
      });

      // At start
      let pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(6); // centerX + radius
      expect(getYValue(pos)).toBeCloseTo(2); // centerY
      expect(getZValue(pos)).toBeCloseTo(3); // centerZ
    });
  });

  describe('AED Mode', () => {
    it('should convert to AED coordinates', () => {
      const behavior = new CircleBehavior('aed');
      behavior.setParameters(defaultXYZParams);

      // At start
      let pos = behavior.update(0) as AEDPosition;
      expect(getDistanceValue(pos)).toBeCloseTo(5); // radius
      expect(getAzimuthValue(pos)).toBeCloseTo(0);
      expect(getElevationValue(pos)).toBeCloseTo(0);

      // At quarter turn
      pos = behavior.update(250) as AEDPosition;
      expect(getDistanceValue(pos)).toBeCloseTo(5);
      expect(getAzimuthValue(pos)).toBeCloseTo(90);
      expect(getElevationValue(pos)).toBeCloseTo(0);
    });
  });
});
