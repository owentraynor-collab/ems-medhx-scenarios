import { performance } from 'perf_hooks';
import cluster from 'cluster';
import os from 'os';
import axios from 'axios';

interface LoadTestConfig {
  baseUrl: string;
  scenarios: TestScenario[];
  concurrentUsers: number;
  rampUpTime: number;
  testDuration: number;
  thresholds: {
    responseTime: number;
    errorRate: number;
    successRate: number;
  };
}

interface TestScenario {
  name: string;
  weight: number;
  steps: TestStep[];
}

interface TestStep {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  expectedStatus?: number;
  thinkTime?: number;
}

interface TestResult {
  scenario: string;
  step: string;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  successRate: number;
  concurrentUsers: number;
  testDuration: number;
  scenarioResults: Record<string, {
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  }>;
}

class LoadTester {
  private config: LoadTestConfig;
  private results: TestResult[] = [];
  private startTime: number = 0;
  private activeUsers: number = 0;
  private testRunning: boolean = false;

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async runLoadTest(): Promise<TestSummary> {
    if (cluster.isPrimary) {
      return this.orchestrateLoadTest();
    } else {
      return this.runUserSimulation();
    }
  }

  private async orchestrateLoadTest(): Promise<TestSummary> {
    console.log('Starting load test orchestration...');
    this.startTime = performance.now();
    this.testRunning = true;

    // Calculate workers based on CPU cores
    const numCPUs = os.cpus().length;
    const workersPerCPU = Math.ceil(this.config.concurrentUsers / numCPUs);

    // Start worker processes
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();
      worker.send({
        type: 'config',
        users: workersPerCPU,
        startIndex: i * workersPerCPU,
      });
    }

    // Collect results from workers
    const workerResults: TestResult[][] = [];
    let completedWorkers = 0;

    return new Promise((resolve) => {
      cluster.on('message', (worker, message) => {
        if (message.type === 'results') {
          workerResults.push(message.results);
          completedWorkers++;

          if (completedWorkers === numCPUs) {
            const allResults = workerResults.flat();
            resolve(this.generateTestSummary(allResults));
          }
        }
      });

      // Stop test after duration
      setTimeout(() => {
        this.testRunning = false;
        for (const id in cluster.workers) {
          cluster.workers[id]?.send({ type: 'stop' });
        }
      }, this.config.testDuration);
    });
  }

  private async runUserSimulation(): Promise<never> {
    process.on('message', async (message: any) => {
      if (message.type === 'config') {
        const { users, startIndex } = message;
        const userResults: TestResult[] = [];

        // Start user simulations
        const userPromises = Array(users).fill(0).map((_, index) => 
          this.simulateUser(startIndex + index, userResults)
        );

        await Promise.all(userPromises);

        process?.send?.({ type: 'results', results: userResults });
        process.exit(0);
      } else if (message.type === 'stop') {
        process.exit(0);
      }
    });

    return new Promise(() => {}); // Keep worker running
  }

  private async simulateUser(userId: number, results: TestResult[]): Promise<void> {
    while (this.testRunning) {
      const scenario = this.selectScenario();
      await this.runScenario(scenario, userId, results);
    }
  }

  private selectScenario(): TestScenario {
    const totalWeight = this.config.scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const scenario of this.config.scenarios) {
      random -= scenario.weight;
      if (random <= 0) return scenario;
    }

    return this.config.scenarios[0];
  }

  private async runScenario(
    scenario: TestScenario,
    userId: number,
    results: TestResult[]
  ): Promise<void> {
    const sessionHeaders = { 'User-Session': `user-${userId}` };
    
    for (const step of scenario.steps) {
      const startTime = performance.now();
      let success = false;
      let error = undefined;

      try {
        const response = await axios({
          method: step.method,
          url: `${this.config.baseUrl}${step.endpoint}`,
          data: step.payload,
          headers: { ...sessionHeaders, ...step.headers },
          validateStatus: (status) => 
            status === (step.expectedStatus || 200),
        });

        success = true;
      } catch (err) {
        error = err.message;
      }

      const endTime = performance.now();
      results.push({
        scenario: scenario.name,
        step: step.name,
        responseTime: endTime - startTime,
        success,
        error,
        timestamp: Date.now(),
      });

      if (step.thinkTime) {
        await new Promise(resolve => setTimeout(resolve, step.thinkTime));
      }
    }
  }

  private generateTestSummary(results: TestResult[]): TestSummary {
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;

    const scenarioResults: Record<string, {
      responseTimes: number[];
      successes: number;
      total: number;
    }> = {};

    // Group results by scenario
    results.forEach(result => {
      if (!scenarioResults[result.scenario]) {
        scenarioResults[result.scenario] = {
          responseTimes: [],
          successes: 0,
          total: 0,
        };
      }

      const scenarioStats = scenarioResults[result.scenario];
      scenarioStats.responseTimes.push(result.responseTime);
      scenarioStats.total++;
      if (result.success) scenarioStats.successes++;
    });

    // Calculate scenario-specific metrics
    const scenarioMetrics: TestSummary['scenarioResults'] = {};
    Object.entries(scenarioResults).forEach(([scenario, stats]) => {
      scenarioMetrics[scenario] = {
        averageResponseTime: stats.responseTimes.reduce((a, b) => a + b, 0) / stats.total,
        errorRate: ((stats.total - stats.successes) / stats.total) * 100,
        successRate: (stats.successes / stats.total) * 100,
      };
    });

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / totalRequests,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
      successRate: (successfulRequests / totalRequests) * 100,
      concurrentUsers: this.config.concurrentUsers,
      testDuration: this.config.testDuration,
      scenarioResults: scenarioMetrics,
    };
  }
}

// Example usage:
const config: LoadTestConfig = {
  baseUrl: 'http://localhost:3000',
  scenarios: [
    {
      name: 'Student Login and Scenario Completion',
      weight: 70,
      steps: [
        {
          name: 'Login',
          endpoint: '/auth/login',
          method: 'POST',
          payload: {
            username: 'student',
            password: 'password123',
          },
          expectedStatus: 200,
          thinkTime: 1000,
        },
        {
          name: 'Load Scenario',
          endpoint: '/api/scenarios/1',
          method: 'GET',
          expectedStatus: 200,
          thinkTime: 2000,
        },
        {
          name: 'Submit Results',
          endpoint: '/api/scenarios/1/results',
          method: 'POST',
          payload: {
            score: 85,
            completionTime: 300,
            answers: [],
          },
          expectedStatus: 200,
          thinkTime: 1000,
        },
      ],
    },
    {
      name: 'Instructor Dashboard Access',
      weight: 30,
      steps: [
        {
          name: 'Login',
          endpoint: '/auth/login',
          method: 'POST',
          payload: {
            username: 'instructor',
            password: 'password123',
          },
          expectedStatus: 200,
          thinkTime: 1000,
        },
        {
          name: 'Load Dashboard',
          endpoint: '/api/instructor/dashboard',
          method: 'GET',
          expectedStatus: 200,
          thinkTime: 2000,
        },
        {
          name: 'View Student Progress',
          endpoint: '/api/instructor/students/progress',
          method: 'GET',
          expectedStatus: 200,
          thinkTime: 1500,
        },
      ],
    },
  ],
  concurrentUsers: 100,
  rampUpTime: 30000,
  testDuration: 300000,
  thresholds: {
    responseTime: 2000,
    errorRate: 5,
    successRate: 95,
  },
};

export default LoadTester;

