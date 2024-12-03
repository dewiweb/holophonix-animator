import '@testing-library/jest-dom';

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  callback(0);
  return 0;
};

// Mock performance.now()
global.performance.now = jest.fn(() => 0);

// Mock Rust bindings
jest.mock('../bindings', () => ({
  AnimationEngine: jest.fn().mockImplementation(() => ({
    update: jest.fn().mockResolvedValue(undefined),
    get_state: jest.fn().mockResolvedValue({
      current_animation: null,
      timeline: { 
        current_time: 0,
        duration: 10000,
        is_playing: false
      },
      current_position: { x: 0, y: 0, z: 0 }
    }),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    seek: jest.fn().mockResolvedValue(undefined),
    load_animation: jest.fn().mockResolvedValue(undefined),
    save_animation: jest.fn().mockResolvedValue(undefined),
    add_keyframe: jest.fn().mockResolvedValue(undefined),
    remove_keyframe: jest.fn().mockResolvedValue(undefined),
    update_keyframe: jest.fn().mockResolvedValue(undefined)
  })),
  OSCManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    update_config: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    get_status: jest.fn().mockResolvedValue('Disconnected')
  })),
  StateManager: jest.fn().mockImplementation(() => ({
    load_state: jest.fn().mockResolvedValue(undefined),
    save_state: jest.fn().mockResolvedValue(undefined),
    get_tracks: jest.fn().mockResolvedValue([]),
    add_track: jest.fn().mockResolvedValue(undefined),
    remove_track: jest.fn().mockResolvedValue(undefined),
    update_track: jest.fn().mockResolvedValue(undefined)
  })),
  ConnectionStatus: {
    Connected: 'Connected',
    Connecting: 'Connecting',
    Disconnected: 'Disconnected',
    Error: 'Error'
  }
}));

// Create mock canvas contexts
const createMockContext2D = () => ({
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  setTransform: jest.fn(),
  transform: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 0 }),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  canvas: document.createElement('canvas')
}) as unknown as CanvasRenderingContext2D;

const createMockContextBitmap = () => ({
  transferFromImageBitmap: jest.fn(),
  canvas: document.createElement('canvas')
}) as unknown as ImageBitmapRenderingContext;

const createMockContextWebGL = () => ({
  canvas: document.createElement('canvas'),
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  viewport: jest.fn(),
  clear: jest.fn(),
  getExtension: jest.fn()
}) as unknown as WebGLRenderingContext;

// Mock getContext
const mockGetContext = jest.fn((contextId: string) => {
  switch (contextId) {
    case '2d':
      return createMockContext2D();
    case 'bitmaprenderer':
      return createMockContextBitmap();
    case 'webgl':
    case 'webgl2':
      return createMockContextWebGL();
    default:
      return null;
  }
});

// Type-safe assignment of getContext mock
HTMLCanvasElement.prototype.getContext = mockGetContext as typeof HTMLCanvasElement.prototype.getContext;

import { AnimationEngine, OSCManager } from '../bindings';

// Mock shared types
export const mockPosition = { x: 0, y: 0, z: 0 };
export const mockTrackParameters = {
  id: 'test-track',
  position: mockPosition,
};
export const mockConnectionStatus = {
  connected: false,
  error: null,
};

export const mockOscConfig = {
  host: 'localhost',
  port: 8000,
  enabled: true,
};
