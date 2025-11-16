import { MonitoringService } from '../../server/src/monitoring/MonitoringService';
import { AutoRemediator } from '../AutoRemediator';
import { OperationsValidator } from '../../tests/ops/OperationsValidator';

interface DashboardMetrics {
  validation: {
    total: number;
    passed: number;
    failed: number;
    categories: Record<string, {
      passed: number;
      failed: number;
      trend: number[];
    }>;
  };
  remediation: {
    total: number;
    successful: number;
    failed: number;
    activeIssues: string[];
    recentActions: {
      timestamp: Date;
      action: string;
      result: string;
    }[];
  };
  performance: {
    responseTime: number[];
    errorRate: number[];
    cpuUsage: number[];
    memoryUsage: number[];
    trend: 'improving' | 'stable' | 'degrading';
  };
}

interface DashboardConfig {
  refreshInterval: number;
  historyLength: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    failureRate: number;
  };
}

class ValidationDashboard {
  private static instance: ValidationDashboard;
  private metrics: DashboardMetrics;
  private config: DashboardConfig;
  private monitoring: typeof MonitoringService;
  private remediator: typeof AutoRemediator;
  private validator: OperationsValidator;
  private updateInterval: NodeJS.Timeout | null;

  private constructor(config: DashboardConfig) {
    this.config = config;
    this.monitoring = MonitoringService.getInstance();
    this.remediator = AutoRemediator.getInstance();
    this.validator = new OperationsValidator({
      environment: 'production',
      services: {
        api: 'https://api.example.com',
        monitoring: 'https://monitoring.example.com',
        database: 'mongodb://db.example.com',
        cache: 'redis://cache.example.com',
      },
      thresholds: {
        responseTime: 200,
        errorRate: 1,
        cpuUsage: 80,
        memoryUsage: 85,
      },
    });
    this.metrics = this.initializeMetrics();
    this.startUpdates();
  }

  static getInstance(config?: DashboardConfig): ValidationDashboard {
    if (!ValidationDashboard.instance) {
      ValidationDashboard.instance = new ValidationDashboard(config || {
        refreshInterval: 60000,
        historyLength: 100,
        alertThresholds: {
          errorRate: 5,
          responseTime: 500,
          failureRate: 10,
        },
      });
    }
    return ValidationDashboard.instance;
  }

  private initializeMetrics(): DashboardMetrics {
    return {
      validation: {
        total: 0,
        passed: 0,
        failed: 0,
        categories: {},
      },
      remediation: {
        total: 0,
        successful: 0,
        failed: 0,
        activeIssues: [],
        recentActions: [],
      },
      performance: {
        responseTime: [],
        errorRate: [],
        cpuUsage: [],
        memoryUsage: [],
        trend: 'stable',
      },
    };
  }

  private startUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(
      async () => this.updateMetrics(),
      this.config.refreshInterval
    );
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Update validation metrics
      const validationResults = await this.validator.validateAll();
      this.updateValidationMetrics(validationResults);

      // Update remediation metrics
      const remediationHistory = await this.remediator.getRemediationHistory();
      const systemHealth = await this.remediator.checkSystemHealth();
      this.updateRemediationMetrics(remediationHistory, systemHealth);

      // Update performance metrics
      const performanceMetrics = await this.monitoring.getMetrics();
      this.updatePerformanceMetrics(performanceMetrics);

      // Emit updates
      this.emitMetricsUpdate();
    } catch (error) {
      console.error('Error updating dashboard metrics:', error);
    }
  }

  private updateValidationMetrics(results: any[]): void {
    const validation = this.metrics.validation;
    validation.total = results.length;
    validation.passed = results.filter(r => r.success).length;
    validation.failed = results.filter(r => !r.success).length;

    // Update categories
    results.forEach(result => {
      if (!validation.categories[result.category]) {
        validation.categories[result.category] = {
          passed: 0,
          failed: 0,
          trend: [],
        };
      }

      const category = validation.categories[result.category];
      if (result.success) {
        category.passed++;
      } else {
        category.failed++;
      }

      // Update trend
      category.trend.push(result.success ? 100 : 0);
      if (category.trend.length > this.config.historyLength) {
        category.trend.shift();
      }
    });
  }

  private updateRemediationMetrics(history: any[], health: any): void {
    const remediation = this.metrics.remediation;
    remediation.total = history.length;
    remediation.successful = history.filter(h => h.success).length;
    remediation.failed = history.filter(h => !h.success).length;
    remediation.activeIssues = health.issues;

    // Update recent actions
    remediation.recentActions = history
      .slice(-10)
      .map(h => ({
        timestamp: h.timestamp,
        action: h.actionId,
        result: h.success ? 'success' : 'failure',
      }));
  }

  private updatePerformanceMetrics(metrics: any): void {
    const performance = this.metrics.performance;

    // Update metrics arrays
    performance.responseTime.push(metrics.api.latency);
    performance.errorRate.push(metrics.api.errorRate);
    performance.cpuUsage.push(metrics.cpu.usage);
    performance.memoryUsage.push(metrics.memory.heapUsage);

    // Maintain history length
    if (performance.responseTime.length > this.config.historyLength) {
      performance.responseTime.shift();
      performance.errorRate.shift();
      performance.cpuUsage.shift();
      performance.memoryUsage.shift();
    }

    // Calculate trend
    performance.trend = this.calculateTrend(performance.responseTime);
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable';

    const recent = values.slice(-10);
    const trend = recent.reduce((acc, val, i) => {
      if (i === 0) return 0;
      return acc + (val - recent[i - 1]);
    }, 0) / (recent.length - 1);

    if (trend < -0.1) return 'improving';
    if (trend > 0.1) return 'degrading';
    return 'stable';
  }

  private emitMetricsUpdate(): void {
    // Emit metrics for real-time updates
    this.monitoring.emit('dashboard-update', this.metrics);
  }

  // Public methods
  async getMetrics(): Promise<DashboardMetrics> {
    return this.metrics;
  }

  async getValidationSummary(): Promise<any> {
    const { validation } = this.metrics;
    return {
      total: validation.total,
      passed: validation.passed,
      failed: validation.failed,
      successRate: (validation.passed / validation.total) * 100,
      categories: Object.entries(validation.categories).map(([name, data]) => ({
        name,
        passed: data.passed,
        failed: data.failed,
        trend: this.calculateTrend(data.trend),
      })),
    };
  }

  async getRemediationSummary(): Promise<any> {
    const { remediation } = this.metrics;
    return {
      total: remediation.total,
      successful: remediation.successful,
      failed: remediation.failed,
      successRate: (remediation.successful / remediation.total) * 100,
      activeIssues: remediation.activeIssues,
      recentActions: remediation.recentActions,
    };
  }

  async getPerformanceSummary(): Promise<any> {
    const { performance } = this.metrics;
    return {
      currentMetrics: {
        responseTime: performance.responseTime[performance.responseTime.length - 1],
        errorRate: performance.errorRate[performance.errorRate.length - 1],
        cpuUsage: performance.cpuUsage[performance.cpuUsage.length - 1],
        memoryUsage: performance.memoryUsage[performance.memoryUsage.length - 1],
      },
      trends: {
        responseTime: this.calculateTrend(performance.responseTime),
        errorRate: this.calculateTrend(performance.errorRate),
        cpuUsage: this.calculateTrend(performance.cpuUsage),
        memoryUsage: this.calculateTrend(performance.memoryUsage),
      },
      overall: performance.trend,
    };
  }

  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    this.startUpdates();
  }
}

export default ValidationDashboard;

