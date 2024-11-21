import { UDPPort } from 'osc';
import { OSCHandler } from '../osc-handler';
import { 
  OSCConfig, 
  OSCErrorType, 
  ConnectionState,
  TrackParameters, 
  OSCIncomingMessage 
} from '../../types/osc.types';

// Mock the UDPPort class
const mockUDPPort = {
  on: jest.fn(),
  once: jest.fn(),
  open: jest.fn(),
  close: jest.fn(),
  send: jest.fn(),
  emit: jest.fn()
};

jest.mock('osc', () => ({
  UDPPort: jest.fn().mockImplementation(() => mockUDPPort)
}));

describe('OSCHandler', () => {
  let handler: OSCHandler;
  let messageCallback: (msg: any) => void;

  const testConfig: Partial<OSCConfig> = {
    serverIP: '127.0.0.1',
    localIP: '0.0.0.0',
    inputPort: 9000,
    outputPort: 4003,
    connectionTimeout: 100, // Reduced timeout for faster tests
    maxRetries: 2,
    retryDelay: 100 // Reduced delay for faster tests
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
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear all timers
    jest.clearAllTimers();
    
    // Ensure handler is properly closed
    if (handler) {
      handler.close();
    }
    
    // Reset event listeners
    mockUDPPort.on.mockReset();
    mockUDPPort.once.mockReset();
    mockUDPPort.send.mockReset();
    mockUDPPort.emit.mockReset();
    
    // Clear all intervals and timeouts
    jest.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should initialize in disconnected state', () => {
      expect(handler.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should connect successfully', async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;

      expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(mockUDPPort.open).toHaveBeenCalledTimes(2); // Both input and output ports
    });

    it('should handle connection timeout', async () => {
      // Make ready event never fire
      mockUDPPort.once.mockImplementation(() => mockUDPPort);

      const connectPromise = handler.connect();
      jest.runAllTimers();

      await expect(connectPromise).rejects.toMatchObject({
        type: OSCErrorType.TIMEOUT,
        message: 'Connection timeout'
      });
    });

    it('should handle connection errors', async () => {
      // Simulate port error
      mockUDPPort.emit('error', {
        type: OSCErrorType.CONNECTION,
        message: 'Connection failed',
        retryable: true
      });

      const connectPromise = handler.connect();
      jest.runAllTimers();

      await expect(connectPromise).rejects.toMatchObject({
        type: OSCErrorType.CONNECTION,
        message: expect.stringContaining('Connection failed')
      });
    });

    it('should detect connection loss and attempt reconnection', async () => {
      // First connect successfully
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;

      // Simulate 3 failed pings
      for (let i = 0; i < 3; i++) {
        mockUDPPort.send.mockRejectedValueOnce(new Error('Send failed'));
        jest.advanceTimersByTime(5000); // Ping interval
      }

      expect(handler.getConnectionState()).toBe(ConnectionState.RECONNECTING);
    });

    it('should handle successful reconnection', async () => {
      // First connect successfully
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;

      // Simulate connection loss
      for (let i = 0; i < 3; i++) {
        mockUDPPort.send.mockRejectedValueOnce(new Error('Send failed'));
        jest.advanceTimersByTime(5000);
      }

      // Reset mock to allow successful reconnection
      mockUDPPort.send.mockResolvedValue(undefined);
      jest.runAllTimers();

      expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate IP configuration', () => {
      expect(() => new OSCHandler({ 
        ...testConfig, 
        serverIP: 'invalid-ip' 
      })).toThrow(/Invalid server IP/);
    });

    it('should validate port configuration', () => {
      expect(() => new OSCHandler({ 
        ...testConfig, 
        inputPort: 0 
      })).toThrow(/Invalid input port/);
    });

    it('should accept valid configuration', () => {
      expect(() => new OSCHandler(testConfig)).not.toThrow();
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      const connectPromise = handler.connect();
      jest.runAllTimers();
      await connectPromise;
    });

    it('should handle ping messages', () => {
      messageCallback({
        address: '/pong',
        args: []
      });

      expect(handler.getConnectionState()).toBe(ConnectionState.CONNECTED);
    });

    it('should handle animation control messages', () => {
      const onAnimationStart = jest.fn();
      handler.on('animation:start', onAnimationStart);

      messageCallback({
        address: '/animation/control/start',
        args: ['animation1']
      });

      expect(onAnimationStart).toHaveBeenCalledWith('animation1');
    });

    it('should validate incoming messages', () => {
      expect(() => messageCallback({
        // Invalid message format
        address: undefined,
        args: 'not-an-array'
      })).toThrow(/Invalid OSC message structure/);
    });
  });
});
