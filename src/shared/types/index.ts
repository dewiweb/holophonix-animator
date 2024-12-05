export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface TrackParameters {
  id: string;
  position: Position;
  name?: string;
  color?: string;
  gain?: number;
  mute?: boolean;
}

export interface OSCMessage {
  address: string;
  args: any[];
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface OSCConfig {
  host: string;
  port: number;
}

export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
}

export interface KeyFrame {
  time: number;
  position: Position;
}
