import { SineBehavior } from '../sine';
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

describe('SineBehavior', () => {
  let behavior: SineBehavior;

  beforeEach(() => {
    behavior = new SineBehavior();
  });

  describe('XYZ Mode', () => {
    beforeEach(() => {
      behavior = new SineBehavior('xyz');
      behavior.setParameters({
        frequency: 1,
        amplitude: 10,
        phase: 0,
        axis: 'X',
        center: 0
      });
    });

    it('should oscillate sinusoidally along X axis', () => {
      const deltaTime = 250; // Quarter second
      const pos1 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos1)).toBeCloseTo(10); // sin(π/2) * 10
      expect(getYValue(pos1)).toBeCloseTo(0);
      expect(getZValue(pos1)).toBeCloseTo(0);

      const pos2 = behavior.update(deltaTime) as XYZPosition;
      expect(getXValue(pos2)).toBeCloseTo(0); // sin(π) * 10
      expect(getYValue(pos2)).toBeCloseTo(0);
      expect(getZValue(pos2)).toBeCloseTo(0);
    });

    it('should respect phase parameter', () => {
      behavior.setParameters({ phase: 90 }); // 90 degrees phase shift
      const pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(10); // sin(π/2) * 10
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should respect center parameter', () => {
      behavior.setParameters({ center: 5 });
      const pos = behavior.update(0) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(5); // center + sin(0) * 10
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should work with Y axis', () => {
      behavior.setParameters({ axis: 'Y' });
      const pos = behavior.update(250) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(10); // sin(π/2) * 10
      expect(getZValue(pos)).toBeCloseTo(0);
    });

    it('should work with Z axis', () => {
      behavior.setParameters({ axis: 'Z' });
      const pos = behavior.update(250) as XYZPosition;
      expect(getXValue(pos)).toBeCloseTo(0);
      expect(getYValue(pos)).toBeCloseTo(0);
      expect(getZValue(pos)).toBeCloseTo(10); // sin(π/2) * 10
    });
  });

  describe('AED Mode', () => {
    beforeEach(() => {
      behavior = new SineBehavior('aed');
      behavior.setParameters({
        frequency: 1,
        phase: 0,
        mode: 'azimuth',
        azimuthAmplitude: 90,
        elevationAmplitude: 45,
        distanceAmplitude: 5,
        baseDistance: 10,
        centerAzimuth: 0,
        centerElevation: 0
      });
    });

    it('should oscillate sinusoidally in azimuth', () => {
      const pos1 = behavior.update(250) as AEDPosition;
      expect(getAzimuthValue(pos1)).toBeCloseTo(90); // sin(π/2) * 90
      expect(getElevationValue(pos1)).toBeCloseTo(0);
      expect(getDistanceValue(pos1)).toBeCloseTo(10);

      const pos2 = behavior.update(250) as AEDPosition;
      expect(getAzimuthValue(pos2)).toBeCloseTo(0); // sin(π) * 90
      expect(getElevationValue(pos2)).toBeCloseTo(0);
      expect(getDistanceValue(pos2)).toBeCloseTo(10);
    });

    it('should oscillate sinusoidally in elevation', () => {
      behavior.setParameters({ mode: 'elevation' });
      const pos = behavior.update(250) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(0);
      expect(getElevationValue(pos)).toBeCloseTo(45); // sin(π/2) * 45
      expect(getDistanceValue(pos)).toBeCloseTo(10);
    });

    it('should oscillate sinusoidally in distance', () => {
      behavior.setParameters({ mode: 'distance' });
      const pos = behavior.update(250) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(0);
      expect(getElevationValue(pos)).toBeCloseTo(0);
      expect(getDistanceValue(pos)).toBeCloseTo(15); // 10 + sin(π/2) * 5
    });

    it('should respect center parameters', () => {
      behavior.setParameters({
        centerAzimuth: 45,
        centerElevation: 30,
        baseDistance: 20
      });
      const pos = behavior.update(0) as AEDPosition;
      expect(getAzimuthValue(pos)).toBeCloseTo(45);
      expect(getElevationValue(pos)).toBeCloseTo(30);
      expect(getDistanceValue(pos)).toBeCloseTo(20);
    });
  });
});
