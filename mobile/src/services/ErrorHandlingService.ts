import { ApiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import * as FileSystem from 'react-native-fs';

export interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'error' | 'warning' | 'critical';
  component: string;
  message: string;
  stack?: string;
  metadata: {
    userId?: string;
    deviceInfo: {
      platform: string;
      version: string;
      model: string;
      freeMemory: number;
      totalMemory: number;
      diskSpace: number;
    };
    networkStatus: {
      isConnected: boolean;
      type: string;
      strength?: number;
    };
    appState: {
      currentScreen: string;
      activeModules: string[];
      lastAction: string;
      sessionDuration: number;
    };
    context?: Record<string, any>;
  };
  status: 'new' | 'investigating' | 'resolved' | 'ignored';
  resolution?: {
    timestamp: number;
    action: string;
    success: boolean;
    notes?: string;
  };
}

export interface ErrorPattern {
  id: string;
  pattern: {
    type?: string;
    component?: string;
    messagePattern: RegExp;
    metadata?: Record<string, any>;
  };
  priority: 'high' | 'medium' | 'low';
  autoResolve?: {
    action: string;
    params?: Record<string, any>;
    maxAttempts: number;
  };
  notification?: {
    users: string[];
    channels: string[];
    template: string;
  };
}

export interface RecoveryAction {
  id: string;
  type: string;
  params?: Record<string, any>;
  timestamp: number;
  success: boolean;
  error?: string;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private api: ApiService;
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errorQueue: ErrorReport[] = [];
  private recoveryQueue: RecoveryAction[] = [];
  private isProcessing: boolean = false;
  private maxQueueSize: number = 100;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.initializeService();
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      // Load error patterns
      const patterns = await this.api.get('/error-handling/patterns');
      patterns.forEach((pattern: ErrorPattern) => {
        this.errorPatterns.set(pattern.id, pattern);
      });

      // Load cached errors
      const cachedErrors = await AsyncStorage.getItem('error_queue');
      if (cachedErrors) {
        this.errorQueue = JSON.parse(cachedErrors);
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Start queue processing
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize error handling service:', error);
    }
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.syncErrors();
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  async handleError(
    error: Error,
    component: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      const errorReport = await this.createErrorReport(error, component, context);
      await this.queueError(errorReport);

      // Check for critical errors that need immediate attention
      if (this.isCriticalError(error, component)) {
        await this.handleCriticalError(errorReport);
      }

      // Try to match error pattern and auto-resolve
      const pattern = this.matchErrorPattern(errorReport);
      if (pattern?.autoResolve) {
        await this.attemptAutoResolve(errorReport, pattern.autoResolve);
      }
    } catch (handlingError) {
      console.error('Failed to handle error:', handlingError);
      // Save to local storage as last resort
      await this.saveErrorLocally(error, component, context);
    }
  }

  private async createErrorReport(
    error: Error,
    component: string,
    context?: Record<string, any>
  ): Promise<ErrorReport> {
    const networkState = await NetInfo.fetch();
    const deviceInfo = await this.getDeviceInfo();
    const appState = await this.getAppState();

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: Date.now(),
      type: this.determineErrorType(error, component),
      component,
      message: error.message,
      stack: error.stack,
      metadata: {
        deviceInfo,
        networkStatus: {
          isConnected: networkState.isConnected || false,
          type: networkState.type,
          strength: networkState.details?.strength,
        },
        appState,
        context,
      },
      status: 'new',
    };
  }

  private async getDeviceInfo() {
    const memoryInfo = await this.getMemoryInfo();
    const diskInfo = await this.getDiskInfo();

    return {
      platform: Platform.OS,
      version: Platform.Version,
      model: Platform.select({
        ios: 'iOS Device',
        android: 'Android Device',
      }),
      freeMemory: memoryInfo.free,
      totalMemory: memoryInfo.total,
      diskSpace: diskInfo.free,
    };
  }

  private async getMemoryInfo() {
    // Implementation would use platform-specific APIs
    return {
      free: 0,
      total: 0,
    };
  }

  private async getDiskInfo() {
    try {
      const diskInfo = await FileSystem.getFSInfo();
      return {
        free: diskInfo.freeSpace,
      };
    } catch {
      return { free: 0 };
    }
  }

  private async getAppState() {
    // This would be integrated with navigation and state management
    return {
      currentScreen: 'unknown',
      activeModules: [],
      lastAction: '',
      sessionDuration: 0,
    };
  }

  private determineErrorType(
    error: Error,
    component: string
  ): ErrorReport['type'] {
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'warning';
    }
    if (
      error.message.includes('crash') ||
      error.message.includes('fatal') ||
      component.includes('core')
    ) {
      return 'critical';
    }
    return 'error';
  }

  private async queueError(error: ErrorReport): Promise<void> {
    // Add to queue
    this.errorQueue.push(error);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Save to local storage
    await AsyncStorage.setItem('error_queue', JSON.stringify(this.errorQueue));

    // Trigger queue processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        this.isProcessing = false;
        return;
      }

      while (this.errorQueue.length > 0) {
        const error = this.errorQueue[0];
        
        try {
          await this.api.post('/error-reporting', error);
          this.errorQueue.shift();
          await AsyncStorage.setItem(
            'error_queue',
            JSON.stringify(this.errorQueue)
          );
        } catch (syncError) {
          console.error('Failed to sync error:', syncError);
          break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) return;

      await this.api.post('/error-reporting/batch', {
        errors: this.errorQueue,
      });

      this.errorQueue = [];
      await AsyncStorage.setItem('error_queue', JSON.stringify(this.errorQueue));
    } catch (error) {
      console.error('Failed to sync errors:', error);
    }
  }

  private isCriticalError(error: Error, component: string): boolean {
    return (
      error.message.includes('crash') ||
      error.message.includes('fatal') ||
      component.includes('core')
    );
  }

  private async handleCriticalError(error: ErrorReport): Promise<void> {
    try {
      // Save current state
      await this.saveApplicationState();

      // Notify administrators
      await this.notifyAdministrators(error);

      // Attempt recovery
      await this.attemptRecovery(error);
    } catch (handlingError) {
      console.error('Failed to handle critical error:', handlingError);
    }
  }

  private async saveApplicationState(): Promise<void> {
    // Implementation would save current app state for recovery
  }

  private async notifyAdministrators(error: ErrorReport): Promise<void> {
    try {
      await this.api.post('/notifications/admin', {
        type: 'critical_error',
        error,
      });
    } catch (notifyError) {
      console.error('Failed to notify administrators:', notifyError);
    }
  }

  private matchErrorPattern(error: ErrorReport): ErrorPattern | null {
    for (const pattern of this.errorPatterns.values()) {
      if (
        (!pattern.pattern.type || pattern.pattern.type === error.type) &&
        (!pattern.pattern.component ||
          pattern.pattern.component === error.component) &&
        pattern.pattern.messagePattern.test(error.message)
      ) {
        return pattern;
      }
    }
    return null;
  }

  private async attemptAutoResolve(
    error: ErrorReport,
    autoResolve: NonNullable<ErrorPattern['autoResolve']>
  ): Promise<void> {
    const recoveryAction: RecoveryAction = {
      id: `${error.id}-recovery`,
      type: autoResolve.action,
      params: autoResolve.params,
      timestamp: Date.now(),
      success: false,
    };

    try {
      // Execute recovery action
      await this.executeRecoveryAction(recoveryAction);
      recoveryAction.success = true;

      // Update error status
      error.status = 'resolved';
      error.resolution = {
        timestamp: Date.now(),
        action: autoResolve.action,
        success: true,
      };
    } catch (recoveryError) {
      recoveryAction.success = false;
      recoveryAction.error = recoveryError.message;

      error.resolution = {
        timestamp: Date.now(),
        action: autoResolve.action,
        success: false,
        notes: recoveryError.message,
      };
    }

    // Log recovery attempt
    this.recoveryQueue.push(recoveryAction);
  }

  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    switch (action.type) {
      case 'clear_cache':
        await AsyncStorage.clear();
        break;
      case 'reload_data':
        // Implementation would reload necessary data
        break;
      case 'restart_service':
        // Implementation would restart specific service
        break;
      default:
        throw new Error(`Unknown recovery action: ${action.type}`);
    }
  }

  private async attemptRecovery(error: ErrorReport): Promise<void> {
    // Implementation would attempt to recover from critical errors
  }

  private async saveErrorLocally(
    error: Error,
    component: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      const errorLog = {
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack,
        component,
        context,
      };

      const existingLogs = await AsyncStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      await AsyncStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (saveError) {
      console.error('Failed to save error locally:', saveError);
    }
  }

  async getErrorHistory(
    filters?: {
      type?: string[];
      component?: string[];
      status?: string[];
      timeRange?: { start: number; end: number };
    }
  ): Promise<ErrorReport[]> {
    try {
      return await this.api.get('/error-reporting/history', filters);
    } catch (error) {
      console.error('Failed to get error history:', error);
      return [];
    }
  }

  async getRecoveryHistory(): Promise<RecoveryAction[]> {
    return this.recoveryQueue;
  }

  async cleanup(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    await this.syncErrors();
  }
}

export default ErrorHandlingService;

