import { ApiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform, NativeModules } from 'react-native';
import * as FileSystem from 'react-native-fs';
import { DatabaseService } from './DatabaseService';

export interface SystemHealth {
  timestamp: number;
  overall: {
    status: 'healthy' | 'degraded' | 'critical';
    score: number;
    issues: number;
  };
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'critical';
      metrics: Record<string, number>;
      lastCheck: number;
      issues: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high';
        message: string;
        timestamp: number;
      }>;
    };
  };
  resources: {
    memory: {
      total: number;
      used: number;
      free: number;
      threshold: number;
    };
    storage: {
      total: number;
      used: number;
      free: number;
      threshold: number;
    };
    cpu: {
      usage: number;
      temperature: number;
      threshold: number;
    };
    battery: {
      level: number;
      charging: boolean;
      temperature: number;
    };
  };
  network: {
    status: 'connected' | 'disconnected' | 'limited';
    type: string;
    strength: number;
    latency: number;
    bandwidth: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'critical';
    connections: number;
    queryLatency: number;
    syncStatus: 'synced' | 'pending' | 'error';
    lastSync: number;
  };
  cache: {
    size: number;
    items: number;
    hitRate: number;
    missRate: number;
  };
  security: {
    status: 'secure' | 'warning' | 'compromised';
    lastCheck: number;
    issues: string[];
  };
}

export interface PerformanceMetrics {
  timestamp: number;
  type: string;
  metrics: Record<string, number>;
  context?: Record<string, any>;
}

export interface HealthCheck {
  id: string;
  component: string;
  type: 'active' | 'passive';
  interval: number;
  timeout: number;
  thresholds: {
    healthy: number;
    degraded: number;
  };
  action: () => Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    metrics: Record<string, number>;
  }>;
}

export class HealthMonitoringService {
  private static instance: HealthMonitoringService;
  private api: ApiService;
  private db: DatabaseService;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: PerformanceMetrics[] = [];
  private currentHealth: SystemHealth | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.db = DatabaseService.getInstance();
    this.initializeService();
  }

  static getInstance(): HealthMonitoringService {
    if (!HealthMonitoringService.instance) {
      HealthMonitoringService.instance = new HealthMonitoringService();
    }
    return HealthMonitoringService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Register default health checks
      this.registerDefaultChecks();

      // Start monitoring
      this.startMonitoring();

      // Start metrics collection
      this.startMetricsCollection();
    } catch (error) {
      console.error('Failed to initialize health monitoring:', error);
    }
  }

  private registerDefaultChecks(): void {
    // Memory check
    this.registerHealthCheck({
      id: 'memory',
      component: 'system',
      type: 'active',
      interval: 60000, // 1 minute
      timeout: 5000,
      thresholds: {
        healthy: 70,
        degraded: 85,
      },
      action: async () => {
        const memory = await this.getMemoryMetrics();
        const usagePercent = (memory.used / memory.total) * 100;
        return {
          status:
            usagePercent < 70
              ? 'healthy'
              : usagePercent < 85
              ? 'degraded'
              : 'critical',
          metrics: memory,
        };
      },
    });

    // Storage check
    this.registerHealthCheck({
      id: 'storage',
      component: 'system',
      type: 'active',
      interval: 300000, // 5 minutes
      timeout: 10000,
      thresholds: {
        healthy: 80,
        degraded: 90,
      },
      action: async () => {
        const storage = await this.getStorageMetrics();
        const usagePercent = (storage.used / storage.total) * 100;
        return {
          status:
            usagePercent < 80
              ? 'healthy'
              : usagePercent < 90
              ? 'degraded'
              : 'critical',
          metrics: storage,
        };
      },
    });

    // Network check
    this.registerHealthCheck({
      id: 'network',
      component: 'system',
      type: 'active',
      interval: 30000, // 30 seconds
      timeout: 5000,
      thresholds: {
        healthy: 200, // ms latency
        degraded: 500,
      },
      action: async () => {
        const network = await this.getNetworkMetrics();
        return {
          status:
            network.latency < 200
              ? 'healthy'
              : network.latency < 500
              ? 'degraded'
              : 'critical',
          metrics: network,
        };
      },
    });

    // Database check
    this.registerHealthCheck({
      id: 'database',
      component: 'data',
      type: 'active',
      interval: 60000, // 1 minute
      timeout: 5000,
      thresholds: {
        healthy: 100, // ms query latency
        degraded: 250,
      },
      action: async () => {
        const dbMetrics = await this.getDatabaseMetrics();
        return {
          status:
            dbMetrics.queryLatency < 100
              ? 'healthy'
              : dbMetrics.queryLatency < 250
              ? 'degraded'
              : 'critical',
          metrics: dbMetrics,
        };
      },
    });
  }

  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.runHealthChecks();
    }, 60000); // Run all checks every minute

    // Run initial check
    this.runHealthChecks();
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  private async runHealthChecks(): Promise<void> {
    const health: SystemHealth = {
      timestamp: Date.now(),
      overall: {
        status: 'healthy',
        score: 100,
        issues: 0,
      },
      components: {},
      resources: await this.getResourceMetrics(),
      network: await this.getNetworkMetrics(),
      database: await this.getDatabaseMetrics(),
      cache: await this.getCacheMetrics(),
      security: await this.getSecurityMetrics(),
    };

    let totalIssues = 0;
    let totalScore = 0;
    let checksRun = 0;

    for (const check of this.healthChecks.values()) {
      try {
        const result = await Promise.race([
          check.action(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), check.timeout)
          ),
        ]);

        health.components[check.component] = {
          status: result.status,
          metrics: result.metrics,
          lastCheck: Date.now(),
          issues: [],
        };

        if (result.status === 'critical') {
          totalIssues += 2;
          totalScore += 0;
        } else if (result.status === 'degraded') {
          totalIssues += 1;
          totalScore += 50;
        } else {
          totalScore += 100;
        }

        checksRun++;
      } catch (error) {
        console.error(`Health check failed for ${check.component}:`, error);
        totalIssues++;
      }
    }

    health.overall.score = Math.round(totalScore / checksRun);
    health.overall.issues = totalIssues;
    health.overall.status =
      totalIssues === 0
        ? 'healthy'
        : totalIssues < 3
        ? 'degraded'
        : 'critical';

    this.currentHealth = health;

    // Save health status
    await this.saveHealthStatus(health);

    // Report if critical
    if (health.overall.status === 'critical') {
      await this.reportCriticalHealth(health);
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        type: 'system',
        metrics: {
          memory: (await this.getMemoryMetrics()).used,
          storage: (await this.getStorageMetrics()).used,
          cpu: (await this.getCpuMetrics()).usage,
          battery: (await this.getBatteryMetrics()).level,
        },
      };

      this.metrics.push(metrics);

      // Keep only last hour of metrics
      const hourAgo = Date.now() - 60 * 60 * 1000;
      this.metrics = this.metrics.filter(m => m.timestamp > hourAgo);

      // Save metrics
      await this.saveMetrics(metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async getResourceMetrics() {
    return {
      memory: await this.getMemoryMetrics(),
      storage: await this.getStorageMetrics(),
      cpu: await this.getCpuMetrics(),
      battery: await this.getBatteryMetrics(),
    };
  }

  private async getMemoryMetrics() {
    // Implementation would use platform-specific APIs
    return {
      total: 0,
      used: 0,
      free: 0,
      threshold: 85,
    };
  }

  private async getStorageMetrics() {
    try {
      const info = await FileSystem.getFSInfo();
      return {
        total: info.totalSpace,
        used: info.totalSpace - info.freeSpace,
        free: info.freeSpace,
        threshold: 90,
      };
    } catch {
      return {
        total: 0,
        used: 0,
        free: 0,
        threshold: 90,
      };
    }
  }

  private async getCpuMetrics() {
    // Implementation would use platform-specific APIs
    return {
      usage: 0,
      temperature: 0,
      threshold: 80,
    };
  }

  private async getBatteryMetrics() {
    // Implementation would use platform-specific APIs
    return {
      level: 100,
      charging: true,
      temperature: 0,
    };
  }

  private async getNetworkMetrics() {
    try {
      const netInfo = await NetInfo.fetch();
      const latency = await this.measureLatency();

      return {
        status: netInfo.isConnected ? 'connected' : 'disconnected',
        type: netInfo.type,
        strength: netInfo.details?.strength || 0,
        latency,
        bandwidth: 0, // Would require additional measurement
      };
    } catch {
      return {
        status: 'disconnected',
        type: 'none',
        strength: 0,
        latency: 0,
        bandwidth: 0,
      };
    }
  }

  private async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      await this.api.get('/health');
      return Date.now() - start;
    } catch {
      return 999;
    }
  }

  private async getDatabaseMetrics() {
    try {
      const metrics = await this.db.getMetrics();
      return {
        status: metrics.queryLatency < 100 ? 'healthy' : 'degraded',
        connections: metrics.connections,
        queryLatency: metrics.queryLatency,
        syncStatus: metrics.syncStatus,
        lastSync: metrics.lastSync,
      };
    } catch {
      return {
        status: 'critical',
        connections: 0,
        queryLatency: 999,
        syncStatus: 'error',
        lastSync: 0,
      };
    }
  }

  private async getCacheMetrics() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return {
        size: 0, // Would require additional calculation
        items: keys.length,
        hitRate: 0,
        missRate: 0,
      };
    } catch {
      return {
        size: 0,
        items: 0,
        hitRate: 0,
        missRate: 0,
      };
    }
  }

  private async getSecurityMetrics() {
    // Implementation would check various security aspects
    return {
      status: 'secure',
      lastCheck: Date.now(),
      issues: [],
    };
  }

  private async saveHealthStatus(health: SystemHealth): Promise<void> {
    try {
      // Save to API
      await this.api.post('/monitoring/health', health);
    } catch {
      // Save locally if API fails
      await AsyncStorage.setItem('last_health_status', JSON.stringify(health));
    }
  }

  private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Save to API
      await this.api.post('/monitoring/metrics', metrics);
    } catch {
      // Save locally if API fails
      const saved = await AsyncStorage.getItem('performance_metrics');
      const savedMetrics = saved ? JSON.parse(saved) : [];
      savedMetrics.push(metrics);
      await AsyncStorage.setItem(
        'performance_metrics',
        JSON.stringify(savedMetrics)
      );
    }
  }

  private async reportCriticalHealth(health: SystemHealth): Promise<void> {
    try {
      await this.api.post('/monitoring/critical', health);
    } catch (error) {
      console.error('Failed to report critical health:', error);
    }
  }

  registerHealthCheck(check: HealthCheck): void {
    this.healthChecks.set(check.id, check);
  }

  async getHealth(): Promise<SystemHealth | null> {
    return this.currentHealth;
  }

  async getMetrics(
    timeRange?: { start: number; end: number }
  ): Promise<PerformanceMetrics[]> {
    if (!timeRange) {
      return this.metrics;
    }

    return this.metrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  async cleanup(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }
}

export default HealthMonitoringService;

