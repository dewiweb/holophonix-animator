import { Position } from '../react/types';

export interface TestConfig {
  osc: {
    host: string;
    port: number;
    sendPort: number;
    receivePort: number;
  };
  track: {
    id: string;
    position: Position;
  };
  animation: {
    duration: number;
    keyframes: {
      time: number;
      position: Position;
    }[];
  };
}

export const TEST_CONFIG: TestConfig = {
  osc: {
    host: 'localhost',
    port: 4003,
    sendPort: 4003,
    receivePort: 4004,
  },
  track: {
    id: 'test-track',
    position: { x: 0, y: 0, z: 0 },
  },
  animation: {
    duration: 5000,
    keyframes: [
      {
        time: 0,
        position: { x: 0, y: 0, z: 0 },
      },
      {
        time: 2500,
        position: { x: 1, y: 1, z: 0 },
      },
      {
        time: 5000,
        position: { x: 0, y: 0, z: 0 },
      },
    ],
  },
};

export const mockStateManager = {
  add_track: jest.fn().mockResolvedValue(true),
  get_track: jest.fn().mockResolvedValue(TEST_CONFIG.track),
  update_track_position: jest.fn().mockResolvedValue(true),
  remove_track: jest.fn().mockResolvedValue(true),
};

export const mockAnimationEngine = {
  play: jest.fn().mockResolvedValue(true),
  pause: jest.fn().mockResolvedValue(true),
  stop: jest.fn().mockResolvedValue(true),
  is_playing: jest.fn().mockResolvedValue(false),
  get_current_time: jest.fn().mockResolvedValue(0),
  set_keyframes: jest.fn().mockResolvedValue(true),
  get_keyframes: jest.fn().mockResolvedValue(TEST_CONFIG.animation.keyframes),
  get_position_at_time: jest.fn().mockResolvedValue(TEST_CONFIG.track.position),
};

export const mockOscManager = {
  connect: jest.fn().mockResolvedValue(true),
  disconnect: jest.fn().mockResolvedValue(true),
  send_position: jest.fn().mockResolvedValue(true),
  create_position_message: jest.fn().mockResolvedValue(new Uint8Array()),
};

export const positions = {
  center: { x: 0, y: 0, z: 0 },
  left: { x: -1, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  front: { x: 0, y: 1, z: 0 },
  back: { x: 0, y: -1, z: 0 },
} as const;
