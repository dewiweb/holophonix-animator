import { Vector3 } from 'three';

// Coordinate system types
export type CoordinateSystem = 'xyz' | 'aed';

// Position type definitions
export interface XYZPosition {
  type: 'xyz';
  x: number;
  y: number;
  z: number;
}

export interface AEDPosition {
  type: 'aed';
  azimuth: number;
  elevation: number;
  distance: number;
}

export type HolophonixPosition = XYZPosition | AEDPosition;

// Position creation functions
export function createXYZPosition(x: number, y: number, z: number): XYZPosition {
  return { type: 'xyz', x, y, z };
}

export function createAEDPosition(azimuth: number, elevation: number, distance: number): AEDPosition {
  return { type: 'aed', azimuth, elevation, distance };
}

// Type guards
export function isXYZPosition(pos: HolophonixPosition): pos is XYZPosition {
  return pos.type === 'xyz';
}

export function isAEDPosition(pos: HolophonixPosition): pos is AEDPosition {
  return pos.type === 'aed';
}

// Utility functions to get position values
export function getXValue(pos: HolophonixPosition): number {
  if (isXYZPosition(pos)) {
    return pos.x;
  }
  return convertAEDtoXYZ(pos).x;
}

export function getYValue(pos: HolophonixPosition): number {
  if (isXYZPosition(pos)) {
    return pos.y;
  }
  return convertAEDtoXYZ(pos).y;
}

export function getZValue(pos: HolophonixPosition): number {
  if (isXYZPosition(pos)) {
    return pos.z;
  }
  return convertAEDtoXYZ(pos).z;
}

export function getAzimuthValue(pos: AEDPosition): number {
  return pos.azimuth;
}

export function getElevationValue(pos: AEDPosition): number {
  return pos.elevation;
}

export function getDistanceValue(pos: AEDPosition): number {
  return pos.distance;
}

// Conversion functions
export function convertXYZtoAED(pos: XYZPosition): AEDPosition {
  const { x, y, z } = pos;
  const distance = Math.sqrt(x * x + y * y + z * z);
  const azimuth = Math.atan2(y, x) * (180 / Math.PI);
  const elevation = Math.asin(z / distance) * (180 / Math.PI);
  return createAEDPosition(azimuth, elevation, distance);
}

export function convertAEDtoXYZ(pos: AEDPosition): XYZPosition {
  const { azimuth, elevation, distance } = pos;
  const azRad = azimuth * (Math.PI / 180);
  const elRad = elevation * (Math.PI / 180);
  const x = distance * Math.cos(elRad) * Math.cos(azRad);
  const y = distance * Math.cos(elRad) * Math.sin(azRad);
  const z = distance * Math.sin(elRad);
  return createXYZPosition(x, y, z);
}

export function ensureXYZPosition(pos: HolophonixPosition): XYZPosition {
  if (isXYZPosition(pos)) {
    return pos;
  }
  return convertAEDtoXYZ(pos);
}

export function ensureAEDPosition(pos: HolophonixPosition): AEDPosition {
  if (isAEDPosition(pos)) {
    return pos;
  }
  return convertXYZtoAED(pos);
}

// Position manipulation functions
export function interpolatePositions(pos1: HolophonixPosition, pos2: HolophonixPosition, t: number): HolophonixPosition {
  const xyz1 = ensureXYZPosition(pos1);
  const xyz2 = ensureXYZPosition(pos2);
  
  return createXYZPosition(
    xyz1.x + (xyz2.x - xyz1.x) * t,
    xyz1.y + (xyz2.y - xyz1.y) * t,
    xyz1.z + (xyz2.z - xyz1.z) * t
  );
}

// Normalization functions
export function normalizePosition(pos: HolophonixPosition): HolophonixPosition {
  if (isXYZPosition(pos)) {
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    if (dist === 0) return pos;
    return createXYZPosition(pos.x / dist, pos.y / dist, pos.z / dist);
  } else {
    return createAEDPosition(pos.azimuth, pos.elevation, 1);
  }
}

// Validation functions
export function validatePosition(pos: HolophonixPosition): boolean {
  if (isXYZPosition(pos)) {
    return !isNaN(pos.x) && !isNaN(pos.y) && !isNaN(pos.z);
  } else if (isAEDPosition(pos)) {
    return !isNaN(pos.azimuth) && !isNaN(pos.elevation) && !isNaN(pos.distance);
  }
  return false;
}

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
    x: { min: -100, max: 100 },
    y: { min: -100, max: 100 },
    z: { min: -100, max: 100 }
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
