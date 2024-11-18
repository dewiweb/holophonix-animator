import { LinearBehavior } from '../linear';
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

describe('LinearBehavior', () => {
  let behavior: LinearBehavior;

  beforeEach(() => {
    behavior = new LinearBehavior();
  });

  describe('XYZ Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'xyz',
        speed: 1,
        axis: 'X',
        range: 10,
        center: 0
      });
    });

    test('should move linearly along X axis', () => {
      const deltaTime = 0.5;  // Half second
      const pos1 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos1)).toBeCloseTo(5); // Half range at half second
      expect(getYValue(pos1)).toBeCloseTo(0);
      expect(getZValue(pos1)).toBeCloseTo(0);

      const pos2 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos2)).toBeCloseTo(10); // Full range at 1 second
      expect(getYValue(pos2)).toBeCloseTo(0);
      expect(getZValue(pos2)).toBeCloseTo(0);

      // Should reverse direction
      const pos3 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos3)).toBeCloseTo(5); // Moving back
      expect(getYValue(pos3)).toBeCloseTo(0);
      expect(getZValue(pos3)).toBeCloseTo(0);
    });

    test('should respect center parameter', () => {
      behavior.setParameters({ center: 5 });
      const pos = behavior.update(0.5) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(10); // center(5) + half_range(5)
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(0);
    });
  });

  describe('AED Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'aed',
        speed: 1,
        dimension: 'azimuth',
        azimuthRange: 90,
        elevationRange: 45,
        distanceRange: 5,
        baseDistance: 10,
        centerAzimuth: 0
      });
    });

    test('should move linearly in azimuth', () => {
      const deltaTime = 0.5;  // Half second
      const pos1 = behavior.update(deltaTime) as AEDPosition;
      expect(getAzimuthValue(pos1)).toBeCloseTo(45); // Half range at half second
      expect(getElevationValue(pos1)).toBeCloseTo(0);
      expect(getDistanceValue(pos1)).toBeCloseTo(10); // baseDistance

      const pos2 = behavior.update(deltaTime) as AEDPosition;
      expect(getAzimuthValue(pos2)).toBeCloseTo(90); // Full range at 1 second
      expect(getElevationValue(pos2)).toBeCloseTo(0);
      expect(getDistanceValue(pos2)).toBeCloseTo(10);

      // Should reverse direction
      const pos3 = behavior.update(deltaTime) as AEDPosition;
      expect(getAzimuthValue(pos3)).toBeCloseTo(45); // Moving back
      expect(getElevationValue(pos3)).toBeCloseTo(0);
      expect(getDistanceValue(pos3)).toBeCloseTo(10);
    });

    test('should respect center parameters', () => {
      behavior.setParameters({ centerAzimuth: 45 });
      const pos = behavior.update(0.5) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(90); // center(45) + half_range(45)
      expect(getElevationValue(pos)).toBeCloseTo(0);
      expect(getDistanceValue(pos)).toBeCloseTo(10);
    });
  });

  describe('Parameter Changes', () => {
    test('should handle coordinate mode change', () => {
      // Start in XYZ mode
      behavior.setParameters({
        coordinateMode: 'xyz',
        speed: 1,
        axis: 'X',
        range: 10,
        center: 0
      });

      // Move for half a second
      const xyzPos = behavior.update(0.5) as XYZPosition;
      expect(getXValue(xyzPos)).toBeCloseTo(5);

      // Switch to AED mode
      behavior.setParameters({
        coordinateMode: 'aed',
        dimension: 'azimuth',
        azimuthRange: 90,
        baseDistance: 10
      });

      // Should reset and start new motion
      const aedPos = behavior.update(0.5) as AEDPosition;
      expect(getAzimuthValue(aedPos)).toBeCloseTo(45);
      expect(getDistanceValue(aedPos)).toBeCloseTo(10);
    });
  });
});
