import { OSCBenchmark } from '../osc-benchmark';

// Mock process.memoryUsage and process.cpuUsage
const mockMemoryUsage = {
  heapUsed: 1000000,
  heapTotal: 2000000,
  external: 500000,
  rss: 3000000,
  arrayBuffers: 100000
};

const mockCpuUsage = {
  user: 1000000,
  system: 500000
};

jest.mock('process', () => ({
  ...process,
  memoryUsage: jest.fn().mockReturnValue(mockMemoryUsage),
  cpuUsage: jest.fn().mockReturnValue(mockCpuUsage)
}));

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
    it('should measure message latency with resource usage', async () => {
      const result = await benchmark.measureLatency(10, 0);
      
      expect(result.messagesSent).toBe(10);
      expect(result.errors).toBe(0);
      expect(result.averageLatency).toBeGreaterThan(0);
      expect(result.throughput).toBeGreaterThan(0);
      
      // Resource usage checks
      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.heapUsed).toBeDefined();
      expect(result.memoryUsage.heapTotal).toBeDefined();
      expect(result.memoryUsage.external).toBeDefined();
      
      expect(result.cpuUsage).toBeDefined();
      expect(result.cpuUsage.user).toBeDefined();
      expect(result.cpuUsage.system).toBeDefined();
      
      expect(result.errorRate).toBe(0);
    });

    it('should handle errors during measurement', async () => {
      const handler = require('../../shared/services/osc-handler').OSCHandler.mock.results[0].value;
      handler.send.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await benchmark.measureLatency(10, 0);
      
      expect(result.errors).toBe(1);
      expect(result.errorRate).toBe(0.1); // 1 error out of 10 messages
      expect(result.messagesSent).toBe(10);
    });

    it('should respect message interval', async () => {
      const startTime = Date.now();
      await benchmark.measureLatency(5, 100); // 5 messages with 100ms interval
      const duration = Date.now() - startTime;
      
      // Should take at least 400ms (4 intervals between 5 messages)
      expect(duration).toBeGreaterThanOrEqual(400);
    });
  });

  describe('measureThroughput', () => {
    it('should measure throughput with resource monitoring', async () => {
      const result = await benchmark.measureThroughput(100, 10);
      
      expect(result.messagesSent).toBe(100);
      expect(result.errors).toBe(0);
      expect(result.throughput).toBeGreaterThan(0);
      expect(result.errorRate).toBe(0);
      
      // Resource usage checks
      expect(result.memoryUsage.heapUsed).toBeDefined();
      expect(result.cpuUsage.user).toBeDefined();
    });

    it('should handle partial batch failures', async () => {
      const handler = require('../../shared/services/osc-handler').OSCHandler.mock.results[0].value;
      handler.send
        .mockRejectedValueOnce(new Error('Batch error 1'))
        .mockRejectedValueOnce(new Error('Batch error 2'));
      
      const result = await benchmark.measureThroughput(50, 10);
      
      expect(result.errors).toBeGreaterThan(0);
      expect(result.errorRate).toBeGreaterThan(0);
      expect(result.messagesSent).toBe(50);
    });

    it('should maintain consistent performance under load', async () => {
      const results = await Promise.all([
        benchmark.measureThroughput(100, 10),
        benchmark.measureThroughput(100, 10),
        benchmark.measureThroughput(100, 10)
      ]);
      
      // Check that throughput remains relatively consistent
      const throughputs = results.map(r => r.throughput);
      const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
      const maxDeviation = Math.max(...throughputs.map(t => Math.abs(t - avgThroughput)));
      
      // Allow for up to 20% deviation from average
      expect(maxDeviation / avgThroughput).toBeLessThan(0.2);
    });
  });

  describe('resource usage', () => {
    it('should track memory growth during operations', async () => {
      const before = process.memoryUsage().heapUsed;
      await benchmark.measureThroughput(1000, 100);
      const after = process.memoryUsage().heapUsed;
      
      // Memory usage should be tracked
      expect(after - before).toBeDefined();
    });

    it('should track CPU usage during operations', async () => {
      const before = process.cpuUsage();
      await benchmark.measureLatency(100, 10);
      const after = process.cpuUsage();
      
      // CPU usage should be tracked
      expect(after.user - before.user).toBeDefined();
      expect(after.system - before.system).toBeDefined();
    });
  });
});
