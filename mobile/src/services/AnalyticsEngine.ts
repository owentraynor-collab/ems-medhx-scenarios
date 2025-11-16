import ApiService from './ApiService';
import { LocalStorageService } from './LocalStorageService';

interface PerformanceMetrics {
  overallScore: number;
  criticalActions: {
    completed: number;
    total: number;
    accuracy: number;
  };
  redFlags: {
    identified: number;
    total: number;
    accuracy: number;
  };
  timing: {
    averageResponseTime: number;
    benchmarkTime: number;
    efficiency: number;
  };
}

interface LearningProgress {
  completedScenarios: number;
  masteredTopics: string[];
  improvementAreas: string[];
  learningRate: number;
}

interface PredictiveModel {
  predictedScore: number;
  confidenceInterval: [number, number];
  recommendedFocus: string[];
}

class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private cachedAnalytics: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  async analyzePerformance(userId: string, timeRange?: string): Promise<PerformanceMetrics> {
    try {
      const performances = await this.getPerformanceData(userId, timeRange);
      
      const metrics = this.calculatePerformanceMetrics(performances);
      await this.cacheAnalytics(`performance_${userId}`, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error analyzing performance:', error);
      // Return cached metrics if available
      const cached = this.cachedAnalytics.get(`performance_${userId}`);
      if (cached) return cached;
      throw error;
    }
  }

  async analyzeLearningProgress(userId: string): Promise<LearningProgress> {
    try {
      const performances = await this.getPerformanceData(userId);
      const progress = this.calculateLearningProgress(performances);
      await this.cacheAnalytics(`progress_${userId}`, progress);
      return progress;
    } catch (error) {
      console.error('Error analyzing learning progress:', error);
      const cached = this.cachedAnalytics.get(`progress_${userId}`);
      if (cached) return cached;
      throw error;
    }
  }

  async generatePredictions(userId: string): Promise<PredictiveModel> {
    try {
      const performances = await this.getPerformanceData(userId);
      const predictions = this.calculatePredictions(performances);
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  private async getPerformanceData(userId: string, timeRange?: string): Promise<any[]> {
    try {
      const response = await ApiService.getStudentPerformance(userId, timeRange);
      return response.data;
    } catch (error) {
      const cachedData = await LocalStorageService.getCachedPerformanceData(userId);
      if (cachedData) return cachedData;
      throw error;
    }
  }

  private calculatePerformanceMetrics(performances: any[]): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      overallScore: 0,
      criticalActions: {
        completed: 0,
        total: 0,
        accuracy: 0,
      },
      redFlags: {
        identified: 0,
        total: 0,
        accuracy: 0,
      },
      timing: {
        averageResponseTime: 0,
        benchmarkTime: 0,
        efficiency: 0,
      },
    };

    if (performances.length === 0) return metrics;

    // Calculate totals
    performances.forEach(perf => {
      // Overall score
      metrics.overallScore += perf.metrics.overallScore;

      // Critical actions
      metrics.criticalActions.completed += perf.metrics.criticalActions.completed;
      metrics.criticalActions.total += perf.metrics.criticalActions.total;

      // Red flags
      metrics.redFlags.identified += perf.metrics.redFlags.identified;
      metrics.redFlags.total += perf.metrics.redFlags.total;

      // Timing
      metrics.timing.averageResponseTime += perf.metrics.timing.totalTime;
      metrics.timing.benchmarkTime += perf.metrics.timing.benchmarkTime;
    });

    // Calculate averages
    const count = performances.length;
    metrics.overallScore /= count;
    metrics.timing.averageResponseTime /= count;
    metrics.timing.benchmarkTime /= count;

    // Calculate accuracies
    metrics.criticalActions.accuracy = 
      metrics.criticalActions.completed / metrics.criticalActions.total * 100;
    metrics.redFlags.accuracy = 
      metrics.redFlags.identified / metrics.redFlags.total * 100;
    metrics.timing.efficiency = 
      metrics.timing.benchmarkTime / metrics.timing.averageResponseTime * 100;

    return metrics;
  }

  private calculateLearningProgress(performances: any[]): LearningProgress {
    const progress: LearningProgress = {
      completedScenarios: performances.length,
      masteredTopics: [],
      improvementAreas: [],
      learningRate: 0,
    };

    if (performances.length < 2) return progress;

    // Analyze topic mastery
    const topicPerformance = new Map<string, number[]>();
    performances.forEach(perf => {
      perf.learningPoints.forEach(point => {
        if (!topicPerformance.has(point.topic)) {
          topicPerformance.set(point.topic, []);
        }
        topicPerformance.get(point.topic)?.push(point.score);
      });
    });

    // Calculate mastery and improvement areas
    topicPerformance.forEach((scores, topic) => {
      const recentScores = scores.slice(-3);
      const average = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

      if (average >= 90) {
        progress.masteredTopics.push(topic);
      } else if (average < 70) {
        progress.improvementAreas.push(topic);
      }
    });

    // Calculate learning rate
    const recentPerformances = performances.slice(-5);
    const scoreChanges = recentPerformances.map((perf, i) => 
      i > 0 ? perf.metrics.overallScore - recentPerformances[i-1].metrics.overallScore : 0
    ).slice(1);

    progress.learningRate = scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length;

    return progress;
  }

  private calculatePredictions(performances: any[]): PredictiveModel {
    if (performances.length < 5) {
      return {
        predictedScore: 0,
        confidenceInterval: [0, 0],
        recommendedFocus: [],
      };
    }

    // Calculate trend
    const recentScores = performances.slice(-5).map(p => p.metrics.overallScore);
    const trend = this.calculateTrend(recentScores);

    // Predict next score
    const predictedScore = Math.min(100, Math.max(0, 
      recentScores[recentScores.length - 1] + trend
    ));

    // Calculate confidence interval
    const standardDeviation = this.calculateStandardDeviation(recentScores);
    const confidenceInterval: [number, number] = [
      Math.max(0, predictedScore - 1.96 * standardDeviation),
      Math.min(100, predictedScore + 1.96 * standardDeviation),
    ];

    // Generate recommendations
    const recommendedFocus = this.generateRecommendations(performances);

    return {
      predictedScore,
      confidenceInterval,
      recommendedFocus,
    };
  }

  private calculateTrend(scores: number[]): number {
    const n = scores.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    scores.forEach((score, i) => {
      sumX += i;
      sumY += score;
      sumXY += i * score;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateStandardDeviation(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(performances: any[]): string[] {
    const recentPerformance = performances[performances.length - 1];
    const recommendations: string[] = [];

    // Check critical actions
    if (recentPerformance.metrics.criticalActions.accuracy < 80) {
      recommendations.push('Focus on completing critical actions');
    }

    // Check red flags
    if (recentPerformance.metrics.redFlags.accuracy < 80) {
      recommendations.push('Practice red flag recognition');
    }

    // Check timing
    if (recentPerformance.metrics.timing.efficiency < 70) {
      recommendations.push('Work on improving response time');
    }

    return recommendations;
  }

  private async cacheAnalytics(key: string, data: any): Promise<void> {
    this.cachedAnalytics.set(key, data);
    await LocalStorageService.cacheAnalyticsData(key, data);
  }
}

export default AnalyticsEngine.getInstance();

