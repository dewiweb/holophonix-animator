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
  get_track: jest.fn().mockImplementation((id) => 
    id === TEST_CONFIG.track.id 
      ? Promise.resolve(TEST_CONFIG.track)
      : Promise.reject(undefined)
  ),
  update_track_position: jest.fn().mockResolvedValue(true),
  remove_track: jest.fn().mockResolvedValue(true),
};

export const mockAnimationEngine = {
  play: jest.fn().mockImplementation(() => {
    mockAnimationEngine.isPlaying = true;
    return Promise.resolve(true);
  }),
  pause: jest.fn().mockImplementation(() => {
    mockAnimationEngine.isPlaying = false;
    return Promise.resolve(true);
  }),
  stop: jest.fn().mockImplementation(() => {
    mockAnimationEngine.isPlaying = false;
    mockAnimationEngine.currentTime = 0;
    return Promise.resolve(true);
  }),
  is_playing: jest.fn().mockImplementation(() => 
    Promise.resolve(mockAnimationEngine.isPlaying)
  ),
  get_current_time: jest.fn().mockImplementation(() =>
    Promise.resolve(mockAnimationEngine.currentTime)
  ),
  set_keyframes: jest.fn().mockResolvedValue(true),
  get_keyframes: jest.fn().mockResolvedValue(TEST_CONFIG.animation.keyframes),
  get_position_at_time: jest.fn().mockImplementation((time) => 
    time >= 0 && time <= TEST_CONFIG.animation.duration
      ? Promise.resolve({
          x: time / TEST_CONFIG.animation.duration,
          y: time / TEST_CONFIG.animation.duration,
          z: 0
        })
      : Promise.reject(undefined)
  ),
  isPlaying: false,
  currentTime: 0,
};

export const mockOscManager = {
  connect: jest.fn().mockImplementation(() => {
    mockOscManager.isConnected = true;
    return Promise.resolve(true);
  }),
  disconnect: jest.fn().mockImplementation(() => {
    mockOscManager.isConnected = false;
    return Promise.resolve(true);
  }),
  send_position: jest.fn().mockImplementation((trackId, position) => 
    mockOscManager.isConnected 
      ? Promise.resolve(true)
      : Promise.reject(undefined)
  ),
  create_position_message: jest.fn().mockImplementation((trackId, position) =>
    Promise.resolve(new Uint8Array([1, 2, 3, 4]))
  ),
  isConnected: false,
};

export const positions = {
  center: { x: 0, y: 0, z: 0 },
  left: { x: -1, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  front: { x: 0, y: 1, z: 0 },
  back: { x: 0, y: -1, z: 0 },
} as const;
