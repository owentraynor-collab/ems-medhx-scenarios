import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';
import { SyncService } from './SyncService';
import NetInfo from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';

interface PersistenceConfig {
  syncInterval: number;
  maxOfflineSize: number;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  retryAttempts: number;
  conflictResolution: 'server' | 'client' | 'latest' | 'manual';
}

interface SyncStatus {
  lastSync: number;
  pendingChanges: number;
  syncErrors: Array<{
    timestamp: number;
    error: string;
    data?: any;
  }>;
  storageUsage: {
    total: number;
    byType: Record<string, number>;
  };
}

interface DataEntry {
  id: string;
  type: string;
  data: any;
  version: number;
  timestamp: number;
  userId: string;
  deviceId: string;
  status: 'pending' | 'synced' | 'error';
  hash: string;
}

export class DataPersistenceService {
  private static instance: DataPersistenceService;
  private api: ApiService;
  private sync: SyncService;
  private db: SQLite.SQLiteDatabase;
  private config: PersistenceConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private encryptionKey: string | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.sync = SyncService.getInstance();
    this.config = {
      syncInterval: 5 * 60 * 1000, // 5 minutes
      maxOfflineSize: 100 * 1024 * 1024, // 100MB
      encryptionEnabled: true,
      compressionEnabled: true,
      retryAttempts: 3,
      conflictResolution: 'latest',
    };
  }

  static getInstance(): DataPersistenceService {
    if (!DataPersistenceService.instance) {
      DataPersistenceService.instance = new DataPersistenceService();
    }
    return DataPersistenceService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize SQLite database
      this.db = await SQLite.openDatabase({
        name: 'persistence.db',
        location: 'default',
      });

      // Create necessary tables
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS data_entries (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          version INTEGER NOT NULL,
          timestamp INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          device_id TEXT NOT NULL,
          status TEXT NOT NULL,
          hash TEXT NOT NULL
        )
      `);

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          details TEXT
        )
      `);

      // Initialize encryption
      if (this.config.encryptionEnabled) {
        await this.initializeEncryption();
      }

      // Start sync timer
      this.startSyncTimer();

      // Perform initial sync
      await this.synchronize();
    } catch (error) {
      console.error('Failed to initialize persistence service:', error);
      throw error;
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Get or generate encryption key
      const storedKey = await AsyncStorage.getItem('encryption_key');
      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        // Generate new key
        this.encryptionKey = Math.random().toString(36).substring(2);
        await AsyncStorage.setItem('encryption_key', this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.syncTimer = setInterval(
      () => this.synchronize(),
      this.config.syncInterval
    );
  }

  async store(
    type: string,
    data: any,
    userId: string,
    deviceId: string
  ): Promise<string> {
    try {
      const entry: DataEntry = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        type,
        data,
        version: 1,
        timestamp: Date.now(),
        userId,
        deviceId,
        status: 'pending',
        hash: this.generateHash(data),
      };

      // Encrypt if enabled
      const processedData = this.config.encryptionEnabled
        ? await this.encrypt(JSON.stringify(data))
        : JSON.stringify(data);

      // Store in SQLite
      await this.db.executeSql(
        `INSERT INTO data_entries (id, type, data, version, timestamp, user_id, device_id, status, hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.type,
          processedData,
          entry.version,
          entry.timestamp,
          entry.userId,
          entry.deviceId,
          entry.status,
          entry.hash,
        ]
      );

      // Trigger sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.synchronize();
      }

      return entry.id;
    } catch (error) {
      console.error('Failed to store data:', error);
      throw error;
    }
  }

  async retrieve(id: string): Promise<any> {
    try {
      const [result] = await this.db.executeSql(
        'SELECT * FROM data_entries WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Data not found');
      }

      const entry = result.rows.item(0);
      const data = this.config.encryptionEnabled
        ? await this.decrypt(entry.data)
        : entry.data;

      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      throw error;
    }
  }

  async update(
    id: string,
    data: any,
    userId: string,
    deviceId: string
  ): Promise<void> {
    try {
      // Get current version
      const [result] = await this.db.executeSql(
        'SELECT version FROM data_entries WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Data not found');
      }

      const currentVersion = result.rows.item(0).version;
      const newVersion = currentVersion + 1;

      // Process data
      const processedData = this.config.encryptionEnabled
        ? await this.encrypt(JSON.stringify(data))
        : JSON.stringify(data);

      // Update entry
      await this.db.executeSql(
        `UPDATE data_entries
         SET data = ?, version = ?, timestamp = ?, status = ?, hash = ?
         WHERE id = ?`,
        [
          processedData,
          newVersion,
          Date.now(),
          'pending',
          this.generateHash(data),
          id,
        ]
      );

      // Trigger sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.synchronize();
      }
    } catch (error) {
      console.error('Failed to update data:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.executeSql('DELETE FROM data_entries WHERE id = ?', [id]);
    } catch (error) {
      console.error('Failed to delete data:', error);
      throw error;
    }
  }

  async synchronize(): Promise<void> {
    try {
      // Get pending changes
      const [result] = await this.db.executeSql(
        "SELECT * FROM data_entries WHERE status = 'pending'"
      );

      const pendingEntries: DataEntry[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const entry = result.rows.item(i);
        const data = this.config.encryptionEnabled
          ? await this.decrypt(entry.data)
          : entry.data;
        pendingEntries.push({
          ...entry,
          data: JSON.parse(data),
        });
      }

      if (pendingEntries.length === 0) {
        return;
      }

      // Sync with server
      const syncResult = await this.api.post('/data/sync', {
        entries: pendingEntries,
      });

      // Handle conflicts
      for (const conflict of syncResult.conflicts) {
        await this.handleConflict(conflict);
      }

      // Update synced entries
      for (const syncedEntry of syncResult.synced) {
        await this.db.executeSql(
          "UPDATE data_entries SET status = 'synced' WHERE id = ?",
          [syncedEntry.id]
        );
      }

      // Log sync
      await this.db.executeSql(
        'INSERT INTO sync_log (timestamp, type, status, details) VALUES (?, ?, ?, ?)',
        [
          Date.now(),
          'full',
          'success',
          JSON.stringify({
            synced: syncResult.synced.length,
            conflicts: syncResult.conflicts.length,
          }),
        ]
      );
    } catch (error) {
      console.error('Sync failed:', error);
      await this.db.executeSql(
        'INSERT INTO sync_log (timestamp, type, status, details) VALUES (?, ?, ?, ?)',
        [Date.now(), 'full', 'error', JSON.stringify(error)],
      );
    }
  }

  private async handleConflict(conflict: any): Promise<void> {
    switch (this.config.conflictResolution) {
      case 'server':
        await this.resolveWithServer(conflict);
        break;
      case 'client':
        await this.resolveWithClient(conflict);
        break;
      case 'latest':
        await this.resolveWithLatest(conflict);
        break;
      case 'manual':
        // Store conflict for manual resolution
        await AsyncStorage.setItem(
          `conflict_${conflict.id}`,
          JSON.stringify(conflict)
        );
        break;
    }
  }

  private async resolveWithServer(conflict: any): Promise<void> {
    const processedData = this.config.encryptionEnabled
      ? await this.encrypt(JSON.stringify(conflict.serverData))
      : JSON.stringify(conflict.serverData);

    await this.db.executeSql(
      `UPDATE data_entries
       SET data = ?, version = ?, timestamp = ?, status = 'synced'
       WHERE id = ?`,
      [processedData, conflict.serverVersion, Date.now(), conflict.id]
    );
  }

  private async resolveWithClient(conflict: any): Promise<void> {
    await this.api.put(`/data/${conflict.id}`, {
      data: conflict.clientData,
      version: conflict.clientVersion,
    });

    await this.db.executeSql(
      "UPDATE data_entries SET status = 'synced' WHERE id = ?",
      [conflict.id]
    );
  }

  private async resolveWithLatest(conflict: any): Promise<void> {
    if (conflict.serverTimestamp > conflict.clientTimestamp) {
      await this.resolveWithServer(conflict);
    } else {
      await this.resolveWithClient(conflict);
    }
  }

  private async encrypt(data: string): Promise<string> {
    // Implementation would use a proper encryption library
    // This is a placeholder for demonstration
    return Buffer.from(data).toString('base64');
  }

  private async decrypt(data: string): Promise<string> {
    // Implementation would use a proper encryption library
    // This is a placeholder for demonstration
    return Buffer.from(data, 'base64').toString();
  }

  private generateHash(data: any): string {
    // Implementation would use a proper hashing algorithm
    // This is a placeholder for demonstration
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      // Get pending changes count
      const [pendingResult] = await this.db.executeSql(
        "SELECT COUNT(*) as count FROM data_entries WHERE status = 'pending'"
      );
      const pendingCount = pendingResult.rows.item(0).count;

      // Get last sync time
      const [syncResult] = await this.db.executeSql(
        'SELECT MAX(timestamp) as last_sync FROM sync_log WHERE status = ?',
        ['success']
      );
      const lastSync = syncResult.rows.item(0).last_sync || 0;

      // Get sync errors
      const [errorResult] = await this.db.executeSql(
        "SELECT * FROM sync_log WHERE status = 'error' ORDER BY timestamp DESC LIMIT 10"
      );
      const errors = [];
      for (let i = 0; i < errorResult.rows.length; i++) {
        const error = errorResult.rows.item(i);
        errors.push({
          timestamp: error.timestamp,
          error: error.details,
        });
      }

      // Calculate storage usage
      const [storageResult] = await this.db.executeSql(
        'SELECT type, SUM(LENGTH(data)) as size FROM data_entries GROUP BY type'
      );
      const storageByType: Record<string, number> = {};
      let totalStorage = 0;
      for (let i = 0; i < storageResult.rows.length; i++) {
        const item = storageResult.rows.item(i);
        storageByType[item.type] = item.size;
        totalStorage += item.size;
      }

      return {
        lastSync,
        pendingChanges: pendingCount,
        syncErrors: errors,
        storageUsage: {
          total: totalStorage,
          byType: storageByType,
        },
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
      }

      // Remove old sync logs
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      await this.db.executeSql(
        'DELETE FROM sync_log WHERE timestamp < ?',
        [thirtyDaysAgo]
      );

      // Remove synced entries older than 90 days
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      await this.db.executeSql(
        "DELETE FROM data_entries WHERE status = 'synced' AND timestamp < ?",
        [ninetyDaysAgo]
      );
    } catch (error) {
      console.error('Failed to cleanup persistence service:', error);
      throw error;
    }
  }
}

export default DataPersistenceService;

