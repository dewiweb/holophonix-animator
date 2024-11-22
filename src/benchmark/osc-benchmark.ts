import { OSCHandler } from '../shared/services/osc-handler';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  messagesSent: number;
  totalTime: number;
  averageLatency: number;
  throughput: number;  // messages per second
  errors: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  errorRate: number;
}

export class OSCBenchmark {
  private handler: OSCHandler;
  private results: BenchmarkResult = {
    messagesSent: 0,
    totalTime: 0,
    averageLatency: 0,
    throughput: 0,
    errors: 0,
    memoryUsage: {
      heapUsed: 0,
      heapTotal: 0,
      external: 0
    },
    cpuUsage: {
      user: 0,
      system: 0
    },
    errorRate: 0
  };

  constructor() {
    this.handler = new OSCHandler();
  }

  /**
   * Measure system resource usage
   */
  private getResourceUsage(): { memory: any, cpu: any } {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    return { memory, cpu };
  }

  /**
   * Run latency benchmark
   * @param iterations Number of messages to send
   * @param interval Interval between messages in ms
   */
  public async measureLatency(iterations: number = 1000, interval: number = 10): Promise<BenchmarkResult> {
    await this.handler.connect();
    
    const startResources = this.getResourceUsage();
    const latencies: number[] = [];
    let errors = 0;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.handler.send({
          address: '/benchmark/ping',
          args: [{ type: 'i', value: i }]
        });
        latencies.push(performance.now() - start);
      } catch (error) {
        errors++;
      }
      
      if (interval > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    const endTime = performance.now();
    const endResources = this.getResourceUsage();

    this.results = {
      messagesSent: iterations,
      totalTime: endTime - startTime,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      throughput: (iterations / (endTime - startTime)) * 1000,
      errors,
      memoryUsage: {
        heapUsed: endResources.memory.heapUsed - startResources.memory.heapUsed,
        heapTotal: endResources.memory.heapTotal - startResources.memory.heapTotal,
        external: endResources.memory.external - startResources.memory.external
      },
      cpuUsage: {
        user: endResources.cpu.user - startResources.cpu.user,
        system: endResources.cpu.system - startResources.cpu.system
      },
      errorRate: errors / iterations
    };

    return this.results;
  }

  /**
   * Run throughput benchmark by sending messages in parallel
   * @param totalMessages Total number of messages to send
   * @param batchSize Number of messages to send in parallel
   */
  public async measureThroughput(totalMessages: number = 10000, batchSize: number = 100): Promise<BenchmarkResult> {
    await this.handler.connect();
    
    const startResources = this.getResourceUsage();
    let errors = 0;
    const startTime = performance.now();

    for (let i = 0; i < totalMessages; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, totalMessages - i) }, (_, index) => {
        return this.handler.send({
          address: '/benchmark/throughput',
          args: [{ type: 'i', value: i + index }]
        }).catch(() => errors++);
      });

      await Promise.all(batch);
    }

    const endTime = performance.now();
    const endResources = this.getResourceUsage();

    this.results = {
      messagesSent: totalMessages,
      totalTime: endTime - startTime,
      averageLatency: (endTime - startTime) / totalMessages,
      throughput: (totalMessages / (endTime - startTime)) * 1000,
      errors,
      memoryUsage: {
        heapUsed: endResources.memory.heapUsed - startResources.memory.heapUsed,
        heapTotal: endResources.memory.heapTotal - startResources.memory.heapTotal,
        external: endResources.memory.external - startResources.memory.external
      },
      cpuUsage: {
        user: endResources.cpu.user - startResources.cpu.user,
        system: endResources.cpu.system - startResources.cpu.system
      },
      errorRate: errors / totalMessages
    };

    return this.results;
  }

  public getResults(): BenchmarkResult {
    return this.results;
  }

  public async close(): Promise<void> {
    await this.handler.close();
  }
}
