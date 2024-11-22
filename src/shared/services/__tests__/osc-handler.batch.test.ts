import { UDPPort } from 'osc';
import { OSCHandler } from '../osc-handler';
import { OSCConfig, OSCErrorType, OSCMessage } from '../../types/osc.types';

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

describe('OSCHandler Batch Operations', () => {
  let handler: OSCHandler;
  const testConfig: Partial<OSCConfig> = {
    port: 4003,
    host: '127.0.0.1',
    connectionTimeout: 100,
    maxRetries: 2,
    maxBatchSize: 5, // Small batch size for testing
    queryTimeout: 100,
    validationInterval: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup ready event for immediate connection
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

  describe('sendBatch', () => {
    beforeEach(async () => {
      await handler.connect();
    });

    it('should handle empty batch', async () => {
      await expect(handler.sendBatch([])).resolves.toBeUndefined();
      expect(mockUDPPort.send).not.toHaveBeenCalled();
    });

    it('should process single message batch', async () => {
      const message: OSCMessage = {
        address: '/test/1',
        args: [1]
      };

      mockUDPPort.send.mockResolvedValueOnce(undefined);
      await handler.sendBatch([message]);

      expect(mockUDPPort.send).toHaveBeenCalledTimes(1);
      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/test/1',
        args: [1]
      });
    });

    it('should split large batch into chunks', async () => {
      const messages: OSCMessage[] = Array.from({ length: 12 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      mockUDPPort.send.mockResolvedValue(undefined);
      await handler.sendBatch(messages);

      // With batch size 5, should be called 12 times (one for each message)
      expect(mockUDPPort.send).toHaveBeenCalledTimes(12);
    });

    it('should handle network errors in batch', async () => {
      const messages: OSCMessage[] = Array.from({ length: 3 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      // Make second message fail
      mockUDPPort.send
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      // Should not throw error for partial failure
      await handler.sendBatch(messages);

      expect(mockUDPPort.send).toHaveBeenCalledTimes(3);
    });

    it('should respect rate limiting between messages', async () => {
      const messages: OSCMessage[] = Array.from({ length: 3 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      mockUDPPort.send.mockResolvedValue(undefined);
      const sendPromise = handler.sendBatch(messages);
      
      // Fast-forward time to simulate delays between messages
      for (let i = 0; i < messages.length; i++) {
        await Promise.resolve(); // Let the message send
        jest.advanceTimersByTime(1); // Advance past the rate limit delay
      }

      await sendPromise;
      expect(mockUDPPort.send).toHaveBeenCalledTimes(3);
    });

    it('should throw error for excessive batch size', async () => {
      const messages: OSCMessage[] = Array.from({ length: 51 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      await expect(handler.sendBatch(messages)).rejects.toMatchObject({
        type: OSCErrorType.VALIDATION,
        message: expect.stringContaining('exceeds maximum allowed size')
      });

      expect(mockUDPPort.send).not.toHaveBeenCalled();
    });

    it('should process concurrent batches', async () => {
      const messages: OSCMessage[] = Array.from({ length: 15 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      mockUDPPort.send.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10))
      );

      const sendPromise = handler.sendBatch(messages);
      
      // Fast-forward time to allow concurrent processing
      for (let i = 0; i < messages.length; i++) {
        jest.advanceTimersByTime(10); // Advance past the message send delay
        await Promise.resolve(); // Let the promises resolve
        jest.advanceTimersByTime(1); // Advance past the rate limit delay
      }

      await sendPromise;
      expect(mockUDPPort.send).toHaveBeenCalledTimes(15);
    });

    it('should maintain message order within batches', async () => {
      const messages: OSCMessage[] = Array.from({ length: 3 }, (_, i) => ({
        address: `/test/${i}`,
        args: [i]
      }));

      const sentMessages: OSCMessage[] = [];
      mockUDPPort.send.mockImplementation((msg: OSCMessage) => {
        sentMessages.push(msg);
        return Promise.resolve();
      });

      await handler.sendBatch(messages);

      expect(sentMessages).toHaveLength(3);
      sentMessages.forEach((msg, i) => {
        expect(msg.address).toBe(`/test/${i}`);
        expect(msg.args).toEqual([i]);
      });
    });

    it('should retry failed messages up to max retries', async () => {
      const message: OSCMessage = {
        address: '/test/retry',
        args: [1]
      };

      mockUDPPort.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await handler.sendBatch([message]);

      // Should be called 3 times (original + 2 retries)
      expect(mockUDPPort.send).toHaveBeenCalledTimes(3);
      expect(mockUDPPort.send).toHaveBeenCalledWith({
        address: '/test/retry',
        args: [1]
      });
    });
  });
});
