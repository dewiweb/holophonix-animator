// Coordinate system types
export type CoordinateSystem = 'xyz' | 'xy' | 'aed' | 'ae';
export type PositionType = 'absolute' | 'relative';

// Base position interface with Holophonix-specific requirements
export interface HolophonixPosition {
  type: PositionType;
  coordinate: CoordinateSystem;
  values: {
    [key: string]: {
      value: number;
      increment?: boolean; // true for +, false for - (used in relative mode)
    };
  };
}

// XYZ coordinate system
export interface XYZPosition extends HolophonixPosition {
  coordinate: 'xyz';
  values: {
    x?: { value: number; increment?: boolean };
    y?: { value: number; increment?: boolean };
    z?: { value: number; increment?: boolean };
  };
}

// XY coordinate system (2D plane)
export interface XYPosition extends HolophonixPosition {
  coordinate: 'xy';
  values: {
    x?: { value: number; increment?: boolean };
    y?: { value: number; increment?: boolean };
  };
}

// AED coordinate system (Azimuth, Elevation, Distance)
export interface AEDPosition extends HolophonixPosition {
  coordinate: 'aed';
  values: {
    azimuth?: { value: number; increment?: boolean };
    elevation?: { value: number; increment?: boolean };
    distance?: { value: number; increment?: boolean };
  };
}

// AE coordinate system (Azimuth, Elevation only)
export interface AEPosition extends HolophonixPosition {
  coordinate: 'ae';
  values: {
    azimuth?: { value: number; increment?: boolean };
    elevation?: { value: number; increment?: boolean };
  };
}

// Utility type to get the values type for a given coordinate system
export type CoordinateValues<T extends CoordinateSystem> = 
  T extends 'xyz' ? XYZPosition['values'] :
  T extends 'xy' ? XYPosition['values'] :
  T extends 'aed' ? AEDPosition['values'] :
  T extends 'ae' ? AEPosition['values'] :
  never;

// Helper functions to create positions
export const createPosition = <T extends CoordinateSystem>(
  type: 'absolute' | 'relative',
  coordinate: T,
  values: CoordinateValues<T>
): HolophonixPosition => ({
  type,
  coordinate,
  values,
});

// Create an absolute XYZ position
export const createXYZPosition = (x: number, y: number, z: number): XYZPosition => ({
  type: 'absolute',
  coordinate: 'xyz',
  values: {
    x: { value: x },
    y: { value: y },
    z: { value: z }
  }
});

// Create a relative XYZ position
export const createRelativeXYZPosition = (
  x: { value: number; increment: boolean } | undefined,
  y: { value: number; increment: boolean } | undefined,
  z: { value: number; increment: boolean } | undefined
): XYZPosition => ({
  type: 'relative',
  coordinate: 'xyz',
  values: {
    ...(x && { x }),
    ...(y && { y }),
    ...(z && { z })
  }
});

// Create an absolute AED position
export const createAEDPosition = (
  azimuth: number,
  elevation: number,
  distance: number
): AEDPosition => ({
  type: 'absolute',
  coordinate: 'aed',
  values: {
    azimuth: { value: azimuth },
    elevation: { value: elevation },
    distance: { value: distance }
  }
});

// Create a relative AED position
export const createRelativeAEDPosition = (
  azimuth: { value: number; increment: boolean } | undefined,
  elevation: { value: number; increment: boolean } | undefined,
  distance: { value: number; increment: boolean } | undefined
): AEDPosition => ({
  type: 'relative',
  coordinate: 'aed',
  values: {
    ...(azimuth && { azimuth }),
    ...(elevation && { elevation }),
    ...(distance && { distance })
  }
});

// Utility functions to get position values
export const getXYZValues = (pos: XYZPosition): { x: number; y: number; z: number } => ({
  x: pos.values.x?.value ?? 0,
  y: pos.values.y?.value ?? 0,
  z: pos.values.z?.value ?? 0
});

export const getAEDValues = (pos: AEDPosition): { azimuth: number; elevation: number; distance: number } => ({
  azimuth: pos.values.azimuth?.value ?? 0,
  elevation: pos.values.elevation?.value ?? 0,
  distance: pos.values.distance?.value ?? 0
});

// Helper function to check if a position has changed
export const hasPositionChanged = (pos1: HolophonixPosition, pos2: HolophonixPosition): boolean => {
  if (pos1.coordinate !== pos2.coordinate || pos1.type !== pos2.type) {
    return true;
  }

  const values1 = Object.entries(pos1.values);
  const values2 = Object.entries(pos2.values);

  if (values1.length !== values2.length) {
    return true;
  }

  return values1.some(([key, value]) => {
    const value2 = pos2.values[key];
    return !value2 || value.value !== value2.value || value.increment !== value2.increment;
  });
};

// Type guards for position types
export const isXYZPosition = (pos: HolophonixPosition): pos is XYZPosition =>
  pos.coordinate === 'xyz';

export const isAEDPosition = (pos: HolophonixPosition): pos is AEDPosition =>
  pos.coordinate === 'aed';

export const isXYPosition = (pos: HolophonixPosition): pos is XYPosition =>
  pos.coordinate === 'xy';

export const isAEPosition = (pos: HolophonixPosition): pos is AEPosition =>
  pos.coordinate === 'ae';

// Constants for coordinate system bounds
interface CoordinateBounds {
  min: number;
  max: number;
}

interface XYZBounds {
  x: CoordinateBounds;
  y: CoordinateBounds;
  z: CoordinateBounds;
}

interface AEDBounds {
  azimuth: CoordinateBounds;
  elevation: CoordinateBounds;
  distance: CoordinateBounds;
}

export const COORDINATE_BOUNDS = {
  xyz: {
    x: { min: -10, max: 10 },
    y: { min: -10, max: 10 },
    z: { min: -10, max: 10 }
  } as XYZBounds,
  aed: {
    azimuth: { min: -180, max: 180 },
    elevation: { min: -90, max: 90 },
    distance: { min: 0, max: 100 }
  } as AEDBounds
} as const;

type CoordinateSystemBounds = {
  xyz: XYZBounds;
  aed: AEDBounds;
};

// Utility functions to safely access position values
export function getXValue(pos: XYZPosition): number {
  return pos.values.x?.value ?? 0;
}

export function getYValue(pos: XYZPosition): number {
  return pos.values.y?.value ?? 0;
}

export function getZValue(pos: XYZPosition): number {
  return pos.values.z?.value ?? 0;
}

export function getAzimuthValue(pos: AEDPosition): number {
  return pos.values.azimuth?.value ?? 0;
}

export function getElevationValue(pos: AEDPosition): number {
  return pos.values.elevation?.value ?? 0;
}

export function getDistanceValue(pos: AEDPosition): number {
  return pos.values.distance?.value ?? 0;
}

// Coordinate system conversion utilities
export function convertXYZtoAED(pos: XYZPosition): AEDPosition {
  const x = getXValue(pos);
  const y = getYValue(pos);
  const z = getZValue(pos);

  const distance = Math.sqrt(x * x + y * y + z * z);
  const azimuth = (Math.atan2(z, x) * 180 / Math.PI + 360) % 360;
  const elevation = Math.asin(y / distance) * 180 / Math.PI;

  return createAEDPosition(azimuth, elevation, distance);
}

export function convertAEDtoXYZ(pos: AEDPosition): XYZPosition {
  const azimuth = getAzimuthValue(pos);
  const elevation = getElevationValue(pos);
  const distance = getDistanceValue(pos);

  const azimuthRad = (azimuth * Math.PI) / 180;
  const elevationRad = (elevation * Math.PI) / 180;

  const x = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
  const y = distance * Math.sin(elevationRad);
  const z = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);

  return createXYZPosition(x, y, z);
}

// Position interpolation utilities
export function interpolatePositions(
  start: HolophonixPosition,
  end: HolophonixPosition,
  t: number // 0 to 1
): HolophonixPosition {
  // If both positions are in the same coordinate system, interpolate directly
  if (start.coordinate === end.coordinate) {
    if (start.coordinate === 'aed') {
      const startAED = start as AEDPosition;
      const endAED = end as AEDPosition;
      
      // Handle angle wrapping for azimuth
      let azimuthDiff = endAED.values.azimuth!.value - startAED.values.azimuth!.value;
      if (azimuthDiff > 180) azimuthDiff -= 360;
      if (azimuthDiff < -180) azimuthDiff += 360;
      
      const azimuth = startAED.values.azimuth!.value + azimuthDiff * t;
      const elevation = startAED.values.elevation!.value + 
        (endAED.values.elevation!.value - startAED.values.elevation!.value) * t;
      const distance = startAED.values.distance!.value + 
        (endAED.values.distance!.value - startAED.values.distance!.value) * t;
      
      return createAEDPosition(azimuth, elevation, distance);
    }
    
    if (start.coordinate === 'xyz') {
      const startXYZ = start as XYZPosition;
      const endXYZ = end as XYZPosition;
      
      const x = getXValue(startXYZ) * (1 - t) + getXValue(endXYZ) * t;
      const y = getYValue(startXYZ) * (1 - t) + getYValue(endXYZ) * t;
      const z = getZValue(startXYZ) * (1 - t) + getZValue(endXYZ) * t;
      
      return createXYZPosition(x, y, z);
    }
  }
  
  // For cross-coordinate interpolation, convert to the start coordinate system
  if (start.coordinate === 'xyz') {
    const startXYZ = start as XYZPosition;
    const endXYZ = isXYZPosition(end) ? end : convertAEDtoXYZ(end as AEDPosition);
    
    const x = getXValue(startXYZ) * (1 - t) + getXValue(endXYZ) * t;
    const y = getYValue(startXYZ) * (1 - t) + getYValue(endXYZ) * t;
    const z = getZValue(startXYZ) * (1 - t) + getZValue(endXYZ) * t;
    
    return createXYZPosition(x, y, z);
  } else {
    const startAED = start as AEDPosition;
    const endAED = isAEDPosition(end) ? end : convertXYZtoAED(end as XYZPosition);
    
    // Handle angle wrapping for azimuth
    let azimuthDiff = endAED.values.azimuth!.value - startAED.values.azimuth!.value;
    if (azimuthDiff > 180) azimuthDiff -= 360;
    if (azimuthDiff < -180) azimuthDiff += 360;
    
    const azimuth = startAED.values.azimuth!.value + azimuthDiff * t;
    const elevation = startAED.values.elevation!.value + 
      (endAED.values.elevation!.value - startAED.values.elevation!.value) * t;
    const distance = startAED.values.distance!.value + 
      (endAED.values.distance!.value - startAED.values.distance!.value) * t;
    
    return createAEDPosition(azimuth, elevation, distance);
  }
}

// Position validation utilities
export function validatePosition(pos: HolophonixPosition): boolean {
  const system = pos.coordinate === 'xyz' ? 'xyz' : 'aed';
  const bounds = COORDINATE_BOUNDS[system];
  
  return Object.entries(pos.values).every(([key, value]) => {
    const bound = bounds[key as keyof typeof bounds] as CoordinateBounds | undefined;
    return bound ? (value.value >= bound.min && value.value <= bound.max) : true;
  });
}

// Position normalization utilities
export function normalizePosition(pos: HolophonixPosition): HolophonixPosition {
  const system = pos.coordinate === 'xyz' ? 'xyz' : 'aed';
  const bounds = COORDINATE_BOUNDS[system];
  
  const normalizedValues = Object.fromEntries(
    Object.entries(pos.values).map(([key, value]) => {
      const bound = bounds[key as keyof typeof bounds] as CoordinateBounds | undefined;
      if (!bound) return [key, value];
      
      return [key, {
        ...value,
        value: Math.max(bound.min, Math.min(bound.max, value.value))
      }];
    })
  );

  return {
    ...pos,
    values: normalizedValues
  };
}
