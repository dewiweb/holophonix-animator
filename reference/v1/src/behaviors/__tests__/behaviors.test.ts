import { LinearBehavior } from '../implementations/1d/linear';
import { SineBehavior } from '../implementations/1d/sine';
import { CircleBehavior } from '../implementations/2d/circle';
import { OrbitBehavior } from '../implementations/3d/orbit';
import {
  isXYZPosition,
  isAEDPosition,
  validatePosition,
  getXValue,
  getYValue,
  getZValue,
  getAzimuthValue,
  getElevationValue,
  getDistanceValue,
  XYZPosition,
  AEDPosition,
  HolophonixPosition
} from '../../types/position';

describe('Behavior Implementations', () => {
  // Helper function to ensure position is XYZ
  function assertXYZ(pos: HolophonixPosition): asserts pos is XYZPosition {
    expect(isXYZPosition(pos)).toBeTruthy();
  }

  // Helper function to ensure position is AED
  function assertAED(pos: HolophonixPosition): asserts pos is AEDPosition {
    expect(isAEDPosition(pos)).toBeTruthy();
  }

  describe('Linear Behavior', () => {
    let behavior: LinearBehavior;

    beforeEach(() => {
      behavior = new LinearBehavior();
    });

    it('should move along specified axis', () => {
      // Test X axis
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
      const posX = behavior.update(1000);
      assertXYZ(posX);
      expect(getXValue(posX)).not.toBe(0);
      expect(getYValue(posX)).toBe(0);
      expect(getZValue(posX)).toBe(0);

      // Test Y axis
      behavior.setParameters({ axis: 1, speed: 1, distance: 10 });
      const posY = behavior.update(1000);
      assertXYZ(posY);
      expect(getXValue(posY)).toBe(0);
      expect(getYValue(posY)).not.toBe(0);
      expect(getZValue(posY)).toBe(0);

      // Test Z axis
      behavior.setParameters({ axis: 2, speed: 1, distance: 10 });
      const posZ = behavior.update(1000);
      assertXYZ(posZ);
      expect(getXValue(posZ)).toBe(0);
      expect(getYValue(posZ)).toBe(0);
      expect(getZValue(posZ)).not.toBe(0);
    });

    it('should respect speed parameter', () => {
      behavior.setParameters({ axis: 0, speed: 2, distance: 10 });
      const pos1 = behavior.update(1000);
      assertXYZ(pos1);
      
      behavior.reset();
      behavior.setParameters({ axis: 0, speed: 1, distance: 10 });
      const pos2 = behavior.update(1000);
      assertXYZ(pos2);
      
      expect(Math.abs(getXValue(pos1))).toBeGreaterThan(Math.abs(getXValue(pos2)));
    });

    it('should respect distance bounds', () => {
      behavior.setParameters({ axis: 0, speed: 10, distance: 5 });
      const pos = behavior.update(10000); // Long time to ensure we hit bounds
      assertXYZ(pos);
      expect(Math.abs(getXValue(pos))).toBeLessThanOrEqual(5);
    });
  });

  describe('Sine Wave Behavior', () => {
    let behavior: SineBehavior;

    beforeEach(() => {
      behavior = new SineBehavior();
    });

    it('should oscillate along specified axis', () => {
      // Test X axis
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      // Check all positions are XYZ
      positions.forEach(p => assertXYZ(p));
      
      // Check oscillation
      const xValues = positions.map(p => getXValue(p as XYZPosition));
      expect(Math.max(...xValues)).toBeGreaterThan(0);
      expect(Math.min(...xValues)).toBeLessThan(0);
      
      // Check other axes remain at 0
      positions.forEach(p => {
        assertXYZ(p);
        expect(getYValue(p)).toBe(0);
        expect(getZValue(p)).toBe(0);
      });
    });

    it('should respect frequency parameter', () => {
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const pos1 = behavior.update(250);
      assertXYZ(pos1);
      
      behavior.reset();
      behavior.setParameters({ axis: 0, frequency: 2, amplitude: 10, phase: 0 });
      const pos2 = behavior.update(250);
      assertXYZ(pos2);
      
      expect(Math.abs(getXValue(pos1))).not.toBeCloseTo(Math.abs(getXValue(pos2)));
    });

    it('should respect phase parameter', () => {
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 0 });
      const pos1 = behavior.update(0);
      assertXYZ(pos1);
      
      behavior.reset();
      behavior.setParameters({ axis: 0, frequency: 1, amplitude: 10, phase: 180 });
      const pos2 = behavior.update(0);
      assertXYZ(pos2);
      
      expect(getXValue(pos1)).toBeCloseTo(-getXValue(pos2));
    });

    it('should oscillate in AED mode', () => {
      behavior.setCoordinateSystem('aed');
      
      // Test azimuth oscillation
      behavior.setParameters({ 
        mode: 0, 
        frequency: 1, 
        azimuthAmplitude: 45, 
        phase: 0,
        centerAzimuth: 0,
        centerElevation: 0,
        baseDistance: 10
      });
      
      let positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      positions.forEach(p => assertAED(p));
      
      // Check azimuth oscillation
      const azimuthValues = positions.map(p => getAzimuthValue(p as AEDPosition));
      expect(Math.max(...azimuthValues)).toBeGreaterThan(0);
      expect(Math.min(...azimuthValues)).toBeLessThan(0);
      
      // Reset for elevation test
      behavior.reset();
      behavior.setParameters({ 
        mode: 1, 
        frequency: 1, 
        elevationAmplitude: 30, 
        phase: 0,
        centerAzimuth: 0,
        centerElevation: 0,
        baseDistance: 10
      });
      
      positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      positions.forEach(p => assertAED(p));
      
      // Check elevation oscillation
      const elevationValues = positions.map(p => getElevationValue(p as AEDPosition));
      expect(Math.max(...elevationValues)).toBeGreaterThan(0);
      expect(Math.min(...elevationValues)).toBeLessThan(0);
      
      // Reset for distance test
      behavior.reset();
      behavior.setParameters({ 
        mode: 2, 
        frequency: 1, 
        distanceAmplitude: 5, 
        phase: 0,
        centerAzimuth: 0,
        centerElevation: 0,
        baseDistance: 10
      });
      
      positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      positions.forEach(p => assertAED(p));
      
      // Check distance oscillation
      const distanceValues = positions.map(p => getDistanceValue(p as AEDPosition));
      expect(Math.max(...distanceValues)).toBeGreaterThan(10);
      expect(Math.min(...distanceValues)).toBeLessThan(10);
    });

    it('should respect center parameters in AED mode', () => {
      behavior.setCoordinateSystem('aed');
      behavior.setParameters({ 
        mode: 0,
        frequency: 1,
        azimuthAmplitude: 45,
        phase: 0,
        centerAzimuth: 90,
        centerElevation: 30,
        baseDistance: 15
      });
      
      const pos = behavior.update(0);
      assertAED(pos);
      expect(getAzimuthValue(pos)).toBeCloseTo(90);
      expect(getElevationValue(pos)).toBeCloseTo(30);
      expect(getDistanceValue(pos)).toBeCloseTo(15);
    });
  });

  describe('Circle Behavior', () => {
    let behavior: CircleBehavior;

    beforeEach(() => {
      behavior = new CircleBehavior();
    });

    it('should move in a circle on specified plane', () => {
      // Test XY plane
      behavior.setParameters({ 
        plane: 0, 
        radius: 10, 
        speed: 1, 
        phase: 0,
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      // Check all positions are XYZ
      positions.forEach(p => assertXYZ(p));
      
      // Check circular motion
      positions.forEach(p => {
        assertXYZ(p);
        const radius = Math.sqrt(getXValue(p) ** 2 + getYValue(p) ** 2);
        expect(radius).toBeCloseTo(10);
        expect(getZValue(p)).toBe(0);
      });
    });

    it('should respect center position', () => {
      behavior.setParameters({ 
        plane: 0, 
        radius: 10, 
        speed: 1, 
        phase: 0,
        centerX: 5,
        centerY: 5,
        centerZ: 5
      });

      const pos = behavior.update(0);
      assertXYZ(pos);
      const centerDistance = Math.sqrt(
        (getXValue(pos) - 5) ** 2 + 
        (getYValue(pos) - 5) ** 2
      );
      expect(centerDistance).toBeCloseTo(10);
      expect(getZValue(pos)).toBe(5);
    });

    it('should handle different rotation planes in XYZ mode', () => {
      behavior.setCoordinateSystem('xyz');
      
      // Test XY plane
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY',
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });
      let pos = behavior.update(0);
      assertXYZ(pos);
      expect(getZValue(pos)).toBeCloseTo(0);

      // Test YZ plane
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'YZ',
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });
      pos = behavior.update(0);
      assertXYZ(pos);
      expect(getXValue(pos)).toBeCloseTo(0);

      // Test XZ plane
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XZ',
        centerX: 0,
        centerY: 0,
        centerZ: 0
      });
      pos = behavior.update(0);
      assertXYZ(pos);
      expect(getYValue(pos)).toBeCloseTo(0);
    });

    it('should respect center position in XYZ mode', () => {
      behavior.setCoordinateSystem('xyz');
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY',
        centerX: 5,
        centerY: -5,
        centerZ: 3
      });

      const pos = behavior.update(0);
      assertXYZ(pos);
      
      // The circle should be offset by the center position
      expect(Math.abs(getXValue(pos) - 5)).toBeLessThanOrEqual(10);
      expect(Math.abs(getYValue(pos) + 5)).toBeLessThanOrEqual(10);
      expect(getZValue(pos)).toBeCloseTo(3);
    });

    it('should respect center position in AED mode', () => {
      behavior.setCoordinateSystem('aed');
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        centerA: 45,
        centerE: 30,
        centerD: 20
      });

      const pos = behavior.update(0);
      assertAED(pos);
      
      // The circle should maintain the center elevation
      expect(getElevationValue(pos)).toBeCloseTo(30);
      // Distance should be around centerD ± radius
      expect(Math.abs(getDistanceValue(pos) - 20)).toBeLessThanOrEqual(10);
    });

    it('should handle direction parameter correctly', () => {
      behavior.setCoordinateSystem('xyz');
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY',
        direction: 1  // clockwise
      });

      const clockwisePositions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      behavior.reset();
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY',
        direction: -1  // counterclockwise
      });

      const counterClockwisePositions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      // Positions should be mirrored when direction is reversed
      clockwisePositions.forEach((pos, i) => {
        assertXYZ(pos);
        assertXYZ(counterClockwisePositions[i]);
        expect(getXValue(pos)).toBeCloseTo(getXValue(counterClockwisePositions[i]));
        expect(getYValue(pos)).toBeCloseTo(getYValue(counterClockwisePositions[i]));
      });
    });

    it('should handle phase parameter correctly', () => {
      behavior.setCoordinateSystem('xyz');
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 90,  // 90 degree phase shift
        plane: 'XY',
        direction: 1
      });

      const phaseShiftedPositions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      behavior.reset();
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY',
        direction: 1
      });

      // Move 1/4 of the way through the circle (equivalent to 90 degree phase)
      behavior.update(250);
      const normalPositions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      // Phase shifted positions should match normal positions
      phaseShiftedPositions.forEach((pos, i) => {
        assertXYZ(pos);
        assertXYZ(normalPositions[i]);
        expect(getXValue(pos)).toBeCloseTo(getXValue(normalPositions[i]));
        expect(getYValue(pos)).toBeCloseTo(getYValue(normalPositions[i]));
      });
    });

    it('should handle frequency parameter correctly', () => {
      behavior.setCoordinateSystem('xyz');
      behavior.setParameters({
        radius: 10,
        frequency: 2, // 2 revolutions per second
        phase: 0,
        plane: 'XY'
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      // With frequency=2, we should complete a full revolution in 500ms
      // So at 250ms we should be at opposite side of circle
      assertXYZ(positions[0]);
      assertXYZ(positions[1]);
      expect(getXValue(positions[0])).toBeCloseTo(-getXValue(positions[1]));
      expect(getYValue(positions[0])).toBeCloseTo(-getYValue(positions[1]));
    });

    it('should maintain correct behavior when switching coordinate systems', () => {
      // Start in XYZ mode
      behavior.setCoordinateSystem('xyz');
      behavior.setParameters({
        radius: 10,
        frequency: 1,
        phase: 0,
        plane: 'XY'
      });
      const xyzPos = behavior.update(0);
      assertXYZ(xyzPos);

      // Switch to AED mode
      behavior.setCoordinateSystem('aed');
      const aedPos = behavior.update(0);
      assertAED(aedPos);

      // The distance from center should be maintained
      const distance = Math.sqrt(
        getXValue(xyzPos) * getXValue(xyzPos) + 
        getYValue(xyzPos) * getYValue(xyzPos) + 
        getZValue(xyzPos) * getZValue(xyzPos)
      );
      expect(getDistanceValue(aedPos)).toBeCloseTo(distance);
    });
  });

  describe('Orbit Behavior', () => {
    let behavior: OrbitBehavior;

    beforeEach(() => {
      behavior = new OrbitBehavior();
    });

    it('should maintain constant distance', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 0,
        wobbleSpeed: 0
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      
      positions.forEach(p => {
        assertAED(p);
        expect(getDistanceValue(p)).toBeCloseTo(10);
      });
    });

    it('should respect elevation parameter', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 0,
        wobbleSpeed: 0
      });

      const pos = behavior.update(0);
      assertAED(pos);
      expect(getElevationValue(pos)).toBeCloseTo(45);
    });

    it('should apply wobble effect', () => {
      behavior.setParameters({ 
        distance: 10,
        speed: 1,
        elevation: 45,
        phase: 0,
        wobble: 10,
        wobbleSpeed: 1
      });

      const positions = Array.from({ length: 4 }, (_, i) => behavior.update(i * 250));
      positions.forEach(p => assertAED(p));
      
      const elevations = positions.map(p => {
        assertAED(p);
        return getElevationValue(p);
      });
      expect(Math.max(...elevations)).toBeGreaterThan(45);
      expect(Math.min(...elevations)).toBeLessThan(45);
    });
  });

  describe('Common Behavior Requirements', () => {
    const behaviors = [
      new LinearBehavior(),
      new SineBehavior(),
      new CircleBehavior(),
      new OrbitBehavior()
    ];

    it('should provide both XYZ and AED positions', () => {
      behaviors.forEach(behavior => {
        const result = behavior.update(0);
        assertXYZ(result);
        assertAED(result);
      });
    });

    it('should produce valid positions', () => {
      behaviors.forEach(behavior => {
        const result = behavior.update(0);
        expect(validatePosition(result)).toBe(true);
      });
    });

    it('should handle reset correctly', () => {
      behaviors.forEach(behavior => {
        const pos1 = behavior.update(1000);
        behavior.reset();
        const pos2 = behavior.update(0);
        
        // After reset, position should be different from position at t=1000
        expect(getXValue(pos1)).not.toBeCloseTo(getXValue(pos2));
      });
    });
  });

  describe('Position Comparison', () => {
    it('should have opposite x,y values for clockwise vs counterclockwise', () => {
      const clockwisePositions = Array.from({ length: 4 }, (_, i) => {
        const pos = new CircleBehavior().update(i * 250);
        expect(isXYZPosition(pos)).toBeTruthy();
        return pos as XYZPosition;
      });

      new CircleBehavior().setParameterValue('direction', 'counterclockwise');
      
      const counterClockwisePositions = Array.from({ length: 4 }, (_, i) => {
        const pos = new CircleBehavior().update(i * 250);
        expect(isXYZPosition(pos)).toBeTruthy();
        return pos as XYZPosition;
      });

      clockwisePositions.forEach((pos, i) => {
        expect(isXYZPosition(pos)).toBeTruthy();
        expect(isXYZPosition(counterClockwisePositions[i])).toBeTruthy();
        expect(getXValue(pos)).toBeCloseTo(-getXValue(counterClockwisePositions[i] as XYZPosition));
        expect(getYValue(pos)).toBeCloseTo(-getYValue(counterClockwisePositions[i] as XYZPosition));
      });
    });
  });
});
