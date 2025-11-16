import AWS from 'aws-sdk';
import { MonitoringService } from '../server/src/monitoring/MonitoringService';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RemediationAction {
  id: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: () => Promise<void>;
  verification: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

interface RemediationResult {
  actionId: string;
  success: boolean;
  timestamp: Date;
  details: string;
  metrics?: any;
  rollbackNeeded?: boolean;
}

class AutoRemediator {
  private static instance: AutoRemediator;
  private monitoring: typeof MonitoringService;
  private actions: Map<string, RemediationAction>;
  private history: RemediationResult[];
  private isRemediating: boolean;

  private constructor() {
    this.monitoring = MonitoringService.getInstance();
    this.actions = new Map();
    this.history = [];
    this.isRemediating = false;
    this.initializeActions();
  }

  static getInstance(): AutoRemediator {
    if (!AutoRemediator.instance) {
      AutoRemediator.instance = new AutoRemediator();
    }
    return AutoRemediator.instance;
  }

  private initializeActions(): void {
    // High CPU Usage Remediation
    this.actions.set('high_cpu', {
      id: 'high_cpu',
      issue: 'High CPU Usage',
      severity: 'high',
      action: async () => {
        const ecs = new AWS.ECS();
        await ecs.updateService({
          cluster: 'ems-medhx',
          service: 'api',
          desiredCount: 4, // Scale up
        }).promise();
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.cpu.usage < 70;
      },
      rollback: async () => {
        const ecs = new AWS.ECS();
        await ecs.updateService({
          cluster: 'ems-medhx',
          service: 'api',
          desiredCount: 2, // Scale back down
        }).promise();
      },
    });

    // Database Connection Issues
    this.actions.set('db_connection', {
      id: 'db_connection',
      issue: 'Database Connection Issues',
      severity: 'critical',
      action: async () => {
        // Restart connection pool
        await execAsync('pm2 restart api --only db-pool');
        
        // Clear connection cache
        await execAsync('redis-cli DEL db_connections');
      },
      verification: async () => {
        try {
          const metrics = await this.monitoring.getMetrics();
          return metrics.database.connections > 0;
        } catch {
          return false;
        }
      },
    });

    // Memory Leak
    this.actions.set('memory_leak', {
      id: 'memory_leak',
      issue: 'Memory Leak Detected',
      severity: 'high',
      action: async () => {
        // Graceful service restart
        await execAsync('pm2 reload api');
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.memory.heapUsed < metrics.memory.heapTotal * 0.8;
      },
    });

    // Cache Performance
    this.actions.set('cache_performance', {
      id: 'cache_performance',
      issue: 'Poor Cache Performance',
      severity: 'medium',
      action: async () => {
        // Clear expired keys
        await execAsync('redis-cli --scan --pattern "*" | xargs redis-cli expire 3600');
        
        // Optimize memory
        await execAsync('redis-cli MEMORY PURGE');
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.cache.hitRate > 0.7;
      },
    });

    // Sync Queue Backup
    this.actions.set('sync_queue', {
      id: 'sync_queue',
      issue: 'Sync Queue Backup',
      severity: 'high',
      action: async () => {
        // Scale up sync workers
        await execAsync('pm2 scale sync-worker +2');
        
        // Clear stuck items
        await execAsync('redis-cli DEL sync_queue_processing');
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.sync.queueLength < 100;
      },
      rollback: async () => {
        await execAsync('pm2 scale sync-worker -2');
      },
    });

    // API Latency
    this.actions.set('api_latency', {
      id: 'api_latency',
      issue: 'High API Latency',
      severity: 'high',
      action: async () => {
        // Enable response caching
        await execAsync('redis-cli SET api_cache_enabled 1');
        
        // Scale up API servers
        const ecs = new AWS.ECS();
        await ecs.updateService({
          cluster: 'ems-medhx',
          service: 'api',
          desiredCount: 4,
        }).promise();
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.api.latency < 200;
      },
    });

    // Security Issues
    this.actions.set('security_breach', {
      id: 'security_breach',
      issue: 'Security Breach Detected',
      severity: 'critical',
      action: async () => {
        // Block suspicious IPs
        await execAsync('aws waf update-ip-set --ip-set-id suspicious --ip-set-descriptors file://suspicious-ips.json');
        
        // Rotate access keys
        const iam = new AWS.IAM();
        await iam.createAccessKey().promise();
      },
      verification: async () => {
        const metrics = await this.monitoring.getMetrics();
        return metrics.security.breachCount === 0;
      },
    });
  }

  async handleIssue(issueId: string): Promise<RemediationResult> {
    if (this.isRemediating) {
      throw new Error('Remediation already in progress');
    }

    const action = this.actions.get(issueId);
    if (!action) {
      throw new Error(`No remediation action found for issue: ${issueId}`);
    }

    this.isRemediating = true;
    const result: RemediationResult = {
      actionId: action.id,
      success: false,
      timestamp: new Date(),
      details: '',
    };

    try {
      // Execute remediation
      await action.action();

      // Verify success
      const verified = await action.verification();
      if (!verified) {
        // Attempt rollback if available
        if (action.rollback) {
          await action.rollback();
          result.rollbackNeeded = true;
          result.details = 'Remediation failed, rollback completed';
        } else {
          result.details = 'Remediation failed, no rollback available';
        }
      } else {
        result.success = true;
        result.details = 'Remediation successful';
      }

      // Collect metrics
      result.metrics = await this.monitoring.getMetrics();
    } catch (error) {
      result.details = `Remediation error: ${error.message}`;
      if (action.rollback) {
        try {
          await action.rollback();
          result.rollbackNeeded = true;
          result.details += ', rollback completed';
        } catch (rollbackError) {
          result.details += `, rollback failed: ${rollbackError.message}`;
        }
      }
    } finally {
      this.isRemediating = false;
      this.history.push(result);
    }

    return result;
  }

  async getRemediationHistory(): Promise<RemediationResult[]> {
    return this.history;
  }

  async getAvailableActions(): Promise<string[]> {
    return Array.from(this.actions.keys());
  }

  async checkSystemHealth(): Promise<{
    issues: string[];
    recommendations: string[];
  }> {
    const metrics = await this.monitoring.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // CPU Check
    if (metrics.cpu.usage > 80) {
      issues.push('high_cpu');
      recommendations.push('Consider scaling up the service');
    }

    // Memory Check
    if (metrics.memory.heapUsed > metrics.memory.heapTotal * 0.9) {
      issues.push('memory_leak');
      recommendations.push('Investigate potential memory leaks');
    }

    // Database Check
    if (metrics.database.errors > 0) {
      issues.push('db_connection');
      recommendations.push('Check database connectivity');
    }

    // Cache Check
    if (metrics.cache.hitRate < 0.6) {
      issues.push('cache_performance');
      recommendations.push('Optimize cache usage');
    }

    // Sync Queue Check
    if (metrics.sync.queueLength > 1000) {
      issues.push('sync_queue');
      recommendations.push('Scale up sync workers');
    }

    // API Latency Check
    if (metrics.api.latency > 500) {
      issues.push('api_latency');
      recommendations.push('Investigate API performance');
    }

    return { issues, recommendations };
  }

  async autoRemediate(): Promise<void> {
    const { issues } = await this.checkSystemHealth();
    
    for (const issue of issues) {
      try {
        await this.handleIssue(issue);
      } catch (error) {
        console.error(`Auto-remediation failed for issue ${issue}:`, error);
      }
    }
  }
}

export default AutoRemediator;

