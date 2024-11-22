/**
 * OSC Message Types and Interfaces
 */

export interface OSCConfig {
  /** Default port for OSC communication */
  port: number;
  /** Host address */
  host: string;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Batch size limit for parameter updates */
  maxBatchSize: number;
  /** State validation interval in milliseconds */
  validationInterval: number;
  /** Query timeout in milliseconds */
  queryTimeout: number;
}

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
  /** Track gain (-inf to 10.0) */
  gain?: number;
  /** Track mute state (0 or 1) */
  mute?: boolean;
  /** Track name */
  name?: string;
  /** Track color */
  color?: Color;
}

export interface TrackState extends TrackParameters {
  /** Last update timestamp */
  lastUpdate: Date;
}

export interface OSCMessage {
  /** OSC address pattern */
  address: string;
  /** Message arguments */
  args: Array<string | number | boolean>;
}

export enum OSCErrorType {
  CONNECTION = 'CONNECTION_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  STATE_SYNC = 'STATE_SYNC_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  BATCH = 'BATCH_ERROR'
}

export interface OSCError {
  type: OSCErrorType;
  message: string;
  retryable: boolean;
  data?: unknown;
}

export type MessageType = 'state_response' | 'parameter_update' | 'status_update' | 'error';

export interface OSCIncomingMessage {
  /** OSC address pattern */
  address: string;
  /** Message arguments */
  args: any[];
  /** Message type */
  type: MessageType;
  /** Track ID if applicable */
  trackId?: number;
  /** Parameter name if applicable */
  parameter?: string;
}

export interface OSCStateUpdate {
  trackId: number;
  parameter: keyof TrackParameters;
  value: any;
  timestamp: Date;
}

/** Default configuration values */
export const DEFAULT_OSC_CONFIG: OSCConfig = {
  port: 4003,
  host: '127.0.0.1',
  connectionTimeout: 5000,    // 5 seconds
  maxRetries: 3,
  maxBatchSize: 50,          // Maximum messages per batch
  validationInterval: 5000,   // 5 seconds
  queryTimeout: 1000         // 1 second
};
