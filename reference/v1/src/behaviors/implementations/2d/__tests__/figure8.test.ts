import { Figure8Behavior } from '../figure8';
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

describe('Figure8Behavior', () => {
  let behavior: Figure8Behavior;

  beforeEach(() => {
    behavior = new Figure8Behavior();
  });

  describe('XYZ Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'xyz',
        width: 10,
        height: 5,
        speed: 1, // 1 revolution per second
        plane: 'XY',
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        rotation: 0
      });
    });

    test('should move in a figure-8 pattern in XY plane', () => {
      const deltaTime = 0.25;  // Quarter revolution
      const pos1 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos1)).toBeCloseTo(5); // width/2 * sin(2π/4)
      expect(getYValue(pos1)).toBeCloseTo(5); // height * sin(π/4)
      expect(getZValue(pos1)).toBeCloseTo(0);

      const pos2 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos2)).toBeCloseTo(0); // width/2 * sin(2π/2)
      expect(getYValue(pos2)).toBeCloseTo(0); // height * sin(π/2)
      expect(getZValue(pos2)).toBeCloseTo(0);

      const pos3 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos3)).toBeCloseTo(-5); // width/2 * sin(3π/2)
      expect(getYValue(pos3)).toBeCloseTo(-5); // height * sin(3π/4)
      expect(getZValue(pos3)).toBeCloseTo(0);

      const pos4 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos4)).toBeCloseTo(0); // width/2 * sin(2π)
      expect(getYValue(pos4)).toBeCloseTo(0); // height * sin(π)
      expect(getZValue(pos4)).toBeCloseTo(0);
    });

    test('should respect center parameters', () => {
      behavior.setParameters({ centerX: 5, centerY: 5 });
      const pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(5); // centerX
      expect(getYValue(pos)).toBeCloseTo(0); // centerY - height
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    test('should work in YZ plane', () => {
      behavior.setParameters({ plane: 'YZ' });
      const pos = behavior.update(0.25) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(5);
      expect(getZValue(pos)).toBeCloseTo(5);
    });

    test('should work in XZ plane', () => {
      behavior.setParameters({ plane: 'XZ' });
      const pos = behavior.update(0.25) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(5);
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(5);
    });

    test('should respect rotation parameter', () => {
      behavior.setParameters({ rotation: Math.PI / 4 }); // 45 degrees
      const pos = behavior.update(0.25) as XYZPosition;
      // Values need to be adjusted for 45-degree rotation
      const x = 5 * Math.cos(Math.PI / 4) - 5 * Math.sin(Math.PI / 4);
      const y = 5 * Math.sin(Math.PI / 4) + 5 * Math.cos(Math.PI / 4);
      expect(getXValue(pos)).toBeCloseTo(x);
      expect(getYValue(pos)).toBeCloseTo(y);
      expect(getZValue(pos)).toBeCloseTo(0);
    });
  });

  describe('AED Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'aed',
        width: 90, // 90 degrees
        height: 45, // 45 degrees
        speed: 1,
        plane: 'AE', // Azimuth-Elevation plane
        centerA: 0,
        centerE: 0,
        centerD: 1,
        rotation: 0
      });
    });

    test('should move in a figure-8 pattern in azimuth-elevation plane', () => {
      const pos1 = behavior.update(0.25) as AEDPosition;
      expect(getAzimuthValue(pos1)).toBeCloseTo(45); // width/2 * sin(2π/4)
      expect(getElevationValue(pos1)).toBeCloseTo(45); // height * sin(π/4)
      expect(getDistanceValue(pos1)).toBeCloseTo(1);

      const pos2 = behavior.update(0.25) as AEDPosition;
      expect(getAzimuthValue(pos2)).toBeCloseTo(0);
      expect(getElevationValue(pos2)).toBeCloseTo(0);
      expect(getDistanceValue(pos2)).toBeCloseTo(1);
    });

    test('should respect center parameters', () => {
      behavior.setParameters({ centerA: 45, centerE: 45 });
      const pos = behavior.update(0) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(45);
      expect(getElevationValue(pos)).toBeCloseTo(0);
      expect(getDistanceValue(pos)).toBeCloseTo(1);
    });
  });
});
