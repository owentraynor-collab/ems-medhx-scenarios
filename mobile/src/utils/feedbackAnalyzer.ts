interface Intervention {
  id: string;
  name: string;
  category: string;
  priority: 'immediate' | 'urgent' | 'priority' | 'delayed';
  timeToComplete: number;
  steps: string[];
}

interface FeedbackMetrics {
  timeToRecognition: number;
  timeToIntervention: number;
  criticalStepsCompleted: boolean[];
  sequenceScore: number;
  overallScore: number;
  missedOpportunities: string[];
  excellentChoices: string[];
  improvementAreas: string[];
}

export const analyzeFeedback = (
  selectedInterventions: Intervention[],
  recommendedInterventions: Intervention[],
  timing: {
    recognitionTime: number;
    firstInterventionTime: number;
  }
): FeedbackMetrics => {
  // Initialize metrics
  const metrics: FeedbackMetrics = {
    timeToRecognition: timing.recognitionTime,
    timeToIntervention: timing.firstInterventionTime,
    criticalStepsCompleted: [],
    sequenceScore: 0,
    overallScore: 0,
    missedOpportunities: [],
    excellentChoices: [],
    improvementAreas: [],
  };

  // Analyze intervention sequence
  metrics.sequenceScore = analyzeSequence(selectedInterventions);

  // Find missed critical interventions
  const missedCritical = findMissedCritical(selectedInterventions, recommendedInterventions);
  metrics.missedOpportunities = missedCritical.map(int => 
    `${int.name} - Critical for patient care`
  );

  // Analyze timing
  const timingAnalysis = analyzeTimings(timing);
  if (timingAnalysis.isExcellent) {
    metrics.excellentChoices.push('Rapid recognition and intervention');
  } else if (timingAnalysis.needsImprovement) {
    metrics.improvementAreas.push(
      `Consider faster ${timingAnalysis.delayedPhase} - target under ${timingAnalysis.targetTime} seconds`
    );
  }

  // Analyze intervention choices
  const choiceAnalysis = analyzeChoices(selectedInterventions, recommendedInterventions);
  metrics.excellentChoices.push(...choiceAnalysis.goodChoices);
  metrics.improvementAreas.push(...choiceAnalysis.improvementAreas);

  // Calculate overall score
  metrics.overallScore = calculateOverallScore({
    sequenceScore: metrics.sequenceScore,
    timingScore: timingAnalysis.score,
    choiceScore: choiceAnalysis.score,
    criticalScore: missedCritical.length === 0 ? 100 : 70,
  });

  return metrics;
};

const analyzeSequence = (interventions: Intervention[]): number => {
  let score = 100;
  const priorityOrder = {
    'immediate': 0,
    'urgent': 1,
    'priority': 2,
    'delayed': 3,
  };

  for (let i = 1; i < interventions.length; i++) {
    const currentPriority = priorityOrder[interventions[i].priority];
    const previousPriority = priorityOrder[interventions[i - 1].priority];
    
    if (currentPriority < previousPriority) {
      // Deduct points for out-of-order interventions
      score -= 10;
    }
  }

  return Math.max(score, 0);
};

const findMissedCritical = (
  selected: Intervention[],
  recommended: Intervention[]
): Intervention[] => {
  const selectedIds = new Set(selected.map(int => int.id));
  return recommended.filter(int => 
    int.priority === 'immediate' && !selectedIds.has(int.id)
  );
};

const analyzeTimings = (timing: {
  recognitionTime: number;
  firstInterventionTime: number;
}) => {
  const targetRecognition = 30; // seconds
  const targetIntervention = 60; // seconds

  const recognitionScore = calculateTimingScore(timing.recognitionTime, targetRecognition);
  const interventionScore = calculateTimingScore(timing.firstInterventionTime, targetIntervention);

  return {
    isExcellent: recognitionScore >= 90 && interventionScore >= 90,
    needsImprovement: recognitionScore < 70 || interventionScore < 70,
    delayedPhase: recognitionScore < interventionScore ? 'recognition' : 'intervention',
    targetTime: recognitionScore < interventionScore ? targetRecognition : targetIntervention,
    score: (recognitionScore + interventionScore) / 2,
  };
};

const calculateTimingScore = (actual: number, target: number): number => {
  if (actual <= target) return 100;
  const overagePercent = (actual - target) / target;
  return Math.max(0, Math.round(100 - (overagePercent * 100)));
};

const analyzeChoices = (
  selected: Intervention[],
  recommended: Intervention[]
): {
  goodChoices: string[];
  improvementAreas: string[];
  score: number;
} => {
  const result = {
    goodChoices: [] as string[],
    improvementAreas: [] as string[],
    score: 0,
  };

  const recommendedIds = new Set(recommended.map(int => int.id));
  const selectedIds = new Set(selected.map(int => int.id));

  // Analyze correct choices
  selected.forEach(int => {
    if (recommendedIds.has(int.id)) {
      result.goodChoices.push(`Appropriate choice: ${int.name}`);
    }
  });

  // Analyze missed recommendations
  recommended.forEach(int => {
    if (!selectedIds.has(int.id)) {
      result.improvementAreas.push(`Consider: ${int.name} for this presentation`);
    }
  });

  // Calculate score based on matching recommendations
  const matchCount = selected.filter(int => recommendedIds.has(int.id)).length;
  result.score = Math.round((matchCount / recommended.length) * 100);

  return result;
};

const calculateOverallScore = (scores: {
  sequenceScore: number;
  timingScore: number;
  choiceScore: number;
  criticalScore: number;
}): number => {
  // Weighted average of scores
  const weights = {
    sequence: 0.2,
    timing: 0.3,
    choice: 0.3,
    critical: 0.2,
  };

  return Math.round(
    scores.sequenceScore * weights.sequence +
    scores.timingScore * weights.timing +
    scores.choiceScore * weights.choice +
    scores.criticalScore * weights.critical
  );
};

export const generateFeedbackSummary = (metrics: FeedbackMetrics): string => {
  const performanceLevel = getPerformanceLevel(metrics.overallScore);
  const summary = [];

  summary.push(`Overall Performance: ${performanceLevel}`);
  
  if (metrics.excellentChoices.length > 0) {
    summary.push('\nStrengths:');
    metrics.excellentChoices.forEach(strength => summary.push(`• ${strength}`));
  }

  if (metrics.improvementAreas.length > 0) {
    summary.push('\nAreas for Improvement:');
    metrics.improvementAreas.forEach(area => summary.push(`• ${area}`));
  }

  return summary.join('\n');
};

const getPerformanceLevel = (score: number): string => {
  if (score >= 90) return 'Expert Performance';
  if (score >= 80) return 'Proficient Performance';
  if (score >= 70) return 'Competent Performance';
  return 'Developing Performance';
};

