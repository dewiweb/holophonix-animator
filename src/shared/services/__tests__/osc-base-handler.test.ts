import { OSCBaseHandler } from '../osc-base-handler';
import { OSCConfig, OSCErrorType, ConnectionState } from '../../types/osc.types';
import { EventEmitter } from 'events';
import { MockUDPPort } from './__mocks__/udp-port.mock';

// Mock UDPPort
jest.mock('osc', () => ({
  UDPPort: jest.fn().mockImplementation(() => new MockUDPPort())
}));

describe('OSCBaseHandler', () => {
  let handler: OSCBaseHandler;
  const defaultConfig: Partial<OSCConfig> = {
    serverIP: '127.0.0.1',
    localIP: '0.0.0.0',
    inputPort: 9000,
    outputPort: 9001
  };

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new OSCBaseHandler(defaultConfig);
  });

  afterEach(() => {
    try {
      handler.close();
    } catch (error) {
      // Ignore close errors in cleanup
    }
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(handler).toBeInstanceOf(OSCBaseHandler);
      expect(handler).toBeInstanceOf(EventEmitter);
    });

    it('should throw error on invalid server IP', () => {
      expect(() => {
        new OSCBaseHandler({ ...defaultConfig, serverIP: 'invalid-ip' });
      }).toThrow();
    });

    it('should throw error on invalid local IP', () => {
      expect(() => {
        new OSCBaseHandler({ ...defaultConfig, localIP: 'invalid-ip' });
      }).toThrow();
    });

    it('should throw error on invalid input port', () => {
      expect(() => {
        new OSCBaseHandler({ ...defaultConfig, inputPort: -1 });
      }).toThrow();
    });

    it('should throw error on invalid output port', () => {
      expect(() => {
        new OSCBaseHandler({ ...defaultConfig, outputPort: 70000 });
      }).toThrow();
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockOutputPort = handler['outputPort'] as MockUDPPort;

      // Spy on open methods
      jest.spyOn(mockInputPort, 'open');
      jest.spyOn(mockOutputPort, 'open');

      // Start connection
      const connectPromise = handler.connect();

      // Simulate both ports becoming ready
      mockInputPort.emit('ready');
      mockOutputPort.emit('ready');

      await connectPromise;
      expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(mockInputPort.open).toHaveBeenCalled();
      expect(mockOutputPort.open).toHaveBeenCalled();
    });

    it('should handle connection timeout', async () => {
      jest.useFakeTimers();

      // Start connection
      const connectPromise = handler.connect();

      // Advance time past timeout
      jest.advanceTimersByTime(6000); // Default timeout is 5000ms

      await expect(connectPromise).rejects.toMatchObject({
        type: OSCErrorType.TIMEOUT
      });

      jest.useRealTimers();
    });

    it('should handle port errors during connection', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockError = new Error('Port error');
      const errorHandler = jest.fn();
      handler.on('error', errorHandler);

      // Start connection
      const connectPromise = handler.connect();

      // Simulate error
      mockInputPort.emit('error', mockError);

      await expect(connectPromise).rejects.toMatchObject({
        type: OSCErrorType.CONNECTION,
        data: mockError
      });

      expect(handler.getConnectionState()).toBe(ConnectionState.ERROR);
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: OSCErrorType.CONNECTION,
        data: mockError
      }));
    });

    it('should not allow multiple concurrent connections', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockOutputPort = handler['outputPort'] as MockUDPPort;

      // Spy on open methods
      jest.spyOn(mockInputPort, 'open');
      jest.spyOn(mockOutputPort, 'open');

      // Start first connection
      const firstConnect = handler.connect();

      // Attempt second connection
      const secondConnect = handler.connect();

      // Complete first connection
      mockInputPort.emit('ready');
      mockOutputPort.emit('ready');

      // Both promises should resolve to the same connection
      await expect(firstConnect).resolves.toBeUndefined();
      await expect(secondConnect).resolves.toBeUndefined();
      expect(mockInputPort.open).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('should close ports and cleanup resources', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockOutputPort = handler['outputPort'] as MockUDPPort;

      // Spy on close methods
      jest.spyOn(mockInputPort, 'close');
      jest.spyOn(mockOutputPort, 'close');

      // Connect first
      const connectPromise = handler.connect();
      mockInputPort.emit('ready');
      mockOutputPort.emit('ready');
      await connectPromise;

      // Close
      handler.close();

      expect(mockInputPort.close).toHaveBeenCalled();
      expect(mockOutputPort.close).toHaveBeenCalled();
      expect(handler.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should handle errors during close', () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockOutputPort = handler['outputPort'] as MockUDPPort;

      // Make close throw errors
      jest.spyOn(mockInputPort, 'close').mockImplementation(() => {
        throw new Error('Close error');
      });
      jest.spyOn(mockOutputPort, 'close').mockImplementation(() => {
        throw new Error('Close error');
      });

      // Should not throw
      expect(() => handler.close()).not.toThrow();
      expect(handler.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('error handling', () => {
    it('should emit error events', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const errorHandler = jest.fn();
      handler.on('error', errorHandler);

      const mockError = new Error('Test error');
      mockInputPort.emit('error', mockError);

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: OSCErrorType.CONNECTION,
        data: mockError
      }));
    });

    it('should handle port errors after connection', async () => {
      const mockInputPort = handler['inputPort'] as MockUDPPort;
      const mockOutputPort = handler['outputPort'] as MockUDPPort;
      const errorHandler = jest.fn();
      handler.on('error', errorHandler);

      // Connect first
      const connectPromise = handler.connect();
      mockInputPort.emit('ready');
      mockOutputPort.emit('ready');
      await connectPromise;

      // Simulate error
      const mockError = new Error('Port error');
      mockInputPort.emit('error', mockError);

      expect(handler.getConnectionState()).toBe(ConnectionState.ERROR);
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: OSCErrorType.CONNECTION,
        data: mockError
      }));
    });
  });

  describe('network interfaces', () => {
    it('should get available network interfaces', () => {
      const interfaces = OSCBaseHandler.getAvailableInterfaces();
      expect(Array.isArray(interfaces)).toBe(true);
      interfaces.forEach(iface => {
        expect(iface).toHaveProperty('name');
        expect(iface).toHaveProperty('ip');
        expect(iface).toHaveProperty('family');
        expect(iface).toHaveProperty('internal');
      });
    });
  });
});
