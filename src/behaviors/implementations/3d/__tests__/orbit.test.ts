import { OrbitBehavior } from '../orbit';
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

describe('OrbitBehavior', () => {
  let behavior: OrbitBehavior;

  beforeEach(() => {
    behavior = new OrbitBehavior();
  });

  describe('XYZ Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'xyz',
        radius: 10,
        speed: 1, // 1 revolution per second
        tilt: 0,
        centerX: 0,
        centerY: 0,
        centerZ: 0,
        direction: 'clockwise',
        precessionRate: 0
      });
    });

    test('should orbit in XY plane when tilt is 0', () => {
      const deltaTime = 0.25;  // Quarter revolution
      const pos1 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos1)).toBeCloseTo(0); // cos(π/2) * 10
      expect(getYValue(pos1)).toBeCloseTo(10); // sin(π/2) * 10
      expect(getZValue(pos1)).toBeCloseTo(0);

      const pos2 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos2)).toBeCloseTo(-10); // cos(π) * 10
      expect(getYValue(pos2)).toBeCloseTo(0); // sin(π) * 10
      expect(getZValue(pos2)).toBeCloseTo(0);
    });

    test('should respect tilt parameter', () => {
      behavior.setParameters({ tilt: Math.PI / 4 }); // 45 degrees
      const pos = behavior.update(0.25) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(7.071); // 10 * cos(45°)
      expect(getZValue(pos)).toBeCloseTo(7.071); // 10 * sin(45°)
    });

    test('should respect center parameters', () => {
      behavior.setParameters({ centerX: 5, centerY: 5, centerZ: 5 });
      const pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(15); // centerX + radius
      expect(getYValue(pos)).toBeCloseTo(5); // centerY
      expect(getZValue(pos)).toBeCloseTo(5); // centerZ
    });

    test('should respect direction parameter', () => {
      behavior.setParameters({ direction: 'counterclockwise' });
      const pos = behavior.update(0.25) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(-10); // Opposite direction
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    test('should handle precession', () => {
      behavior.setParameters({ precessionRate: 1 }); // 1 revolution per second
      const pos1 = behavior.update(0.25) as XYZPosition;
      // Position should be affected by both orbital motion and precession
      expect(getXValue(pos1)).toBeCloseTo(0);
      expect(getYValue(pos1)).toBeCloseTo(7.071); // 10 * cos(45°)
      expect(getZValue(pos1)).toBeCloseTo(7.071); // 10 * sin(45°)
    });
  });

  describe('AED Mode', () => {
    beforeEach(() => {
      behavior.setParameters({
        coordinateMode: 'aed',
        radius: 1,
        speed: 1,
        tilt: 0,
        centerA: 0,
        centerE: 0,
        centerD: 2,
        direction: 'clockwise',
        precessionRate: 0
      });
    });

    test('should orbit in azimuth when tilt is 0', () => {
      const pos1 = behavior.update(0.25) as AEDPosition;
      expect(getAzimuthValue(pos1)).toBeCloseTo(90);
      expect(getElevationValue(pos1)).toBeCloseTo(0);
      expect(getDistanceValue(pos1)).toBeCloseTo(2);

      const pos2 = behavior.update(0.25) as AEDPosition;
      expect(getAzimuthValue(pos2)).toBeCloseTo(180);
      expect(getElevationValue(pos2)).toBeCloseTo(0);
      expect(getDistanceValue(pos2)).toBeCloseTo(2);
    });

    test('should respect tilt parameter', () => {
      behavior.setParameters({ tilt: Math.PI / 4 }); // 45 degrees
      const pos = behavior.update(0.25) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(90);
      expect(getElevationValue(pos)).toBeCloseTo(45);
      expect(getDistanceValue(pos)).toBeCloseTo(2);
    });

    test('should respect center parameters', () => {
      behavior.setParameters({ centerA: 45, centerE: 45, centerD: 3 });
      const pos = behavior.update(0) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(45);
      expect(getElevationValue(pos)).toBeCloseTo(45);
      expect(getDistanceValue(pos)).toBeCloseTo(3);
    });
  });
});
