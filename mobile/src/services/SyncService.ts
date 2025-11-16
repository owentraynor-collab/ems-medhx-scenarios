import { LocalStorageService } from './LocalStorageService';
import NetInfo from '@react-native-community/netinfo';

export class SyncService {
  private static isRunning = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  static async startSync(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.SYNC_INTERVAL);

    // Perform initial sync
    await this.performSync();
  }

  static stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }

  private static async performSync(): Promise<void> {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        console.log('No network connection, skipping sync');
        return;
      }

      // Get pending items
      const pendingItems = await LocalStorageService.getPendingSync();
      if (pendingItems.length === 0) return;

      // Group items by type for batch processing
      const groupedItems = this.groupItemsByType(pendingItems);

      // Process each group
      for (const [type, items] of Object.entries(groupedItems)) {
        await this.processSyncGroup(type, items);
      }

      // Update local storage sync status
      await this.updateSyncStatus(pendingItems);

    } catch (error) {
      console.error('Sync error:', error);
      // Handle sync errors
      await this.handleSyncError(error);
    }
  }

  private static groupItemsByType(items: any[]): Record<string, any[]> {
    return items.reduce((groups, item) => {
      const type = item.data.type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
      return groups;
    }, {});
  }

  private static async processSyncGroup(type: string, items: any[]): Promise<void> {
    try {
      switch (type) {
        case 'performance':
          await this.syncPerformances(items);
          break;
        case 'scenario':
          await this.syncScenarios(items);
          break;
        case 'user_settings':
          await this.syncUserSettings(items);
          break;
        default:
          console.warn(`Unknown sync type: ${type}`);
      }
    } catch (error) {
      console.error(`Error processing ${type} sync:`, error);
      throw error;
    }
  }

  private static async syncPerformances(items: any[]): Promise<void> {
    try {
      const response = await fetch('/api/performances/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performances: items.map(item => item.data)
        })
      });

      if (!response.ok) throw new Error('Performance sync failed');

      // Remove synced items from pending queue
      for (const item of items) {
        await LocalStorageService.removePendingSync(item.timestamp);
      }
    } catch (error) {
      throw error;
    }
  }

  private static async syncScenarios(items: any[]): Promise<void> {
    try {
      const response = await fetch('/api/scenarios/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarios: items.map(item => item.data)
        })
      });

      if (!response.ok) throw new Error('Scenario sync failed');

      // Update local cache with server response
      const { scenarios } = await response.json();
      for (const scenario of scenarios) {
        await LocalStorageService.cacheScenario(scenario);
      }

      // Remove synced items
      for (const item of items) {
        await LocalStorageService.removePendingSync(item.timestamp);
      }
    } catch (error) {
      throw error;
    }
  }

  private static async syncUserSettings(items: any[]): Promise<void> {
    try {
      const response = await fetch('/api/users/settings/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: items.map(item => item.data)
        })
      });

      if (!response.ok) throw new Error('Settings sync failed');

      // Remove synced items
      for (const item of items) {
        await LocalStorageService.removePendingSync(item.timestamp);
      }
    } catch (error) {
      throw error;
    }
  }

  private static async updateSyncStatus(items: any[]): Promise<void> {
    try {
      const performances = await LocalStorageService.getPerformances();
      const updatedPerformances = performances.map(perf => {
        const syncItem = items.find(item => 
          item.data.localId === perf.localId
        );
        if (syncItem) {
          return {
            ...perf,
            syncStatus: 'synced',
            lastSynced: Date.now()
          };
        }
        return perf;
      });

      await LocalStorageService.savePerformances(updatedPerformances);
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  private static async handleSyncError(error: any): Promise<void> {
    try {
      const pendingItems = await LocalStorageService.getPendingSync();
      const updatedItems = pendingItems.map(item => ({
        ...item,
        attempts: (item.attempts || 0) + 1,
        lastError: error.message
      }));

      // Remove items that exceeded max retry attempts
      const itemsToKeep = updatedItems.filter(item => 
        item.attempts < this.MAX_RETRY_ATTEMPTS
      );

      // Update pending sync queue
      await LocalStorageService.savePendingSync(itemsToKeep);

      // Log removed items for debugging
      const removedItems = updatedItems.length - itemsToKeep.length;
      if (removedItems > 0) {
        console.warn(`Removed ${removedItems} items that exceeded retry attempts`);
      }
    } catch (error) {
      console.error('Error handling sync error:', error);
    }
  }

  static async getSyncStatus(): Promise<{
    isRunning: boolean;
    lastSync: number;
    pendingItems: number;
    syncErrors: number;
  }> {
    try {
      const pendingItems = await LocalStorageService.getPendingSync();
      return {
        isRunning: this.isRunning,
        lastSync: Date.now(),
        pendingItems: pendingItems.length,
        syncErrors: pendingItems.filter(item => item.lastError).length
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw error;
    }
  }
}

