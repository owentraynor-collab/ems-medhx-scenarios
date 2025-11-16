import { useState, useEffect } from 'react';
import { FeedbackIntegrator } from '../utils/feedbackIntegrator';

interface FeedbackState {
  isGenerating: boolean;
  currentFeedback: any | null;
  feedbackHistory: any[];
  performanceMetrics: {
    overallTrend: number[];
    criticalActionsTrend: number[];
    redFlagsTrend: number[];
    interventionsTrend: number[];
  };
}

export const useFeedbackIntegration = (scenarioType: string) => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    isGenerating: false,
    currentFeedback: null,
    feedbackHistory: [],
    performanceMetrics: {
      overallTrend: [],
      criticalActionsTrend: [],
      redFlagsTrend: [],
      interventionsTrend: [],
    },
  });

  const generateScenarioFeedback = async (performance: any) => {
    setFeedbackState(prev => ({ ...prev, isGenerating: true }));

    try {
      const feedback = FeedbackIntegrator.generateFeedback({
        ...performance,
        scenarioType,
      });

      updatePerformanceMetrics(feedback);

      setFeedbackState(prev => ({
        ...prev,
        isGenerating: false,
        currentFeedback: feedback,
        feedbackHistory: [...prev.feedbackHistory, feedback],
      }));

      return feedback;
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedbackState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    }
  };

  const updatePerformanceMetrics = (feedback: any) => {
    setFeedbackState(prev => ({
      ...prev,
      performanceMetrics: {
        overallTrend: [...prev.performanceMetrics.overallTrend, feedback.overallScore],
        criticalActionsTrend: [
          ...prev.performanceMetrics.criticalActionsTrend,
          calculateCriticalActionsScore(feedback),
        ],
        redFlagsTrend: [
          ...prev.performanceMetrics.redFlagsTrend,
          calculateRedFlagsScore(feedback),
        ],
        interventionsTrend: [
          ...prev.performanceMetrics.interventionsTrend,
          calculateInterventionsScore(feedback),
        ],
      },
    }));
  };

  const calculateCriticalActionsScore = (feedback: any): number => {
    const completed = feedback.criticalActionsFeedback.completed.length;
    const total = completed + feedback.criticalActionsFeedback.missed.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const calculateRedFlagsScore = (feedback: any): number => {
    const identified = feedback.redFlagFeedback.identified.length;
    const total = identified + feedback.redFlagFeedback.missed.length;
    return total > 0 ? (identified / total) * 100 : 0;
  };

  const calculateInterventionsScore = (feedback: any): number => {
    const correct = feedback.interventionFeedback.sequencing.correct.length;
    const total = correct + feedback.interventionFeedback.sequencing.outOfOrder.length;
    return total > 0 ? (correct / total) * 100 : 0;
  };

  const getPerformanceTrend = () => {
    const { performanceMetrics } = feedbackState;
    
    if (performanceMetrics.overallTrend.length < 2) {
      return 'insufficient_data';
    }

    const recentScores = performanceMetrics.overallTrend.slice(-3);
    const trend = recentScores[recentScores.length - 1] - recentScores[0];

    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  };

  const getStrengthsAndWeaknesses = () => {
    const { performanceMetrics } = feedbackState;
    const latestMetrics = {
      criticalActions: performanceMetrics.criticalActionsTrend[performanceMetrics.criticalActionsTrend.length - 1],
      redFlags: performanceMetrics.redFlagsTrend[performanceMetrics.redFlagsTrend.length - 1],
      interventions: performanceMetrics.interventionsTrend[performanceMetrics.interventionsTrend.length - 1],
    };

    const strengths = [];
    const weaknesses = [];

    Object.entries(latestMetrics).forEach(([key, value]) => {
      if (value >= 80) {
        strengths.push(key);
      } else if (value <= 60) {
        weaknesses.push(key);
      }
    });

    return { strengths, weaknesses };
  };

  const getFocusAreas = () => {
    const { strengths, weaknesses } = getStrengthsAndWeaknesses();
    const trend = getPerformanceTrend();

    if (trend === 'declining' && weaknesses.length > 0) {
      return weaknesses.map(area => ({
        area,
        priority: 'high',
        recommendation: `Focus on improving ${area} performance`,
      }));
    }

    return weaknesses.map(area => ({
      area,
      priority: 'medium',
      recommendation: `Continue practicing ${area} scenarios`,
    }));
  };

  return {
    feedbackState,
    generateScenarioFeedback,
    getPerformanceTrend,
    getStrengthsAndWeaknesses,
    getFocusAreas,
  };
};

