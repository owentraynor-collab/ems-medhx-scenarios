import AnalyticsEngine from '../../services/AnalyticsEngine';
import ApiService from '../../services/ApiService';
import { LocalStorageService } from '../../services/LocalStorageService';

jest.mock('../../services/ApiService');
jest.mock('../../services/LocalStorageService');

describe('AnalyticsEngine', () => {
  const mockPerformances = [
    {
      metrics: {
        overallScore: 85,
        criticalActions: {
          completed: 8,
          total: 10
        },
        redFlags: {
          identified: 7,
          total: 10
        },
        timing: {
          totalTime: 600,
          benchmarkTime: 500
        }
      },
      learningPoints: [
        { topic: 'topic1', score: 90 },
        { topic: 'topic2', score: 70 }
      ],
      date: '2025-10-01'
    },
    {
      metrics: {
        overallScore: 90,
        criticalActions: {
          completed: 9,
          total: 10
        },
        redFlags: {
          identified: 8,
          total: 10
        },
        timing: {
          totalTime: 550,
          benchmarkTime: 500
        }
      },
      learningPoints: [
        { topic: 'topic1', score: 95 },
        { topic: 'topic2', score: 75 }
      ],
      date: '2025-10-02'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.getStudentPerformance as jest.Mock).mockResolvedValue({
      data: mockPerformances
    });
  });

  describe('Performance Analysis', () => {
    it('should calculate correct performance metrics', async () => {
      const metrics = await AnalyticsEngine.analyzePerformance('user123');

      expect(metrics.overallScore).toBeCloseTo(87.5);
      expect(metrics.criticalActions.accuracy).toBeCloseTo(85);
      expect(metrics.redFlags.accuracy).toBeCloseTo(75);
      expect(metrics.timing.efficiency).toBeCloseTo(89.3, 1);
    });

    it('should handle empty performance data', async () => {
      (ApiService.getStudentPerformance as jest.Mock).mockResolvedValue({ data: [] });

      const metrics = await AnalyticsEngine.analyzePerformance('user123');

      expect(metrics.overallScore).toBe(0);
      expect(metrics.criticalActions.accuracy).toBe(0);
      expect(metrics.redFlags.accuracy).toBe(0);
      expect(metrics.timing.efficiency).toBe(0);
    });

    it('should use cached data when API fails', async () => {
      (ApiService.getStudentPerformance as jest.Mock).mockRejectedValue(new Error());
      (LocalStorageService.getCachedPerformanceData as jest.Mock).mockResolvedValue(mockPerformances);

      const metrics = await AnalyticsEngine.analyzePerformance('user123');

      expect(metrics.overallScore).toBeGreaterThan(0);
      expect(LocalStorageService.getCachedPerformanceData).toHaveBeenCalled();
    });
  });

  describe('Learning Progress Analysis', () => {
    it('should identify mastered topics correctly', async () => {
      const progress = await AnalyticsEngine.analyzeLearningProgress('user123');

      expect(progress.masteredTopics).toContain('topic1');
      expect(progress.masteredTopics).not.toContain('topic2');
    });

    it('should calculate learning rate', async () => {
      const progress = await AnalyticsEngine.analyzeLearningProgress('user123');

      expect(progress.learningRate).toBeGreaterThan(0);
      expect(progress.completedScenarios).toBe(2);
    });

    it('should identify improvement areas', async () => {
      const progress = await AnalyticsEngine.analyzeLearningProgress('user123');

      expect(progress.improvementAreas).toContain('topic2');
    });
  });

  describe('Predictive Analysis', () => {
    it('should generate valid predictions', async () => {
      const predictions = await AnalyticsEngine.generatePredictions('user123');

      expect(predictions.predictedScore).toBeGreaterThan(0);
      expect(predictions.predictedScore).toBeLessThanOrEqual(100);
      expect(predictions.confidenceInterval[0]).toBeLessThan(predictions.confidenceInterval[1]);
    });

    it('should handle insufficient data for predictions', async () => {
      (ApiService.getStudentPerformance as jest.Mock).mockResolvedValue({
        data: [mockPerformances[0]]
      });

      const predictions = await AnalyticsEngine.generatePredictions('user123');

      expect(predictions.predictedScore).toBe(0);
      expect(predictions.confidenceInterval).toEqual([0, 0]);
    });

    it('should generate relevant recommendations', async () => {
      const predictions = await AnalyticsEngine.generatePredictions('user123');

      expect(predictions.recommendedFocus).toBeInstanceOf(Array);
      expect(predictions.recommendedFocus.length).toBeGreaterThan(0);
    });
  });

  describe('Trend Analysis', () => {
    it('should calculate correct trend direction', async () => {
      const trend = await AnalyticsEngine['calculateTrend']([80, 82, 85, 87, 90]);

      expect(trend).toBeGreaterThan(0);
    });

    it('should calculate standard deviation correctly', async () => {
      const stdDev = await AnalyticsEngine['calculateStandardDeviation']([80, 85, 90, 85, 80]);

      expect(stdDev).toBeGreaterThan(0);
    });
  });

  describe('Data Management', () => {
    it('should cache analytics results', async () => {
      await AnalyticsEngine.analyzePerformance('user123');

      expect(LocalStorageService.cacheAnalyticsData).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      (ApiService.getStudentPerformance as jest.Mock).mockRejectedValue(new Error());

      await expect(AnalyticsEngine.analyzePerformance('user123')).not.toThrow();
    });
  });
});

