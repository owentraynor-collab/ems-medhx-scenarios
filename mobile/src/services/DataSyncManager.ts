import NetInfo from '@react-native-community/netinfo';
import { LocalStorageService } from './LocalStorageService';
import ApiService from './ApiService';

interface SyncConfig {
  syncInterval: number;
  maxRetries: number;
  batchSize: number;
  priorityQueue: boolean;
}

interface SyncItem {
  id: string;
  type: string;
  data: any;
  priority: number;
  timestamp: number;
  retries: number;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
}

class DataSyncManager {
  private static instance: DataSyncManager;
  private syncQueue: SyncItem[] = [];
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private config: SyncConfig = {
    syncInterval: 5 * 60 * 1000, // 5 minutes
    maxRetries: 3,
    batchSize: 10,
    priorityQueue: true,
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Load saved sync queue
      const savedQueue = await LocalStorageService.getSyncQueue();
      if (savedQueue) {
        this.syncQueue = savedQueue;
      }

      // Start sync process
      this.startSync();

      // Listen for network changes
      NetInfo.addEventListener(state => {
        if (state.isConnected) {
          this.processSyncQueue();
        }
      });
    } catch (error) {
      console.error('Error initializing DataSyncManager:', error);
    }
  }

  async addToSyncQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retries' | 'status'>): Promise<void> {
    const syncItem: SyncItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      retries: 0,
      status: 'pending',
      ...item,
    };

    this.syncQueue.push(syncItem);
    
    if (this.config.priorityQueue) {
      this.syncQueue.sort((a, b) => b.priority - a.priority);
    }

    await this.saveSyncQueue();

    if (!this.isSyncing) {
      this.processSyncQueue();
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await LocalStorageService.saveSyncQueue(this.syncQueue);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, this.config.syncInterval);
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) return;

    this.isSyncing = true;

    try {
      // Process items in batches
      const batch = this.syncQueue
        .filter(item => item.status === 'pending')
        .slice(0, this.config.batchSize);

      for (const item of batch) {
        try {
          item.status = 'in_progress';
          await this.saveSyncQueue();

          await this.syncItem(item);

          // Remove successfully synced item
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          await this.saveSyncQueue();
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          item.status = 'failed';
          item.retries++;

          if (item.retries >= this.config.maxRetries) {
            // Move to failed items storage for later review
            await this.handleFailedSync(item);
            this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
          }

          await this.saveSyncQueue();
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: SyncItem): Promise<void> {
    switch (item.type) {
      case 'performance':
        await this.syncPerformanceData(item.data);
        break;
      case 'scenario':
        await this.syncScenarioData(item.data);
        break;
      case 'analytics':
        await this.syncAnalyticsData(item.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  private async syncPerformanceData(data: any): Promise<void> {
    await ApiService.submitPerformance(data);
  }

  private async syncScenarioData(data: any): Promise<void> {
    await ApiService.submitScenarioResult(data.scenarioId, data);
  }

  private async syncAnalyticsData(data: any): Promise<void> {
    await ApiService.submitAnalytics(data);
  }

  private async handleFailedSync(item: SyncItem): Promise<void> {
    try {
      const failedItems = await LocalStorageService.getFailedSyncItems();
      failedItems.push({
        ...item,
        failedAt: Date.now(),
      });
      await LocalStorageService.saveFailedSyncItems(failedItems);
    } catch (error) {
      console.error('Error handling failed sync:', error);
    }
  }

  async retryFailedItems(): Promise<void> {
    try {
      const failedItems = await LocalStorageService.getFailedSyncItems();
      if (failedItems.length === 0) return;

      // Reset retry count and add back to sync queue
      for (const item of failedItems) {
        this.syncQueue.push({
          ...item,
          retries: 0,
          status: 'pending',
          timestamp: Date.now(),
        });
      }

      // Clear failed items
      await LocalStorageService.saveFailedSyncItems([]);

      // Save updated sync queue
      await this.saveSyncQueue();

      // Start processing
      this.processSyncQueue();
    } catch (error) {
      console.error('Error retrying failed items:', error);
    }
  }

  async getSyncStatus(): Promise<{
    pendingItems: number;
    failedItems: number;
    lastSync: number;
    isOnline: boolean;
  }> {
    try {
      const failedItems = await LocalStorageService.getFailedSyncItems();
      const networkState = await NetInfo.fetch();

      return {
        pendingItems: this.syncQueue.length,
        failedItems: failedItems.length,
        lastSync: await LocalStorageService.getLastSyncTime(),
        isOnline: networkState.isConnected,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    // Restart sync with new interval if changed
    if (newConfig.syncInterval) {
      this.startSync();
    }
  }
}

export default DataSyncManager.getInstance();

