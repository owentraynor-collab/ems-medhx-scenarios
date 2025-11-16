import { scenarioFeedbackTemplates } from '../data/scenarioFeedbackTemplates';

interface ActionTimestamp {
  action: string;
  timestamp: number;
  category: string;
}

interface RedFlagIdentification {
  flag: string;
  timeToIdentification: number;
  associatedActions: string[];
}

interface InterventionRecord {
  name: string;
  timing: number;
  sequence: number;
  completedSteps: string[];
}

interface ScenarioPerformance {
  scenarioType: string;
  startTime: number;
  actions: ActionTimestamp[];
  identifiedRedFlags: RedFlagIdentification[];
  interventions: InterventionRecord[];
  patientOutcome: string;
}

interface FeedbackResult {
  overallScore: number;
  criticalActionsFeedback: {
    completed: string[];
    missed: string[];
    timing: {
      action: string;
      actual: number;
      target: number;
      status: 'excellent' | 'acceptable' | 'delayed';
    }[];
  };
  redFlagFeedback: {
    identified: string[];
    missed: string[];
    timing: {
      flag: string;
      timeToIdentification: number;
      assessment: string;
    }[];
  };
  interventionFeedback: {
    sequencing: {
      correct: string[];
      outOfOrder: string[];
    };
    completion: {
      complete: string[];
      incomplete: string[];
    };
  };
  learningPoints: string[];
  recommendedReview: string[];
  excellentPerformance: string[];
  improvementAreas: string[];
}

export class FeedbackIntegrator {
  private static readonly TIMING_THRESHOLDS = {
    excellent: 0.8, // Within 80% of target time
    acceptable: 1.2, // Within 120% of target time
  };

  static generateFeedback(performance: ScenarioPerformance): FeedbackResult {
    const template = scenarioFeedbackTemplates[performance.scenarioType];
    if (!template) {
      throw new Error(`No feedback template found for scenario type: ${performance.scenarioType}`);
    }

    const feedback: FeedbackResult = {
      overallScore: 0,
      criticalActionsFeedback: {
        completed: [],
        missed: [],
        timing: [],
      },
      redFlagFeedback: {
        identified: [],
        missed: [],
        timing: [],
      },
      interventionFeedback: {
        sequencing: { correct: [], outOfOrder: [] },
        completion: { complete: [], incomplete: [] },
      },
      learningPoints: [],
      recommendedReview: [],
      excellentPerformance: [],
      improvementAreas: [],
    };

    // Analyze Critical Actions
    this.analyzeCriticalActions(performance, template, feedback);
    
    // Analyze Red Flag Recognition
    this.analyzeRedFlags(performance, template, feedback);
    
    // Analyze Interventions
    this.analyzeInterventions(performance, template, feedback);
    
    // Calculate Overall Score
    feedback.overallScore = this.calculateOverallScore(feedback);
    
    // Generate Learning Points and Recommendations
    this.generateRecommendations(feedback, template);

    return feedback;
  }

  private static analyzeCriticalActions(
    performance: ScenarioPerformance,
    template: any,
    feedback: FeedbackResult
  ): void {
    template.criticalActions.forEach(criticalAction => {
      const performedAction = performance.actions.find(
        action => action.action === criticalAction.action
      );

      if (performedAction) {
        feedback.criticalActionsFeedback.completed.push(criticalAction.action);
        
        const timingAssessment = this.assessTiming(
          performedAction.timestamp - performance.startTime,
          criticalAction.timeTarget
        );

        feedback.criticalActionsFeedback.timing.push({
          action: criticalAction.action,
          actual: performedAction.timestamp - performance.startTime,
          target: criticalAction.timeTarget,
          status: timingAssessment,
        });

        if (timingAssessment === 'excellent') {
          feedback.excellentPerformance.push(
            `Excellent timing on ${criticalAction.action}`
          );
        } else if (timingAssessment === 'delayed') {
          feedback.improvementAreas.push(
            `Consider faster ${criticalAction.action} - target: ${criticalAction.timeTarget}s`
          );
        }
      } else {
        feedback.criticalActionsFeedback.missed.push(criticalAction.action);
        feedback.improvementAreas.push(
          `Critical action missed: ${criticalAction.action} - ${criticalAction.rationale}`
        );
      }
    });
  }

  private static analyzeRedFlags(
    performance: ScenarioPerformance,
    template: any,
    feedback: FeedbackResult
  ): void {
    template.redFlagRecognition.forEach(expectedFlag => {
      const identifiedFlag = performance.identifiedRedFlags.find(
        flag => flag.flag === expectedFlag.finding
      );

      if (identifiedFlag) {
        feedback.redFlagFeedback.identified.push(expectedFlag.finding);
        
        const hasAssociatedAction = identifiedFlag.associatedActions.some(
          action => expectedFlag.expectedAction.includes(action)
        );

        if (hasAssociatedAction) {
          feedback.excellentPerformance.push(
            `Appropriate response to ${expectedFlag.finding}`
          );
        } else {
          feedback.improvementAreas.push(
            `Consider ${expectedFlag.expectedAction} for ${expectedFlag.finding}`
          );
        }

        feedback.redFlagFeedback.timing.push({
          flag: expectedFlag.finding,
          timeToIdentification: identifiedFlag.timeToIdentification,
          assessment: identifiedFlag.timeToIdentification < 300 ? 'Prompt' : 'Delayed',
        });
      } else {
        feedback.redFlagFeedback.missed.push(expectedFlag.finding);
        feedback.improvementAreas.push(
          `Missed red flag: ${expectedFlag.finding} - ${expectedFlag.significance}`
        );
      }
    });
  }

  private static analyzeInterventions(
    performance: ScenarioPerformance,
    template: any,
    feedback: FeedbackResult
  ): void {
    let currentPriority = 'immediate';
    
    template.interventionSequence.forEach(sequence => {
      sequence.interventions.forEach(intervention => {
        const performed = performance.interventions.find(
          i => i.name === intervention
        );

        if (performed) {
          if (performed.sequence === template.interventionSequence.indexOf(sequence)) {
            feedback.interventionFeedback.sequencing.correct.push(intervention);
          } else {
            feedback.interventionFeedback.sequencing.outOfOrder.push(intervention);
            feedback.improvementAreas.push(
              `Consider ${intervention} earlier in sequence - ${sequence.rationale}`
            );
          }

          if (performed.completedSteps.length === template.interventionSteps?.length) {
            feedback.interventionFeedback.completion.complete.push(intervention);
          } else {
            feedback.interventionFeedback.completion.incomplete.push(intervention);
            feedback.improvementAreas.push(
              `Ensure completion of all steps for ${intervention}`
            );
          }
        }
      });
    });
  }

  private static assessTiming(actual: number, target: number): 'excellent' | 'acceptable' | 'delayed' {
    const ratio = actual / target;
    if (ratio <= this.TIMING_THRESHOLDS.excellent) return 'excellent';
    if (ratio <= this.TIMING_THRESHOLDS.acceptable) return 'acceptable';
    return 'delayed';
  }

  private static calculateOverallScore(feedback: FeedbackResult): number {
    const weights = {
      criticalActions: 0.4,
      redFlags: 0.3,
      interventions: 0.3,
    };

    const criticalActionsScore = 
      (feedback.criticalActionsFeedback.completed.length /
      (feedback.criticalActionsFeedback.completed.length + 
       feedback.criticalActionsFeedback.missed.length)) * 100;

    const redFlagsScore =
      (feedback.redFlagFeedback.identified.length /
      (feedback.redFlagFeedback.identified.length +
       feedback.redFlagFeedback.missed.length)) * 100;

    const interventionsScore =
      (feedback.interventionFeedback.sequencing.correct.length /
      (feedback.interventionFeedback.sequencing.correct.length +
       feedback.interventionFeedback.sequencing.outOfOrder.length)) * 100;

    return Math.round(
      criticalActionsScore * weights.criticalActions +
      redFlagsScore * weights.redFlags +
      interventionsScore * weights.interventions
    );
  }

  private static generateRecommendations(
    feedback: FeedbackResult,
    template: any
  ): void {
    // Add scenario-specific learning points
    feedback.learningPoints = [...template.learningPoints];

    // Generate recommended review topics
    if (feedback.criticalActionsFeedback.missed.length > 0) {
      feedback.recommendedReview.push('Review critical actions and their timing');
    }
    if (feedback.redFlagFeedback.missed.length > 0) {
      feedback.recommendedReview.push('Review red flag recognition');
    }
    if (feedback.interventionFeedback.sequencing.outOfOrder.length > 0) {
      feedback.recommendedReview.push('Review intervention prioritization');
    }

    // Add excellent care markers if criteria met
    template.excellentCareMarkers.forEach(marker => {
      if (this.meetsExcellenceCriteria(marker, feedback)) {
        feedback.excellentPerformance.push(marker);
      }
    });
  }

  private static meetsExcellenceCriteria(marker: string, feedback: FeedbackResult): boolean {
    // Implementation of specific excellence criteria checking
    const timingExcellence = feedback.criticalActionsFeedback.timing.every(
      t => t.status === 'excellent' || t.status === 'acceptable'
    );
    const redFlagExcellence = feedback.redFlagFeedback.missed.length === 0;
    const sequenceExcellence = feedback.interventionFeedback.sequencing.outOfOrder.length === 0;

    return timingExcellence && redFlagExcellence && sequenceExcellence;
  }
}

// Helper function to format feedback for display
export const formatFeedbackForDisplay = (feedback: FeedbackResult): string => {
  const sections = [
    `Overall Performance Score: ${feedback.overallScore}%\n`,
    
    'Critical Actions:',
    ...feedback.criticalActionsFeedback.completed.map(action => `✓ ${action}`),
    ...feedback.criticalActionsFeedback.missed.map(action => `✗ ${action}`),
    
    '\nRed Flag Recognition:',
    ...feedback.redFlagFeedback.identified.map(flag => `✓ ${flag}`),
    ...feedback.redFlagFeedback.missed.map(flag => `✗ ${flag}`),
    
    '\nExcellent Performance:',
    ...feedback.excellentPerformance,
    
    '\nAreas for Improvement:',
    ...feedback.improvementAreas,
    
    '\nRecommended Review:',
    ...feedback.recommendedReview,
  ];

  return sections.join('\n');
};

