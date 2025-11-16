import { Performance, IPerformance } from '../models/Performance';
import mongoose from 'mongoose';

export class PerformanceService {
  // Create new performance record
  static async createPerformance(performanceData: Partial<IPerformance>): Promise<IPerformance> {
    try {
      const performance = new Performance(performanceData);
      await performance.save();
      return performance;
    } catch (error) {
      throw new Error(`Error creating performance record: ${error.message}`);
    }
  }

  // Get user's recent performances
  static async getUserPerformances(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<IPerformance[]> {
    try {
      return await Performance.find({ userId })
        .sort({ date: -1 })
        .skip(offset)
        .limit(limit);
    } catch (error) {
      throw new Error(`Error fetching user performances: ${error.message}`);
    }
  }

  // Get performance metrics by scenario type
  static async getScenarioTypeMetrics(
    userId: string,
    scenarioType: string
  ): Promise<any> {
    try {
      const metrics = await Performance.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            scenarioType
          }
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$metrics.overallScore' },
            totalAttempts: { $sum: 1 },
            criticalActionsAvg: { $avg: '$metrics.criticalActions.completed' },
            redFlagsAvg: { $avg: '$metrics.redFlags.identified' },
            averageTime: { $avg: '$duration' }
          }
        }
      ]);

      return metrics[0] || null;
    } catch (error) {
      throw new Error(`Error fetching scenario metrics: ${error.message}`);
    }
  }

  // Get performance trends
  static async getPerformanceTrends(
    userId: string,
    timeRange: 'week' | 'month' | 'all' = 'week'
  ): Promise<any> {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      return await Performance.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            date: dateFilter
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date'
              }
            },
            averageScore: { $avg: '$metrics.overallScore' },
            performances: { $push: '$$ROOT' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Error fetching performance trends: ${error.message}`);
    }
  }

  // Get learning progress
  static async getLearningProgress(userId: string): Promise<any> {
    try {
      return await Performance.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $unwind: '$learningPoints'
        },
        {
          $group: {
            _id: '$learningPoints.topic',
            mastered: { $last: '$learningPoints.mastered' },
            attempts: { $sum: 1 },
            lastAttempt: { $max: '$date' }
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Error fetching learning progress: ${error.message}`);
    }
  }

  // Get performance comparison with peers
  static async getPeerComparison(
    userId: string,
    scenarioType: string
  ): Promise<any> {
    try {
      const userMetrics = await this.getScenarioTypeMetrics(userId, scenarioType);
      
      const peerMetrics = await Performance.aggregate([
        {
          $match: {
            scenarioType,
            userId: { $ne: new mongoose.Types.ObjectId(userId) }
          }
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$metrics.overallScore' },
            totalUsers: { $addToSet: '$userId' },
            criticalActionsAvg: { $avg: '$metrics.criticalActions.completed' },
            redFlagsAvg: { $avg: '$metrics.redFlags.identified' }
          }
        }
      ]);

      return {
        user: userMetrics,
        peers: peerMetrics[0] || null
      };
    } catch (error) {
      throw new Error(`Error fetching peer comparison: ${error.message}`);
    }
  }

  // Get improvement recommendations
  static async getImprovementRecommendations(userId: string): Promise<any> {
    try {
      const recentPerformances = await Performance.find({ userId })
        .sort({ date: -1 })
        .limit(5);

      const weakAreas = this.analyzeWeakAreas(recentPerformances);
      const recommendations = this.generateRecommendations(weakAreas);

      return {
        weakAreas,
        recommendations,
        suggestedScenarios: this.suggestScenarios(weakAreas)
      };
    } catch (error) {
      throw new Error(`Error generating recommendations: ${error.message}`);
    }
  }

  // Helper methods
  private static getDateFilter(timeRange: string): any {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return { $gte: new Date(now.setDate(now.getDate() - 7)) };
      case 'month':
        return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      default:
        return { $exists: true };
    }
  }

  private static analyzeWeakAreas(performances: IPerformance[]): any[] {
    const areas = [];
    
    performances.forEach(performance => {
      // Analyze critical actions
      if (performance.metrics.criticalActions.completed / performance.metrics.criticalActions.total < 0.8) {
        areas.push({
          type: 'critical_actions',
          scenarioType: performance.scenarioType,
          score: performance.metrics.criticalActions.completed / performance.metrics.criticalActions.total
        });
      }

      // Analyze red flags
      if (performance.metrics.redFlags.identified / performance.metrics.redFlags.total < 0.8) {
        areas.push({
          type: 'red_flags',
          scenarioType: performance.scenarioType,
          score: performance.metrics.redFlags.identified / performance.metrics.redFlags.total
        });
      }

      // Analyze timing
      if (performance.metrics.timing.totalTime > performance.metrics.timing.benchmarkTime * 1.2) {
        areas.push({
          type: 'timing',
          scenarioType: performance.scenarioType,
          score: performance.metrics.timing.benchmarkTime / performance.metrics.timing.totalTime
        });
      }
    });

    return this.consolidateWeakAreas(areas);
  }

  private static consolidateWeakAreas(areas: any[]): any[] {
    const consolidated = {};
    
    areas.forEach(area => {
      const key = `${area.type}_${area.scenarioType}`;
      if (!consolidated[key]) {
        consolidated[key] = {
          ...area,
          frequency: 1
        };
      } else {
        consolidated[key].frequency++;
        consolidated[key].score = (consolidated[key].score + area.score) / 2;
      }
    });

    return Object.values(consolidated)
      .sort((a: any, b: any) => b.frequency - a.frequency);
  }

  private static generateRecommendations(weakAreas: any[]): string[] {
    return weakAreas.map(area => {
      switch (area.type) {
        case 'critical_actions':
          return `Focus on completing all critical actions in ${area.scenarioType} scenarios`;
        case 'red_flags':
          return `Practice identifying red flags in ${area.scenarioType} presentations`;
        case 'timing':
          return `Work on improving response time in ${area.scenarioType} scenarios`;
        default:
          return `Review ${area.scenarioType} scenarios for overall improvement`;
      }
    });
  }

  private static suggestScenarios(weakAreas: any[]): string[] {
    return weakAreas
      .filter(area => area.frequency > 1)
      .map(area => area.scenarioType);
  }
}

