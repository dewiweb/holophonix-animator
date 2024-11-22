import { UDPPort } from 'osc';
import { OSCHandler } from '../osc-handler';
import { OSCConfig, OSCErrorType, Color } from '../../types/osc.types';

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

describe('OSCHandler Color Handling', () => {
  let handler: OSCHandler;
  let messageCallback: (msg: any) => void;

  const testConfig: Partial<OSCConfig> = {
    port: 4003,
    host: '127.0.0.1',
    connectionTimeout: 100,
    maxRetries: 2,
    queryTimeout: 100,
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
        callback();
      }
      return mockUDPPort;
    });

    handler = new OSCHandler(testConfig);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Color Parameter Handling', () => {
    beforeEach(async () => {
      await handler.connect();
    });

    it('should send color updates correctly', async () => {
      const trackId = 1;
      const color: Color = { r: 0.5, g: 0.6, b: 0.7, a: 0.8 };

      mockUDPPort.send.mockResolvedValue(undefined);
      await handler.updateTrackParameters(trackId, { color });

      // Should send only combined color message
      expect(mockUDPPort.send).toHaveBeenCalledTimes(1);
      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/track/1/color',
        args: [0.5, 0.6, 0.7, 0.8]
      });
    });

    it('should validate color values', async () => {
      const trackId = 1;
      const invalidColor: Color = { r: 1.5, g: 0.5, b: 0.5, a: 0.5 };

      await expect(
        handler.updateTrackParameters(trackId, { color: invalidColor })
      ).rejects.toMatchObject({
        type: OSCErrorType.VALIDATION,
        message: expect.stringContaining('Color red value 1.5 is out of range')
      });

      expect(mockUDPPort.send).not.toHaveBeenCalled();
    });

    it('should update track state with color', async () => {
      const trackId = 1;
      const color: Color = { r: 0.1, g: 0.2, b: 0.3, a: 0.4 };

      mockUDPPort.send.mockResolvedValue(undefined);
      await handler.updateTrackParameters(trackId, { color });

      const state = handler.getTrackState(trackId);
      expect(state?.color).toEqual(color);
    });

    it('should handle incoming color messages', () => {
      const trackId = 1;
      
      // Test color message
      messageCallback({
        address: `/track/${trackId}/color`,
        args: [0.1, 0.2, 0.3, 0.4]
      });

      const state = handler.getTrackState(trackId);
      expect(state?.color).toEqual({
        r: 0.1,
        g: 0.2,
        b: 0.3,
        a: 0.4
      });
    });

    it('should handle color updates in batch operations', async () => {
      const trackId = 1;
      const colors: Color[] = [
        { r: 0.1, g: 0.2, b: 0.3, a: 0.4 },
        { r: 0.5, g: 0.6, b: 0.7, a: 0.8 }
      ];

      mockUDPPort.send.mockResolvedValue(undefined);

      // Update colors in sequence
      for (const color of colors) {
        await handler.updateTrackParameters(trackId, { color });
      }

      // Should send 2 messages total (1 per color)
      expect(mockUDPPort.send).toHaveBeenCalledTimes(2);

      const state = handler.getTrackState(trackId);
      expect(state?.color).toEqual(colors[1]); // Should have the last color
    });

    it('should ignore malformed color messages', () => {
      const trackId = 1;
      
      // Test message with wrong number of arguments
      messageCallback({
        address: `/track/${trackId}/color`,
        args: [0.1, 0.2, 0.3] // Missing alpha
      });

      const state = handler.getTrackState(trackId);
      expect(state?.color).toBeUndefined();
    });
  });
});
