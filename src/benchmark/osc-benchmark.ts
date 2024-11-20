import { OSCHandler } from '../shared/services/osc-handler';
import { performance } from 'perf_hooks';

interface BenchmarkResult {
  messagesSent: number;
  totalTime: number;
  averageLatency: number;
  throughput: number;  // messages per second
  errors: number;
}

export class OSCBenchmark {
  private handler: OSCHandler;
  private results: BenchmarkResult = {
    messagesSent: 0,
    totalTime: 0,
    averageLatency: 0,
    throughput: 0,
    errors: 0
  };

  constructor() {
    this.handler = new OSCHandler();
  }

  /**
   * Run latency benchmark
   * @param iterations Number of messages to send
   * @param interval Interval between messages in ms
   */
  public async measureLatency(iterations: number = 1000, interval: number = 10): Promise<BenchmarkResult> {
    await this.handler.connect();
    
    const latencies: number[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.handler.send({
          address: '/benchmark/ping',
          args: [start]
        });
        const end = performance.now();
        latencies.push(end - start);
      } catch (error) {
        errors++;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    const totalTime = latencies.reduce((a, b) => a + b, 0);
    const averageLatency = totalTime / latencies.length;
    const throughput = (iterations - errors) / (totalTime / 1000);

    this.results = {
      messagesSent: iterations,
      totalTime,
      averageLatency,
      throughput,
      errors
    };

    return this.results;
  }

  /**
   * Run throughput benchmark
   * @param duration Duration in seconds
   * @param batchSize Number of messages to send in each batch
   */
  public async measureThroughput(duration: number = 10, batchSize: number = 100): Promise<BenchmarkResult> {
    await this.handler.connect();
    
    const start = performance.now();
    let messagesSent = 0;
    let errors = 0;

    while (performance.now() - start < duration * 1000) {
      const batch = Array(batchSize).fill(null).map(() => ({
        address: '/benchmark/throughput',
        args: [messagesSent]
      }));

      try {
        await this.handler.sendBatch(batch);
        messagesSent += batchSize;
      } catch (error) {
        errors += batchSize;
      }
    }

    const totalTime = performance.now() - start;
    const throughput = (messagesSent - errors) / (totalTime / 1000);

    this.results = {
      messagesSent,
      totalTime,
      averageLatency: totalTime / messagesSent,
      throughput,
      errors
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
