import { PerformanceObserver, performance } from 'perf_hooks';
import { LocalStorageService } from '../services/LocalStorageService';

interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  memoryUsage?: number;
}

interface OptimizationConfig {
  cacheTimeout: number;
  batchSize: number;
  maxConcurrent: number;
  memoryThreshold: number;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics[] = [];
  private operationTimers: Map<string, number> = new Map();
  private batchOperations: Map<string, any[]> = new Map();
  private concurrentOperations: number = 0;

  private config: OptimizationConfig = {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    batchSize: 10,
    maxConcurrent: 3,
    memoryThreshold: 0.8, // 80% of available memory
  };

  private constructor() {
    this.setupPerformanceObserver();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private setupPerformanceObserver(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.push({
          operationName: entry.name,
          duration: entry.duration,
          timestamp: entry.startTime,
          memoryUsage: process.memoryUsage().heapUsed,
        });
      });
    });

    observer.observe({ entryTypes: ['measure'] });
  }

  async startOperation(operationName: string): Promise<void> {
    if (this.concurrentOperations >= this.config.maxConcurrent) {
      await this.waitForAvailableSlot();
    }

    this.operationTimers.set(operationName, performance.now());
    this.concurrentOperations++;

    performance.mark(`${operationName}-start`);
  }

  async endOperation(operationName: string): Promise<void> {
    performance.mark(`${operationName}-end`);
    performance.measure(
      operationName,
      `${operationName}-start`,
      `${operationName}-end`
    );

    this.concurrentOperations--;
    this.operationTimers.delete(operationName);
  }

  private async waitForAvailableSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.concurrentOperations < this.config.maxConcurrent) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  async addToBatch(batchName: string, operation: any): Promise<void> {
    if (!this.batchOperations.has(batchName)) {
      this.batchOperations.set(batchName, []);
    }

    const batch = this.batchOperations.get(batchName)!;
    batch.push(operation);

    if (batch.length >= this.config.batchSize) {
      await this.processBatch(batchName);
    }
  }

  private async processBatch(batchName: string): Promise<void> {
    const batch = this.batchOperations.get(batchName) || [];
    if (batch.length === 0) return;

    await this.startOperation(`batch-${batchName}`);

    try {
      // Process batch operations
      await Promise.all(batch.map(operation => operation()));

      // Clear processed batch
      this.batchOperations.set(batchName, []);
    } catch (error) {
      console.error(`Error processing batch ${batchName}:`, error);
      throw error;
    } finally {
      await this.endOperation(`batch-${batchName}`);
    }
  }

  async optimizeMemory(): Promise<void> {
    const memoryUsage = process.memoryUsage();
    const usageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (usageRatio > this.config.memoryThreshold) {
      await this.clearOldMetrics();
      await this.clearOldCache();
      global.gc?.(); // Call garbage collector if available
    }
  }

  private async clearOldMetrics(): Promise<void> {
    const now = Date.now();
    this.metrics = this.metrics.filter(metric =>
      now - metric.timestamp < 24 * 60 * 60 * 1000 // Keep last 24 hours
    );
  }

  private async clearOldCache(): Promise<void> {
    await LocalStorageService.clearOldCache();
  }

  async getPerformanceReport(): Promise<{
    metrics: PerformanceMetrics[];
    summary: {
      averageOperationTime: number;
      totalOperations: number;
      memoryUsage: number;
      slowestOperations: string[];
    };
  }> {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      metric => now - metric.timestamp < 60 * 60 * 1000 // Last hour
    );

    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageTime = totalTime / recentMetrics.length || 0;

    const slowestOps = [...recentMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
      .map(metric => metric.operationName);

    return {
      metrics: recentMetrics,
      summary: {
        averageOperationTime: averageTime,
        totalOperations: recentMetrics.length,
        memoryUsage: process.memoryUsage().heapUsed,
        slowestOperations: slowestOps,
      },
    };
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  async optimizeOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    await this.startOperation(operationName);

    try {
      const result = await operation();
      await this.optimizeMemory();
      return result;
    } finally {
      await this.endOperation(operationName);
    }
  }

  async batchProcess<T>(
    batchName: string,
    operations: (() => Promise<T>)[]
  ): Promise<T[]> {
    const results: T[] = [];
    const batches = [];

    // Split operations into batches
    for (let i = 0; i < operations.length; i += this.config.batchSize) {
      batches.push(operations.slice(i, i + this.config.batchSize));
    }

    // Process batches sequentially
    for (const batch of batches) {
      await this.startOperation(`batch-${batchName}`);
      try {
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
      } finally {
        await this.endOperation(`batch-${batchName}`);
      }
      await this.optimizeMemory();
    }

    return results;
  }
}

export default PerformanceOptimizer.getInstance();

