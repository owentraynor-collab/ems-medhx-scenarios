import { EventEmitter } from 'events';
import { performance, PerformanceObserver } from 'perf_hooks';
import os from 'os';

interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    heapUsed: number;
  };
  network: {
    requests: number;
    errors: number;
    latency: number;
  };
  database: {
    connections: number;
    queryTime: number;
    errors: number;
  };
  application: {
    activeUsers: number;
    responseTime: number;
    errorRate: number;
    scenariosActive: number;
  };
}

interface Alert {
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metrics: Partial<SystemMetrics>;
  context?: any;
}

class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private metrics: SystemMetrics;
  private alerts: Alert[] = [];
  private thresholds = {
    cpu: 80, // 80% CPU usage
    memory: 85, // 85% memory usage
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5% error rate
  };

  private constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.setupMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMetrics(): SystemMetrics {
    return {
      cpu: {
        usage: 0,
        load: os.loadavg(),
      },
      memory: {
        total: os.totalmem(),
        used: os.totalmem() - os.freemem(),
        free: os.freemem(),
        heapUsed: process.memoryUsage().heapUsed,
      },
      network: {
        requests: 0,
        errors: 0,
        latency: 0,
      },
      database: {
        connections: 0,
        queryTime: 0,
        errors: 0,
      },
      application: {
        activeUsers: 0,
        responseTime: 0,
        errorRate: 0,
        scenariosActive: 0,
      },
    };
  }

  private setupMonitoring(): void {
    // CPU Monitoring
    setInterval(() => {
      this.updateCPUMetrics();
    }, 5000);

    // Memory Monitoring
    setInterval(() => {
      this.updateMemoryMetrics();
    }, 10000);

    // Performance Monitoring
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.updatePerformanceMetrics(entries);
    });
    observer.observe({ entryTypes: ['measure'] });

    // Alert Check
    setInterval(() => {
      this.checkThresholds();
    }, 30000);
  }

  private updateCPUMetrics(): void {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total);
    }, 0) / cpus.length * 100;

    this.metrics.cpu = {
      usage: totalCPU,
      load: os.loadavg(),
    };

    this.emit('metrics-update', 'cpu', this.metrics.cpu);
  }

  private updateMemoryMetrics(): void {
    const memoryMetrics = {
      total: os.totalmem(),
      used: os.totalmem() - os.freemem(),
      free: os.freemem(),
      heapUsed: process.memoryUsage().heapUsed,
    };

    this.metrics.memory = memoryMetrics;
    this.emit('metrics-update', 'memory', memoryMetrics);
  }

  private updatePerformanceMetrics(entries: any[]): void {
    entries.forEach(entry => {
      if (entry.name.startsWith('http-')) {
        this.metrics.network.latency = 
          (this.metrics.network.latency + entry.duration) / 2;
      } else if (entry.name.startsWith('db-')) {
        this.metrics.database.queryTime = 
          (this.metrics.database.queryTime + entry.duration) / 2;
      }
    });
  }

  private checkThresholds(): void {
    // CPU Check
    if (this.metrics.cpu.usage > this.thresholds.cpu) {
      this.createAlert('warning', 'High CPU usage detected', {
        cpu: this.metrics.cpu,
      });
    }

    // Memory Check
    const memoryUsage = (this.metrics.memory.used / this.metrics.memory.total) * 100;
    if (memoryUsage > this.thresholds.memory) {
      this.createAlert('warning', 'High memory usage detected', {
        memory: this.metrics.memory,
      });
    }

    // Response Time Check
    if (this.metrics.application.responseTime > this.thresholds.responseTime) {
      this.createAlert('warning', 'High response time detected', {
        application: {
          responseTime: this.metrics.application.responseTime,
        },
      });
    }

    // Error Rate Check
    if (this.metrics.application.errorRate > this.thresholds.errorRate) {
      this.createAlert('error', 'High error rate detected', {
        application: {
          errorRate: this.metrics.application.errorRate,
        },
      });
    }
  }

  private createAlert(
    type: Alert['type'],
    message: string,
    metrics: Partial<SystemMetrics>
  ): void {
    const alert: Alert = {
      type,
      message,
      timestamp: new Date(),
      metrics,
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  // Public Methods
  updateApplicationMetrics(metrics: Partial<SystemMetrics['application']>): void {
    this.metrics.application = {
      ...this.metrics.application,
      ...metrics,
    };
    this.emit('metrics-update', 'application', this.metrics.application);
  }

  updateNetworkMetrics(metrics: Partial<SystemMetrics['network']>): void {
    this.metrics.network = {
      ...this.metrics.network,
      ...metrics,
    };
    this.emit('metrics-update', 'network', this.metrics.network);
  }

  updateDatabaseMetrics(metrics: Partial<SystemMetrics['database']>): void {
    this.metrics.database = {
      ...this.metrics.database,
      ...metrics,
    };
    this.emit('metrics-update', 'database', this.metrics.database);
  }

  getMetrics(): SystemMetrics {
    return this.metrics;
  }

  getAlerts(limit: number = 10): Alert[] {
    return this.alerts.slice(-limit);
  }

  setThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds,
    };
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: SystemMetrics;
    alerts: Alert[];
  }> {
    const recentAlerts = this.getAlerts();
    const criticalAlerts = recentAlerts.filter(a => a.type === 'critical');
    const warningAlerts = recentAlerts.filter(a => a.type === 'warning');

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.metrics,
      alerts: recentAlerts,
    };
  }
}

export default MonitoringService.getInstance();

