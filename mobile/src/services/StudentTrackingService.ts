import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';
import { SyncService } from './SyncService';
import { AnalyticsEngine } from './AnalyticsEngine';
import { DeviceInfo } from 'react-native';

interface TrackingData {
  userId: string;
  deviceId: string;
  timestamp: number;
  moduleId: string;
  activityType: 'quiz' | 'scenario' | 'content_view' | 'practice';
  duration: number;
  progress: number;
  score?: number;
  completionStatus: 'started' | 'in_progress' | 'completed';
  metadata: Record<string, any>;
}

interface ProgressSnapshot {
  totalModulesCompleted: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: string;
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedModules: string[];
}

interface DeviceSession {
  deviceId: string;
  platform: string;
  lastSync: number;
  activeModules: string[];
}

export class StudentTrackingService {
  private static instance: StudentTrackingService;
  private api: ApiService;
  private sync: SyncService;
  private analytics: AnalyticsEngine;
  private trackingQueue: TrackingData[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, DeviceSession> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.sync = SyncService.getInstance();
    this.analytics = AnalyticsEngine.getInstance();
    this.initializeTracking();
  }

  static getInstance(): StudentTrackingService {
    if (!StudentTrackingService.instance) {
      StudentTrackingService.instance = new StudentTrackingService();
    }
    return StudentTrackingService.instance;
  }

  private async initializeTracking(): Promise<void> {
    try {
      // Load cached tracking data
      const cachedData = await AsyncStorage.getItem('tracking_queue');
      if (cachedData) {
        this.trackingQueue = JSON.parse(cachedData);
      }

      // Start periodic sync
      this.startPeriodicSync();

      // Register device
      await this.registerDevice();

      // Initialize session tracking
      await this.initializeSession();
    } catch (error) {
      console.error('Failed to initialize tracking:', error);
    }
  }

  private async registerDevice(): Promise<void> {
    const deviceId = DeviceInfo.getUniqueId();
    const deviceInfo = {
      deviceId,
      platform: DeviceInfo.getSystemName(),
      version: DeviceInfo.getSystemVersion(),
      model: DeviceInfo.getModel(),
    };

    try {
      await this.api.post('/devices/register', deviceInfo);
    } catch (error) {
      console.error('Failed to register device:', error);
      // Cache registration for later retry
      await AsyncStorage.setItem('pending_device_registration', JSON.stringify(deviceInfo));
    }
  }

  private async initializeSession(): Promise<void> {
    const deviceId = DeviceInfo.getUniqueId();
    const session: DeviceSession = {
      deviceId,
      platform: DeviceInfo.getSystemName(),
      lastSync: Date.now(),
      activeModules: [],
    };

    this.activeSessions.set(deviceId, session);
    await this.sync.syncSession(session);
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.syncTrackingData();
    }, 5 * 60 * 1000); // Sync every 5 minutes
  }

  async trackActivity(data: Omit<TrackingData, 'deviceId' | 'timestamp'>): Promise<void> {
    const trackingEntry: TrackingData = {
      ...data,
      deviceId: DeviceInfo.getUniqueId(),
      timestamp: Date.now(),
    };

    // Add to queue
    this.trackingQueue.push(trackingEntry);

    // Update local storage
    await AsyncStorage.setItem('tracking_queue', JSON.stringify(this.trackingQueue));

    // Update session
    await this.updateSession(data.moduleId);

    // Trigger analytics
    await this.analytics.processActivity(trackingEntry);

    // Attempt immediate sync if queue is large
    if (this.trackingQueue.length >= 10) {
      await this.syncTrackingData();
    }
  }

  private async updateSession(moduleId: string): Promise<void> {
    const deviceId = DeviceInfo.getUniqueId();
    const session = this.activeSessions.get(deviceId);

    if (session) {
      if (!session.activeModules.includes(moduleId)) {
        session.activeModules.push(moduleId);
      }
      session.lastSync = Date.now();
      await this.sync.syncSession(session);
    }
  }

  async syncTrackingData(): Promise<void> {
    if (this.trackingQueue.length === 0) return;

    try {
      // Attempt to sync with server
      await this.api.post('/tracking/sync', {
        data: this.trackingQueue,
        deviceId: DeviceInfo.getUniqueId(),
      });

      // Clear queue on successful sync
      this.trackingQueue = [];
      await AsyncStorage.setItem('tracking_queue', JSON.stringify(this.trackingQueue));
    } catch (error) {
      console.error('Failed to sync tracking data:', error);
      // Data remains in queue for next attempt
    }
  }

  async getProgressSnapshot(userId: string): Promise<ProgressSnapshot> {
    try {
      // Try to get from server first
      const serverSnapshot = await this.api.get(`/progress/${userId}/snapshot`);
      return serverSnapshot;
    } catch (error) {
      // Fall back to local analytics if offline
      return this.analytics.generateProgressSnapshot(userId);
    }
  }

  async getActiveSessions(userId: string): Promise<DeviceSession[]> {
    try {
      const sessions = await this.api.get(`/users/${userId}/sessions`);
      return sessions;
    } catch (error) {
      // Return only local session if offline
      const localSession = this.activeSessions.get(DeviceInfo.getUniqueId());
      return localSession ? [localSession] : [];
    }
  }

  async generateRecommendations(userId: string): Promise<string[]> {
    const snapshot = await this.getProgressSnapshot(userId);
    return this.analytics.generateRecommendations(snapshot);
  }

  async exportProgress(userId: string, format: 'pdf' | 'csv' | 'json'): Promise<string> {
    const snapshot = await this.getProgressSnapshot(userId);
    const sessions = await this.getActiveSessions(userId);
    
    return this.analytics.exportData({
      userId,
      snapshot,
      sessions,
      format,
    });
  }

  async cleanup(): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    await this.syncTrackingData(); // Final sync attempt
  }
}

export default StudentTrackingService;

