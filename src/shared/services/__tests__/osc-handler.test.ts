import { UDPPort } from 'osc';
import { OSCHandler } from '../osc-handler';
import { OSCConfig, OSCErrorType, TrackParameters, OSCIncomingMessage } from '../../types/osc.types';

// Mock the UDPPort class
const mockUDPPort = {
  on: jest.fn(),
  once: jest.fn(),
  open: jest.fn(),
  close: jest.fn(),
  send: jest.fn()
};

jest.mock('osc', () => ({
  UDPPort: jest.fn().mockImplementation(() => mockUDPPort)
}));

describe('OSCHandler', () => {
  let handler: OSCHandler;
  let messageCallback: (msg: any) => void;

  const testConfig: Partial<OSCConfig> = {
    port: 4003,
    host: '127.0.0.1',
    connectionTimeout: 100, // Reduced timeout for faster tests
    maxRetries: 2,
    queryTimeout: 100, // Add query timeout
    validationInterval: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup message handler
    mockUDPPort.on.mockImplementation((event: string, callback: any) => {
      if (event === 'message') {
        messageCallback = callback;
      }
      return mockUDPPort;
    });

    // Setup ready event
    mockUDPPort.once.mockImplementation((event: string, callback: any) => {
      if (event === 'ready') {
        callback(); // Call immediately instead of using setTimeout
      }
      return mockUDPPort;
    });

    handler = new OSCHandler(testConfig);
  });

  afterEach(() => {
    handler.close();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await expect(connectPromise).resolves.toBeUndefined();
      expect(mockUDPPort.open).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      mockUDPPort.once.mockImplementation((event: string, callback: any) => {
        if (event === 'ready') {
          // Don't call the callback to simulate timeout
        }
        return mockUDPPort;
      });

      const connectPromise = handler.connect();
      jest.advanceTimersByTime(testConfig.connectionTimeout! + 100);
      await expect(connectPromise).rejects.toMatchObject({
        type: OSCErrorType.TIMEOUT
      });
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;
    });

    it('should handle cartesian coordinate updates', (done) => {
      handler.on('state', (update) => {
        expect(update).toMatchObject({
          trackId: 1,
          parameter: 'xyz',
          value: [0.5, -0.3, 0.1]
        });
        done();
      });

      messageCallback({
        address: '/track/1/xyz',
        args: [0.5, -0.3, 0.1]
      });

      jest.runAllTimers();
    });

    it('should handle polar coordinate updates', (done) => {
      handler.on('state', (update) => {
        expect(update).toMatchObject({
          trackId: 1,
          parameter: 'aed',
          value: [45, 30, 0.8]
        });
        done();
      });

      messageCallback({
        address: '/track/1/aed',
        args: [45, 30, 0.8]
      });

      jest.runAllTimers();
    });

    it('should handle color updates', (done) => {
      handler.on('state', (update) => {
        expect(update).toMatchObject({
          trackId: 1,
          parameter: 'color',
          value: [1, 0, 0, 1]
        });
        done();
      });

      messageCallback({
        address: '/track/1/color',
        args: [1, 0, 0, 1]
      });

      jest.runAllTimers();
    });

    it('should maintain track state', () => {
      messageCallback({
        address: '/track/1/xyz',
        args: [0.5, -0.3, 0.1]
      });

      messageCallback({
        address: '/track/1/color',
        args: [1, 0, 0, 1]
      });

      const state = handler.getTrackState(1);
      expect(state).toMatchObject({
        cartesian: { x: 0.5, y: -0.3, z: 0.1 },
        color: { r: 1, g: 0, b: 0, a: 1 }
      });
    });
  });

  describe('parameter queries', () => {
    beforeEach(async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;
    });

    it('should handle parameter query responses', async () => {
      const queryPromise = handler.queryParameter(1, 'xyz');
      
      // Simulate response immediately
      messageCallback({
        address: '/track/1/xyz',
        args: [0.5, -0.3, 0.1]
      });

      jest.runOnlyPendingTimers();
      const result = await queryPromise;
      expect(result).toEqual([0.5, -0.3, 0.1]);
    });

    it('should timeout parameter queries', async () => {
      const promise = handler.queryParameter(1, 'xyz');
      
      // Advance time past the query timeout
      jest.advanceTimersByTime(testConfig.connectionTimeout || 1000);
      
      await expect(promise).resolves.toBe(undefined);
    });
  });

  describe('updateTrackParameters', () => {
    beforeEach(async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;
      mockUDPPort.send.mockImplementation(() => Promise.resolve());
    });

    it('should send cartesian coordinates correctly', async () => {
      await handler.updateTrackParameters(1, {
        cartesian: { x: 0.5, y: -0.3, z: 0.1 }
      });

      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/xyz',
        args: [0.5, -0.3, 0.1]
      });
    });

    it('should send polar coordinates correctly', async () => {
      await handler.updateTrackParameters(1, {
        polar: { azim: 45, elev: 30, dist: 0.8 }
      });

      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/aed',
        args: [45, 30, 0.8]
      });
    });

    it('should send color correctly', async () => {
      await handler.updateTrackParameters(1, {
        color: { r: 1, g: 0, b: 0, a: 1 }
      });

      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/color',
        args: [1, 0, 0, 1]
      });
    });
  });
});
