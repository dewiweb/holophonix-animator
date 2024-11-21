/**
 * OSC Message Types and Interfaces
 */

/**
 * OSC Configuration
 * Configuration options for OSC communication with Holophonix
 */
export interface OSCConfig {
  serverIP: string;
  localIP: string;
  inputPort: number;
  outputPort: number;
  connectionTimeout: number;
  maxRetries: number;
  queryTimeout: number;
  validationInterval: number;
  maxBatchSize: number;
}

/**
 * Default OSC Configuration
 */
export const DEFAULT_OSC_CONFIG: OSCConfig = {
  serverIP: '127.0.0.1',
  localIP: '0.0.0.0',
  inputPort: 9000,
  outputPort: 9001,
  connectionTimeout: 5000,
  maxRetries: 3,
  queryTimeout: 1000,
  validationInterval: 5000,
  maxBatchSize: 10
};

/**
 * Port Constraints
 */
export const PORT_CONSTRAINTS = {
  MIN_PORT: 1024,
  MAX_PORT: 65535
} as const;

/**
 * OSC Message Types
 */
export enum MessageType {
  ANIMATION_CONTROL = 'ANIMATION_CONTROL',
  STATUS = 'STATUS',
  UNKNOWN = 'UNKNOWN'
}

/**
 * OSC Error Types
 */
export enum OSCErrorType {
  CONNECTION = 'CONNECTION',
  TIMEOUT = 'TIMEOUT',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  NOT_CONNECTED = 'NOT_CONNECTED',
  SEND_FAILED = 'SEND_FAILED'
}

/**
 * OSC Error
 */
export interface OSCError {
  type: OSCErrorType;
  message: string;
  retryable: boolean;
  data?: unknown;
  timestamp: string;
}

/**
 * OSC Message
 */
export interface OSCMessage {
  address: string;
  args: Array<{
    type: string;
    value: unknown;
  }>;
}

/**
 * Animation Control Command
 */
export interface AnimationControlCommand {
  type: string;
  parameters?: Record<string, unknown>;
}

/**
 * Animation Control Message
 */
export interface AnimationControlMessage {
  command: string;
  parameters?: Record<string, unknown>;
}

/**
 * Network Interface
 */
export interface NetworkInterface {
  name: string;
  ip: string;
  family: string;
  internal: boolean;
}

/**
 * Connection State
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

/**
 * Cartesian Coordinates
 */
export interface CartesianCoordinates {
  /** X coordinate (-1.0 to 1.0) */
  x: number;
  /** Y coordinate (-1.0 to 1.0) */
  y: number;
  /** Z coordinate (-1.0 to 1.0) */
  z: number;
}

/**
 * Polar Coordinates
 */
export interface PolarCoordinates {
  /** Azimuth in degrees (0.0 to 360.0) */
  azim: number;
  /** Elevation in degrees (-90.0 to 90.0) */
  elev: number;
  /** Distance (0.0 to 1.0) */
  dist: number;
}

/**
 * Color
 */
export interface Color {
  r: number;  // 0-1 range
  g: number;  // 0-1 range
  b: number;  // 0-1 range
  a: number;  // 0-1 range
}

/**
 * Track Parameters
 */
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

/**
 * Track State
 */
export interface TrackState extends TrackParameters {
  /** Last update timestamp */
  lastUpdate: Date;
}

/**
 * IP address validation regex
 */
export const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * OSC Incoming Message
 */
export interface OSCIncomingMessage {
  address: string;
  args: any[];
  type: MessageType;
  trackId?: number;
  timestamp?: string;
}

/**
 * OSC State Update
 */
export interface OSCStateUpdate {
  trackId: number;
  parameter: keyof TrackParameters;
  value: any;
  timestamp: Date;
}

/**
 * Animation Control Command Types
 */
export enum AnimationControlCommandType {
  START = 'start',
  STOP = 'stop',
  PAUSE = 'pause',
  RESUME = 'resume',
  SEEK = 'seek',
  SET_SPEED = 'set_speed'
}

/**
 * Animation Control Command Parameters
 */
export interface AnimationControlCommandParams {
  timestamp?: number;  // For seek command (in milliseconds)
  speed?: number;      // For set_speed command (1.0 is normal speed)
}
