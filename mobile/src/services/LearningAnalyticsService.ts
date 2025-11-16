import { ApiService } from './ApiService';
import { StudentTrackingService } from './StudentTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  overall: {
    averageScore: number;
    completionRate: number;
    timeSpent: number;
    activeDays: number;
    lastActive: number;
  };
  byModule: {
    [moduleId: string]: {
      attempts: number;
      bestScore: number;
      averageScore: number;
      timeSpent: number;
      completionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  byCategory: {
    [category: string]: {
      attempts: number;
      averageScore: number;
      timeSpent: number;
      progress: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      score: number;
      timeSpent: number;
      activitiesCompleted: number;
    }>;
    weekly: Array<{
      week: string;
      averageScore: number;
      totalTimeSpent: number;
      activitiesCompleted: number;
    }>;
  };
}

export interface LearningPath {
  currentLevel: string;
  nextMilestones: Array<{
    type: string;
    description: string;
    requirements: {
      score?: number;
      activities?: number;
      specific?: string[];
    };
    progress: number;
  }>;
  recommendations: Array<{
    moduleId: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
  }>;
}

export interface CompetencyMap {
  [competency: string]: {
    level: 'novice' | 'beginner' | 'competent' | 'proficient' | 'expert';
    score: number;
    evidence: Array<{
      type: string;
      moduleId: string;
      score: number;
      timestamp: number;
    }>;
    requiredFor: string[];
    dependencies: string[];
  };
}

export interface AnalyticsSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  learningPath: LearningPath;
  competencies: CompetencyMap;
  insights: Array<{
    type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    action?: {
      type: string;
      description: string;
      moduleId?: string;
    };
  }>;
}

export class LearningAnalyticsService {
  private static instance: LearningAnalyticsService;
  private api: ApiService;
  private tracking: StudentTrackingService;
  private currentSnapshot: AnalyticsSnapshot | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.tracking = StudentTrackingService.getInstance();
  }

  static getInstance(): LearningAnalyticsService {
    if (!LearningAnalyticsService.instance) {
      LearningAnalyticsService.instance = new LearningAnalyticsService();
    }
    return LearningAnalyticsService.instance;
  }

  async initializeAnalytics(userId: string): Promise<void> {
    try {
      // Load initial snapshot
      await this.refreshAnalytics(userId);

      // Start periodic updates
      this.startPeriodicUpdates(userId);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      throw new Error('Failed to initialize analytics');
    }
  }

  private startPeriodicUpdates(userId: string): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        await this.refreshAnalytics(userId);
      } catch (error) {
        console.error('Failed to update analytics:', error);
      }
    }, 5 * 60 * 1000); // Update every 5 minutes
  }

  async refreshAnalytics(userId: string): Promise<AnalyticsSnapshot> {
    try {
      // Get latest analytics from server
      const snapshot = await this.api.get(`/analytics/${userId}/snapshot`);
      this.currentSnapshot = snapshot;

      // Cache locally
      await AsyncStorage.setItem(
        `analytics_snapshot_${userId}`,
        JSON.stringify(snapshot)
      );

      return snapshot;
    } catch (error) {
      // Try to load from cache
      const cached = await AsyncStorage.getItem(`analytics_snapshot_${userId}`);
      if (cached) {
        this.currentSnapshot = JSON.parse(cached);
        return this.currentSnapshot;
      }
      throw error;
    }
  }

  async getPerformanceMetrics(
    userId: string,
    moduleId?: string
  ): Promise<PerformanceMetrics> {
    if (!this.currentSnapshot) {
      await this.refreshAnalytics(userId);
    }

    if (moduleId) {
      return {
        overall: this.currentSnapshot!.metrics.overall,
        byModule: {
          [moduleId]: this.currentSnapshot!.metrics.byModule[moduleId],
        },
        byCategory: this.currentSnapshot!.metrics.byCategory,
        trends: this.currentSnapshot!.metrics.trends,
      };
    }

    return this.currentSnapshot!.metrics;
  }

  async getLearningPath(userId: string): Promise<LearningPath> {
    if (!this.currentSnapshot) {
      await this.refreshAnalytics(userId);
    }
    return this.currentSnapshot!.learningPath;
  }

  async getCompetencyMap(userId: string): Promise<CompetencyMap> {
    if (!this.currentSnapshot) {
      await this.refreshAnalytics(userId);
    }
    return this.currentSnapshot!.competencies;
  }

  async getInsights(userId: string): Promise<AnalyticsSnapshot['insights']> {
    if (!this.currentSnapshot) {
      await this.refreshAnalytics(userId);
    }
    return this.currentSnapshot!.insights;
  }

  async predictPerformance(
    userId: string,
    moduleId: string
  ): Promise<{
    expectedScore: number;
    confidence: number;
    preparednessLevel: 'high' | 'medium' | 'low';
    prerequisites: Array<{
      moduleId: string;
      reason: string;
      status: 'completed' | 'partial' | 'missing';
    }>;
  }> {
    try {
      return await this.api.get(`/analytics/${userId}/predict`, {
        moduleId,
      });
    } catch (error) {
      console.error('Failed to predict performance:', error);
      throw new Error('Failed to predict performance');
    }
  }

  async getRecommendedPath(
    userId: string,
    goal: {
      competency: string;
      targetLevel: string;
      timeframe?: number;
    }
  ): Promise<Array<{
    step: number;
    moduleId: string;
    type: 'learning' | 'practice' | 'assessment';
    expectedDuration: number;
    dependsOn: string[];
  }>> {
    try {
      return await this.api.post(`/analytics/${userId}/recommend-path`, {
        goal,
      });
    } catch (error) {
      console.error('Failed to get recommended path:', error);
      throw new Error('Failed to get recommended path');
    }
  }

  async generateReport(
    userId: string,
    options: {
      timeframe?: 'week' | 'month' | 'all';
      includeMetrics?: boolean;
      includeCompetencies?: boolean;
      includeRecommendations?: boolean;
    } = {}
  ): Promise<{
    summary: string;
    details: any;
    recommendations: string[];
    exportUrl: string;
  }> {
    try {
      return await this.api.post(`/analytics/${userId}/report`, options);
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw new Error('Failed to generate report');
    }
  }

  async getPerformanceComparison(
    userId: string,
    options: {
      metric: string;
      timeframe: string;
      groupBy?: 'cohort' | 'program' | 'all';
    }
  ): Promise<{
    userValue: number;
    averageValue: number;
    percentile: number;
    distribution: Array<{
      range: string;
      count: number;
      userInRange: boolean;
    }>;
  }> {
    try {
      return await this.api.get(`/analytics/${userId}/compare`, options);
    } catch (error) {
      console.error('Failed to get performance comparison:', error);
      throw new Error('Failed to get performance comparison');
    }
  }

  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.currentSnapshot = null;
  }
}

export default LearningAnalyticsService;

