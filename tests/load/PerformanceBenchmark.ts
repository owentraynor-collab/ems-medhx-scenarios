import { performance } from 'perf_hooks';
import os from 'os';
import { MonitoringService } from '../../server/src/monitoring/MonitoringService';

interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
  scenarios: BenchmarkScenario[];
  metrics: {
    cpu: boolean;
    memory: boolean;
    network: boolean;
    database: boolean;
  };
}

interface BenchmarkScenario {
  name: string;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  run: () => Promise<void>;
  metrics?: {
    custom?: string[];
    skipDefault?: boolean;
  };
}

interface BenchmarkResult {
  scenario: string;
  iteration: number;
  executionTime: number;
  metrics: {
    cpu?: {
      usage: number;
      loadAverage: number[];
    };
    memory?: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    network?: {
      bytesIn: number;
      bytesOut: number;
      connections: number;
    };
    database?: {
      queryTime: number;
      connections: number;
      cacheHits: number;
    };
    custom?: Record<string, number>;
  };
}

interface BenchmarkSummary {
  scenario: string;
  iterations: number;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  metrics: {
    cpu?: {
      averageUsage: number;
      peakUsage: number;
    };
    memory?: {
      averageHeapUsed: number;
      peakHeapUsed: number;
      leakSuspected: boolean;
    };
    network?: {
      totalBytesTransferred: number;
      averageConnections: number;
    };
    database?: {
      averageQueryTime: number;
      cacheHitRate: number;
    };
    custom?: Record<string, {
      average: number;
      peak: number;
    }>;
  };
}

class PerformanceBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private monitoring: typeof MonitoringService;

  constructor(config: BenchmarkConfig) {
    this.config = config;
    this.monitoring = MonitoringService.getInstance();
  }

  async runBenchmarks(): Promise<BenchmarkSummary[]> {
    console.log('Starting performance benchmarks...');

    // Warmup phase
    if (this.config.warmupIterations > 0) {
      console.log(`Running ${this.config.warmupIterations} warmup iterations...`);
      await this.runWarmup();
    }

    // Main benchmark phase
    const summaries: BenchmarkSummary[] = [];
    for (const scenario of this.config.scenarios) {
      console.log(`Running benchmark: ${scenario.name}`);
      const summary = await this.runScenarioBenchmark(scenario);
      summaries.push(summary);
    }

    return summaries;
  }

  private async runWarmup(): Promise<void> {
    for (const scenario of this.config.scenarios) {
      for (let i = 0; i < this.config.warmupIterations; i++) {
        await scenario.run();
      }
    }
  }

  private async runScenarioBenchmark(
    scenario: BenchmarkScenario
  ): Promise<BenchmarkSummary> {
    const scenarioResults: BenchmarkResult[] = [];

    // Setup
    if (scenario.setup) {
      await scenario.setup();
    }

    // Run iterations
    for (let i = 0; i < this.config.iterations; i++) {
      const result = await this.runIteration(scenario, i);
      scenarioResults.push(result);
    }

    // Teardown
    if (scenario.teardown) {
      await scenario.teardown();
    }

    return this.generateScenarioSummary(scenario.name, scenarioResults);
  }

  private async runIteration(
    scenario: BenchmarkScenario,
    iteration: number
  ): Promise<BenchmarkResult> {
    // Start metric collection
    const startMetrics = await this.captureMetrics();
    const startTime = performance.now();

    // Run scenario
    await scenario.run();

    // End metric collection
    const endTime = performance.now();
    const endMetrics = await this.captureMetrics();

    return {
      scenario: scenario.name,
      iteration,
      executionTime: endTime - startTime,
      metrics: this.calculateMetricsDelta(startMetrics, endMetrics),
    };
  }

  private async captureMetrics(): Promise<any> {
    const metrics: any = {};

    if (this.config.metrics.cpu) {
      metrics.cpu = {
        usage: os.loadavg()[0],
        loadAverage: os.loadavg(),
      };
    }

    if (this.config.metrics.memory) {
      metrics.memory = process.memoryUsage();
    }

    if (this.config.metrics.network) {
      metrics.network = await this.monitoring.getNetworkMetrics();
    }

    if (this.config.metrics.database) {
      metrics.database = await this.monitoring.getDatabaseMetrics();
    }

    return metrics;
  }

  private calculateMetricsDelta(start: any, end: any): BenchmarkResult['metrics'] {
    const delta: BenchmarkResult['metrics'] = {};

    if (this.config.metrics.cpu) {
      delta.cpu = {
        usage: end.cpu.usage - start.cpu.usage,
        loadAverage: end.cpu.loadAverage,
      };
    }

    if (this.config.metrics.memory) {
      delta.memory = {
        heapUsed: end.memory.heapUsed - start.memory.heapUsed,
        heapTotal: end.memory.heapTotal,
        external: end.memory.external - start.memory.external,
        rss: end.memory.rss - start.memory.rss,
      };
    }

    if (this.config.metrics.network) {
      delta.network = {
        bytesIn: end.network.bytesIn - start.network.bytesIn,
        bytesOut: end.network.bytesOut - start.network.bytesOut,
        connections: end.network.connections,
      };
    }

    if (this.config.metrics.database) {
      delta.database = {
        queryTime: end.database.queryTime - start.database.queryTime,
        connections: end.database.connections,
        cacheHits: end.database.cacheHits - start.database.cacheHits,
      };
    }

    return delta;
  }

  private generateScenarioSummary(
    scenarioName: string,
    results: BenchmarkResult[]
  ): BenchmarkSummary {
    const executionTimes = results.map(r => r.executionTime).sort((a, b) => a - b);
    
    const summary: BenchmarkSummary = {
      scenario: scenarioName,
      iterations: results.length,
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / results.length,
      p95ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.95)],
      p99ExecutionTime: executionTimes[Math.floor(executionTimes.length * 0.99)],
      metrics: {},
    };

    if (this.config.metrics.cpu) {
      const cpuUsage = results.map(r => r.metrics.cpu?.usage || 0);
      summary.metrics.cpu = {
        averageUsage: cpuUsage.reduce((a, b) => a + b, 0) / results.length,
        peakUsage: Math.max(...cpuUsage),
      };
    }

    if (this.config.metrics.memory) {
      const heapUsage = results.map(r => r.metrics.memory?.heapUsed || 0);
      const heapTrend = this.calculateTrend(heapUsage);
      
      summary.metrics.memory = {
        averageHeapUsed: heapUsage.reduce((a, b) => a + b, 0) / results.length,
        peakHeapUsed: Math.max(...heapUsage),
        leakSuspected: heapTrend > 0.1, // 10% growth trend indicates potential leak
      };
    }

    if (this.config.metrics.network) {
      const totalBytes = results.reduce((sum, r) => 
        sum + (r.metrics.network?.bytesIn || 0) + (r.metrics.network?.bytesOut || 0), 0
      );
      const connections = results.map(r => r.metrics.network?.connections || 0);

      summary.metrics.network = {
        totalBytesTransferred: totalBytes,
        averageConnections: connections.reduce((a, b) => a + b, 0) / results.length,
      };
    }

    if (this.config.metrics.database) {
      const queryTimes = results.map(r => r.metrics.database?.queryTime || 0);
      const cacheHits = results.reduce((sum, r) => sum + (r.metrics.database?.cacheHits || 0), 0);
      const totalQueries = results.length;

      summary.metrics.database = {
        averageQueryTime: queryTimes.reduce((a, b) => a + b, 0) / results.length,
        cacheHitRate: (cacheHits / totalQueries) * 100,
      };
    }

    return summary;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    values.forEach((value, index) => {
      sumX += index;
      sumY += value;
      sumXY += index * value;
      sumX2 += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope / values[0]; // Normalize to initial value
  }
}

// Example usage:
const config: BenchmarkConfig = {
  iterations: 100,
  warmupIterations: 10,
  scenarios: [
    {
      name: 'Scenario Loading Performance',
      async run() {
        // Simulate scenario loading
        await new Promise(resolve => setTimeout(resolve, 100));
      },
    },
    {
      name: 'Student Assessment Performance',
      async setup() {
        // Setup test data
      },
      async run() {
        // Simulate assessment completion
        await new Promise(resolve => setTimeout(resolve, 200));
      },
      async teardown() {
        // Cleanup test data
      },
      metrics: {
        custom: ['assessmentTime', 'scoreCalculation'],
      },
    },
  ],
  metrics: {
    cpu: true,
    memory: true,
    network: true,
    database: true,
  },
};

export default PerformanceBenchmark;

