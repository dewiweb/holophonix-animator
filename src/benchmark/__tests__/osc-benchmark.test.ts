import { OSCBenchmark } from '../osc-benchmark';

jest.mock('../../shared/services/osc-handler', () => {
  return {
    OSCHandler: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockImplementation(() => {
        return new Promise(resolve => setTimeout(resolve, 5)); // 5ms simulated latency
      }),
      sendBatch: jest.fn().mockImplementation((messages) => {
        return new Promise(resolve => setTimeout(resolve, messages.length * 2)); // 2ms per message
      }),
      close: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('OSCBenchmark', () => {
  let benchmark: OSCBenchmark;

  beforeEach(() => {
    jest.clearAllMocks();
    benchmark = new OSCBenchmark();
  });

  afterEach(async () => {
    await benchmark.close();
  });

  describe('measureLatency', () => {
    it('should measure message latency', async () => {
      const result = await benchmark.measureLatency(10, 0);
      
      expect(result.messagesSent).toBe(10);
      expect(result.errors).toBe(0);
      expect(result.averageLatency).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
    });

    it('should handle errors during measurement', async () => {
      const handler = require('../../shared/services/osc-handler').OSCHandler.mock.results[0].value;
      handler.send.mockRejectedValueOnce(new Error('Send failed'));

      const result = await benchmark.measureLatency(10, 0);
      
      expect(result.messagesSent).toBe(10);
      expect(result.errors).toBe(1);
      expect(result.averageLatency).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
    });
  });

  describe('measureThroughput', () => {
    it('should measure message throughput', async () => {
      const result = await benchmark.measureThroughput(1, 10);
      
      expect(result.messagesSent).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      expect(result.throughput).toBeGreaterThan(0);
    });

    it('should handle errors during measurement', async () => {
      const handler = require('../../shared/services/osc-handler').OSCHandler.mock.results[0].value;
      handler.sendBatch.mockRejectedValueOnce(new Error('Send failed'));

      const result = await benchmark.measureThroughput(1, 10);
      
      expect(result.messagesSent).toBeGreaterThan(0);
      expect(result.errors).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
    });
  });
});
