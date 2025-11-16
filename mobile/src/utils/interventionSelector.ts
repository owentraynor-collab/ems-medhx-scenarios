import { conditionSpecificInterventions } from '../data/conditionSpecificInterventions';

interface RedFlag {
  finding: string;
  significance: string;
  category: string;
}

export const getRecommendedInterventions = (redFlags: RedFlag[]) => {
  const recommendedInterventions = new Set();

  redFlags.forEach(flag => {
    // Chest Pain Interventions
    if (flag.finding.toLowerCase().includes('chest pain') ||
        flag.significance.toLowerCase().includes('cardiac') ||
        flag.significance.toLowerCase().includes('stemi')) {
      conditionSpecificInterventions.chestPainInterventions.forEach(intervention => 
        recommendedInterventions.add(intervention)
      );
    }

    // Altered Mental Status Interventions
    if (flag.finding.toLowerCase().includes('altered') ||
        flag.finding.toLowerCase().includes('unconscious') ||
        flag.significance.toLowerCase().includes('toxidrome')) {
      conditionSpecificInterventions.amsInterventions.forEach(intervention => 
        recommendedInterventions.add(intervention)
      );
    }

    // Stroke Interventions
    if (flag.finding.toLowerCase().includes('neurological') ||
        flag.significance.toLowerCase().includes('stroke') ||
        flag.finding.toLowerCase().includes('facial droop')) {
      conditionSpecificInterventions.strokeInterventions.forEach(intervention => 
        recommendedInterventions.add(intervention)
      );
    }

    // Trauma Interventions
    if (flag.finding.toLowerCase().includes('trauma') ||
        flag.finding.toLowerCase().includes('injury') ||
        flag.significance.toLowerCase().includes('hemorrhage')) {
      conditionSpecificInterventions.traumaInterventions.forEach(intervention => 
        recommendedInterventions.add(intervention)
      );
    }

    // Respiratory Interventions
    if (flag.finding.toLowerCase().includes('breathing') ||
        flag.finding.toLowerCase().includes('respiratory') ||
        flag.significance.toLowerCase().includes('hypoxia')) {
      conditionSpecificInterventions.respiratoryInterventions.forEach(intervention => 
        recommendedInterventions.add(intervention)
      );
    }
  });

  return Array.from(recommendedInterventions);
};

export const prioritizeInterventions = (interventions: any[]) => {
  const priorityOrder = {
    'immediate': 0,
    'urgent': 1,
    'priority': 2,
    'delayed': 3
  };

  return interventions.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

export const validateInterventionSequence = (selectedInterventions: any[]) => {
  const criticalInterventions = new Set([
    'airway_management',
    'bleeding_control',
    'chest_12lead',
    'stroke_assessment'
  ]);

  const performedCritical = selectedInterventions.some(
    intervention => criticalInterventions.has(intervention.id)
  );

  const properSequence = selectedInterventions.every((intervention, index) => {
    if (index === 0) return true;
    const currentPriority = priorityOrder[intervention.priority];
    const previousPriority = priorityOrder[selectedInterventions[index - 1].priority];
    return currentPriority >= previousPriority;
  });

  return {
    performedCritical,
    properSequence,
    feedback: getFeedback(performedCritical, properSequence)
  };
};

const getFeedback = (performedCritical: boolean, properSequence: boolean) => {
  let feedback = [];

  if (!performedCritical) {
    feedback.push('Consider performing critical interventions early in patient care.');
  }

  if (!properSequence) {
    feedback.push('Review intervention priorities - address immediate needs before delayed interventions.');
  }

  if (performedCritical && properSequence) {
    feedback.push('Good intervention sequence - critical needs addressed appropriately.');
  }

  return feedback;
};

export const getInterventionTimeline = (selectedInterventions: any[]) => {
  let timeline = [];
  let currentTime = 0;

  selectedInterventions.forEach(intervention => {
    timeline.push({
      intervention: intervention.name,
      startTime: currentTime,
      duration: intervention.timeToComplete,
      endTime: currentTime + intervention.timeToComplete
    });
    currentTime += intervention.timeToComplete;
  });

  return {
    timeline,
    totalTime: currentTime
  };
};

