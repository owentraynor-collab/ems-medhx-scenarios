import AsyncStorage from '@react-native-async-storage/async-storage';

export class LocalStorageService {
  private static readonly KEYS = {
    PERFORMANCES: 'performances',
    PENDING_SYNC: 'pending_sync',
    USER_SETTINGS: 'user_settings',
    CACHED_SCENARIOS: 'cached_scenarios',
  };

  // Performance Storage
  static async savePerformance(performance: any): Promise<void> {
    try {
      // Get existing performances
      const performances = await this.getPerformances();
      
      // Add new performance
      performances.push({
        ...performance,
        localId: Date.now().toString(),
        syncStatus: 'pending'
      });

      // Save updated performances
      await AsyncStorage.setItem(
        this.KEYS.PERFORMANCES,
        JSON.stringify(performances)
      );

      // Add to pending sync queue
      await this.addToPendingSync(performance);
    } catch (error) {
      console.error('Error saving performance:', error);
      throw error;
    }
  }

  static async getPerformances(): Promise<any[]> {
    try {
      const performancesJson = await AsyncStorage.getItem(this.KEYS.PERFORMANCES);
      return performancesJson ? JSON.parse(performancesJson) : [];
    } catch (error) {
      console.error('Error getting performances:', error);
      return [];
    }
  }

  static async getRecentPerformances(limit: number = 10): Promise<any[]> {
    try {
      const performances = await this.getPerformances();
      return performances
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent performances:', error);
      return [];
    }
  }

  // Sync Management
  static async addToPendingSync(data: any): Promise<void> {
    try {
      const pendingSync = await this.getPendingSync();
      pendingSync.push({
        data,
        timestamp: Date.now(),
        attempts: 0
      });
      await AsyncStorage.setItem(
        this.KEYS.PENDING_SYNC,
        JSON.stringify(pendingSync)
      );
    } catch (error) {
      console.error('Error adding to pending sync:', error);
      throw error;
    }
  }

  static async getPendingSync(): Promise<any[]> {
    try {
      const pendingSyncJson = await AsyncStorage.getItem(this.KEYS.PENDING_SYNC);
      return pendingSyncJson ? JSON.parse(pendingSyncJson) : [];
    } catch (error) {
      console.error('Error getting pending sync:', error);
      return [];
    }
  }

  static async removePendingSync(timestamp: number): Promise<void> {
    try {
      const pendingSync = await this.getPendingSync();
      const updated = pendingSync.filter(item => item.timestamp !== timestamp);
      await AsyncStorage.setItem(
        this.KEYS.PENDING_SYNC,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error removing from pending sync:', error);
      throw error;
    }
  }

  // Scenario Caching
  static async cacheScenario(scenario: any): Promise<void> {
    try {
      const cachedScenarios = await this.getCachedScenarios();
      cachedScenarios[scenario.id] = {
        ...scenario,
        cachedAt: Date.now()
      };
      await AsyncStorage.setItem(
        this.KEYS.CACHED_SCENARIOS,
        JSON.stringify(cachedScenarios)
      );
    } catch (error) {
      console.error('Error caching scenario:', error);
      throw error;
    }
  }

  static async getCachedScenarios(): Promise<Record<string, any>> {
    try {
      const scenariosJson = await AsyncStorage.getItem(this.KEYS.CACHED_SCENARIOS);
      return scenariosJson ? JSON.parse(scenariosJson) : {};
    } catch (error) {
      console.error('Error getting cached scenarios:', error);
      return {};
    }
  }

  static async getCachedScenario(id: string): Promise<any | null> {
    try {
      const scenarios = await this.getCachedScenarios();
      return scenarios[id] || null;
    } catch (error) {
      console.error('Error getting cached scenario:', error);
      return null;
    }
  }

  // Storage Management
  static async clearOldCache(daysToKeep: number = 7): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

      // Clear old scenarios
      const scenarios = await this.getCachedScenarios();
      const updatedScenarios = Object.entries(scenarios).reduce(
        (acc, [id, scenario]) => {
          if (now - scenario.cachedAt < maxAge) {
            acc[id] = scenario;
          }
          return acc;
        },
        {}
      );
      await AsyncStorage.setItem(
        this.KEYS.CACHED_SCENARIOS,
        JSON.stringify(updatedScenarios)
      );

      // Clear old performances
      const performances = await this.getPerformances();
      const updatedPerformances = performances.filter(
        p => now - new Date(p.date).getTime() < maxAge
      );
      await AsyncStorage.setItem(
        this.KEYS.PERFORMANCES,
        JSON.stringify(updatedPerformances)
      );
    } catch (error) {
      console.error('Error clearing old cache:', error);
      throw error;
    }
  }

  static async getStorageStats(): Promise<{
    performances: number;
    scenarios: number;
    pendingSync: number;
  }> {
    try {
      const [performances, scenarios, pendingSync] = await Promise.all([
        this.getPerformances(),
        this.getCachedScenarios(),
        this.getPendingSync(),
      ]);

      return {
        performances: performances.length,
        scenarios: Object.keys(scenarios).length,
        pendingSync: pendingSync.length,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

