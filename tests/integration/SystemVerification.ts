import { MonitoringService } from '../../server/src/monitoring/MonitoringService';
import { AutoRemediator } from '../../ops/AutoRemediator';
import { ValidationDashboard } from '../../ops/dashboards/ValidationDashboard';
import { OperationsValidator } from '../ops/OperationsValidator';
import AWS from 'aws-sdk';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface VerificationConfig {
  environment: string;
  services: {
    api: string;
    monitoring: string;
    database: string;
    cache: string;
  };
  thresholds: {
    responseTime: number;
    errorRate: number;
    remediationTime: number;
    alertDelay: number;
  };
}

interface TestScenario {
  name: string;
  setup: () => Promise<void>;
  execute: () => Promise<void>;
  verify: () => Promise<boolean>;
  cleanup: () => Promise<void>;
  expectedAlerts?: string[];
  expectedRemediation?: string[];
}

class SystemVerification {
  private config: VerificationConfig;
  private monitoring: typeof MonitoringService;
  private remediator: typeof AutoRemediator;
  private dashboard: typeof ValidationDashboard;
  private validator: OperationsValidator;
  private testResults: Map<string, boolean>;
  private alerts: string[];
  private remediationActions: string[];

  constructor(config: VerificationConfig) {
    this.config = config;
    this.monitoring = MonitoringService.getInstance();
    this.remediator = AutoRemediator.getInstance();
    this.dashboard = ValidationDashboard.getInstance();
    this.validator = new OperationsValidator(config);
    this.testResults = new Map();
    this.alerts = [];
    this.remediationActions = [];

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.monitoring.on('alert', (alert) => {
      this.alerts.push(alert.type);
    });

    this.remediator.on('action', (action) => {
      this.remediationActions.push(action.id);
    });
  }

  async verifyAll(): Promise<boolean> {
    console.log('Starting system verification...');

    try {
      // Core Systems Verification
      await this.verifyCoreServices();
      
      // Integration Tests
      await this.runIntegrationTests();
      
      // Scenario Tests
      await this.runScenarioTests();
      
      // Performance Verification
      await this.verifyPerformance();

      return this.evaluateResults();
    } catch (error) {
      console.error('System verification failed:', error);
      return false;
    }
  }

  private async verifyCoreServices(): Promise<void> {
    console.log('Verifying core services...');

    // API Health
    const apiHealth = await this.verifyAPI();
    this.testResults.set('api_health', apiHealth);

    // Database Connectivity
    const dbHealth = await this.verifyDatabase();
    this.testResults.set('database_health', dbHealth);

    // Cache Operation
    const cacheHealth = await this.verifyCache();
    this.testResults.set('cache_health', cacheHealth);

    // Monitoring System
    const monitoringHealth = await this.verifyMonitoring();
    this.testResults.set('monitoring_health', monitoringHealth);
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('Running integration tests...');

    const scenarios: TestScenario[] = [
      {
        name: 'high_cpu_remediation',
        async setup() {
          await execAsync('stress --cpu 8 --timeout 30');
        },
        async execute() {
          await this.remediator.handleIssue('high_cpu');
        },
        async verify() {
          const metrics = await this.monitoring.getMetrics();
          return metrics.cpu.usage < 80;
        },
        async cleanup() {
          await execAsync('pkill stress');
        },
        expectedAlerts: ['high_cpu_usage'],
        expectedRemediation: ['scale_up_service'],
      },
      {
        name: 'memory_leak_detection',
        async setup() {
          // Simulate memory leak
          await execAsync('node tests/fixtures/memory-leak.js');
        },
        async execute() {
          await this.remediator.handleIssue('memory_leak');
        },
        async verify() {
          const metrics = await this.monitoring.getMetrics();
          return metrics.memory.heapUsed < metrics.memory.heapTotal * 0.8;
        },
        async cleanup() {
          await execAsync('pm2 delete memory-leak');
        },
        expectedAlerts: ['high_memory_usage'],
        expectedRemediation: ['restart_service'],
      },
      {
        name: 'database_connection_recovery',
        async setup() {
          await execAsync('tc qdisc add dev lo root netem loss 100%');
        },
        async execute() {
          await this.remediator.handleIssue('db_connection');
        },
        async verify() {
          const metrics = await this.monitoring.getMetrics();
          return metrics.database.connections > 0;
        },
        async cleanup() {
          await execAsync('tc qdisc del dev lo root');
        },
        expectedAlerts: ['database_connection_lost'],
        expectedRemediation: ['reconnect_database'],
      },
    ];

    for (const scenario of scenarios) {
      try {
        await this.runScenario(scenario);
      } catch (error) {
        console.error(`Scenario ${scenario.name} failed:`, error);
        this.testResults.set(`integration_${scenario.name}`, false);
      }
    }
  }

  private async runScenarioTests(): Promise<void> {
    console.log('Running scenario tests...');

    // Test Auto-Remediation
    await this.testAutoRemediation();

    // Test Alert System
    await this.testAlertSystem();

    // Test Dashboard Updates
    await this.testDashboardUpdates();

    // Test Continuous Validation
    await this.testContinuousValidation();
  }

  private async verifyPerformance(): Promise<void> {
    console.log('Verifying performance...');

    // Response Time Check
    const responseTime = await this.checkResponseTime();
    this.testResults.set('performance_response_time', 
      responseTime < this.config.thresholds.responseTime);

    // Error Rate Check
    const errorRate = await this.checkErrorRate();
    this.testResults.set('performance_error_rate',
      errorRate < this.config.thresholds.errorRate);

    // Remediation Time Check
    const remediationTime = await this.checkRemediationTime();
    this.testResults.set('performance_remediation_time',
      remediationTime < this.config.thresholds.remediationTime);

    // Alert Delay Check
    const alertDelay = await this.checkAlertDelay();
    this.testResults.set('performance_alert_delay',
      alertDelay < this.config.thresholds.alertDelay);
  }

  private async runScenario(scenario: TestScenario): Promise<void> {
    console.log(`Running scenario: ${scenario.name}`);

    try {
      // Setup
      await scenario.setup();

      // Clear tracking arrays
      this.alerts = [];
      this.remediationActions = [];

      // Execute
      await scenario.execute();

      // Wait for alerts and remediation
      await this.waitForEvents(scenario);

      // Verify
      const success = await scenario.verify();
      this.testResults.set(`scenario_${scenario.name}`, success);

      // Verify alerts and remediation actions
      this.verifyEvents(scenario);
    } finally {
      // Cleanup
      await scenario.cleanup();
    }
  }

  private async waitForEvents(scenario: TestScenario): Promise<void> {
    const timeout = 30000; // 30 seconds
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (this.hasExpectedEvents(scenario)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Timeout waiting for events in scenario ${scenario.name}`);
  }

  private hasExpectedEvents(scenario: TestScenario): boolean {
    if (scenario.expectedAlerts) {
      const hasAllAlerts = scenario.expectedAlerts.every(
        alert => this.alerts.includes(alert)
      );
      if (!hasAllAlerts) return false;
    }

    if (scenario.expectedRemediation) {
      const hasAllRemediation = scenario.expectedRemediation.every(
        action => this.remediationActions.includes(action)
      );
      if (!hasAllRemediation) return false;
    }

    return true;
  }

  private verifyEvents(scenario: TestScenario): void {
    if (scenario.expectedAlerts) {
      const missingAlerts = scenario.expectedAlerts.filter(
        alert => !this.alerts.includes(alert)
      );
      if (missingAlerts.length > 0) {
        console.warn(`Missing alerts in ${scenario.name}:`, missingAlerts);
      }
    }

    if (scenario.expectedRemediation) {
      const missingRemediation = scenario.expectedRemediation.filter(
        action => !this.remediationActions.includes(action)
      );
      if (missingRemediation.length > 0) {
        console.warn(`Missing remediation in ${scenario.name}:`, missingRemediation);
      }
    }
  }

  private async verifyAPI(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.services.api}/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async verifyDatabase(): Promise<boolean> {
    try {
      const metrics = await this.monitoring.getMetrics();
      return metrics.database.connections > 0;
    } catch {
      return false;
    }
  }

  private async verifyCache(): Promise<boolean> {
    try {
      const metrics = await this.monitoring.getMetrics();
      return metrics.cache.connected;
    } catch {
      return false;
    }
  }

  private async verifyMonitoring(): Promise<boolean> {
    try {
      const cloudwatch = new AWS.CloudWatch();
      const metrics = await cloudwatch.listMetrics({
        Namespace: 'EMS-MedHx',
      }).promise();
      return metrics.Metrics.length > 0;
    } catch {
      return false;
    }
  }

  private async testAutoRemediation(): Promise<void> {
    const scenarios = [
      'high_cpu',
      'memory_leak',
      'db_connection',
      'cache_performance',
      'sync_queue',
    ];

    for (const scenario of scenarios) {
      try {
        const result = await this.remediator.handleIssue(scenario);
        this.testResults.set(`remediation_${scenario}`, result.success);
      } catch (error) {
        console.error(`Auto-remediation test failed for ${scenario}:`, error);
        this.testResults.set(`remediation_${scenario}`, false);
      }
    }
  }

  private async testAlertSystem(): Promise<void> {
    const testAlert = {
      type: 'test_alert',
      severity: 'high',
      message: 'Test alert',
    };

    try {
      await this.monitoring.sendAlert(testAlert);
      const alerts = await this.monitoring.getRecentAlerts();
      this.testResults.set('alert_system',
        alerts.some(alert => alert.type === 'test_alert'));
    } catch (error) {
      console.error('Alert system test failed:', error);
      this.testResults.set('alert_system', false);
    }
  }

  private async testDashboardUpdates(): Promise<void> {
    try {
      const before = await this.dashboard.getMetrics();
      await this.monitoring.updateMetrics();
      const after = await this.dashboard.getMetrics();
      
      this.testResults.set('dashboard_updates',
        JSON.stringify(before) !== JSON.stringify(after));
    } catch (error) {
      console.error('Dashboard update test failed:', error);
      this.testResults.set('dashboard_updates', false);
    }
  }

  private async testContinuousValidation(): Promise<void> {
    try {
      const results = await this.validator.validateAll();
      this.testResults.set('continuous_validation',
        results.every(result => result.success));
    } catch (error) {
      console.error('Continuous validation test failed:', error);
      this.testResults.set('continuous_validation', false);
    }
  }

  private async checkResponseTime(): Promise<number> {
    const start = Date.now();
    await axios.get(`${this.config.services.api}/health`);
    return Date.now() - start;
  }

  private async checkErrorRate(): Promise<number> {
    const metrics = await this.monitoring.getMetrics();
    return metrics.api.errorRate;
  }

  private async checkRemediationTime(): Promise<number> {
    const start = Date.now();
    await this.remediator.handleIssue('test_issue');
    return Date.now() - start;
  }

  private async checkAlertDelay(): Promise<number> {
    const start = Date.now();
    await this.monitoring.sendAlert({
      type: 'test_alert',
      severity: 'high',
      message: 'Test alert',
    });
    const alerts = await this.monitoring.getRecentAlerts();
    const alert = alerts.find(a => a.type === 'test_alert');
    return alert ? alert.timestamp - start : Infinity;
  }

  private evaluateResults(): boolean {
    let totalTests = 0;
    let passedTests = 0;

    for (const [test, result] of this.testResults.entries()) {
      totalTests++;
      if (result) passedTests++;
      console.log(`${test}: ${result ? 'PASS' : 'FAIL'}`);
    }

    const successRate = (passedTests / totalTests) * 100;
    console.log(`Overall success rate: ${successRate.toFixed(2)}%`);

    return successRate >= 90; // Require 90% success rate
  }

  async generateReport(): Promise<string> {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
      results: Object.fromEntries(this.testResults),
      metrics: await this.monitoring.getMetrics(),
      alerts: this.alerts,
      remediationActions: this.remediationActions,
    };

    return JSON.stringify(report, null, 2);
  }
}

export default SystemVerification;

