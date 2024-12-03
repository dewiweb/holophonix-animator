// Connection Types
export enum ConnectionStatus {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Error = 'Error',
}

export interface OscConfig {
  host: string;
  port: number;
  retryInterval?: number;
  maxRetries?: number;
}

// OSC Types
export interface OSCMessage {
  address: string;
  args: any[];
}

export enum OSCErrorType {
  ConnectionFailed = 'ConnectionFailed',
  InvalidMessage = 'InvalidMessage',
  NetworkError = 'NetworkError',
}

// Animation Types
export interface AnimationConfig {
  fps: number;
  updateInterval: number;
  interpolationSteps: number;
}

export interface Keyframe {
  time: number;
  position: Position;
}

// Position Types
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Track Types
export interface Track {
  id: string;
  position: Position;
  active: boolean;
}

export interface TrackState {
  id: string;
  position: Position;
  keyframes: Keyframe[];
  active: boolean;
  timestamp: Date;
}

export interface TrackParameters {
  id: string;
  position: Position;
  active?: boolean;
  keyframes?: Keyframe[];
}

// Test Types
export interface TestConfig {
  osc: OscConfig;
  animation: AnimationConfig;
  track: {
    defaultPosition: Position;
    bounds: {
      x: [number, number];
      y: [number, number];
      z: [number, number];
    };
  };
  testing: {
    timeout: number;
    mockLatency: number;
  };
}
