/**
 * Core Types for Track State Management
 */

export interface CartesianCoordinates {
  /** X coordinate (-1.0 to 1.0) */
  x: number;
  /** Y coordinate (-1.0 to 1.0) */
  y: number;
  /** Z coordinate (-1.0 to 1.0) */
  z: number;
}

export interface PolarCoordinates {
  /** Azimuth in degrees (0.0 to 360.0) */
  azim: number;
  /** Elevation in degrees (-90.0 to 90.0) */
  elev: number;
  /** Distance (0.0 to 1.0) */
  dist: number;
}

export interface Color {
  r: number;  // 0-1 range
  g: number;  // 0-1 range
  b: number;  // 0-1 range
  a: number;  // 0-1 range
}

export interface TrackParameters {
  /** Track position in cartesian coordinates */
  cartesian?: CartesianCoordinates;
  /** Track position in polar coordinates */
  polar?: PolarCoordinates;
  /** Track gain (0.0 to 1.0) */
  gain?: number;
  /** Track mute state */
  mute?: boolean;
  /** Track name */
  name?: string;
  /** Track color */
  color?: Color;
}

export interface TrackState extends TrackParameters {
  lastUpdate: Date;
}

export interface StateUpdate {
  trackId: number;
  parameter: keyof TrackParameters;
  value: any;
  timestamp: Date;
}

export interface ErrorInfo {
  type: OSCErrorType;
  message: string;
  retryable: boolean;
  data?: unknown;
}

export enum OSCErrorType {
  STATE_SYNC = 'STATE_SYNC',
  VALIDATION = 'VALIDATION',
  STATE_UPDATE = 'STATE_UPDATE'
}

export interface OSCMessage {
  address: string;
  args: Array<number | string | boolean>;
}

export interface OSCConfig {
  host: string;
  port: number;
  enabled: boolean;
}

export const DEFAULT_OSC_CONFIG: OSCConfig = {
  host: 'localhost',
  port: 8000,
  enabled: true,
}
