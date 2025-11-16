import { ApiService } from './ApiService';
import { StudentTrackingService } from './StudentTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AssessmentCriteria {
  id: string;
  category: 'primary' | 'secondary' | 'focused' | 'ongoing';
  description: string;
  required: boolean;
  timeTarget?: number; // Target time in seconds
  order: number;
  dependencies?: string[]; // IDs of criteria that must be completed first
  redFlags?: string[]; // Associated red flags to watch for
}

export interface AssessmentFinding {
  id: string;
  type: 'normal' | 'abnormal' | 'critical';
  description: string;
  relatedCriteria: string[];
  requiresIntervention: boolean;
  suggestedInterventions?: string[];
}

export interface AssessmentAction {
  id: string;
  criteriaId: string;
  timestamp: number;
  findings: string[];
  notes: string;
  duration: number;
  interventionsPerformed: string[];
}

export interface AssessmentState {
  id: string;
  userId: string;
  scenarioId: string;
  startTime: number;
  completedCriteria: string[];
  actions: AssessmentAction[];
  currentPhase: 'primary' | 'secondary' | 'focused' | 'ongoing';
  status: 'in_progress' | 'completed';
}

export interface AssessmentEvaluation {
  completeness: number;
  timeliness: number;
  accuracy: number;
  criticalFindings: {
    identified: number;
    missed: number;
  };
  interventionAppropriateness: number;
  overallScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export class AssessmentService {
  private static instance: AssessmentService;
  private api: ApiService;
  private tracking: StudentTrackingService;
  private currentState: AssessmentState | null = null;
  private criteria: Map<string, AssessmentCriteria> = new Map();
  private findings: Map<string, AssessmentFinding> = new Map();

  private constructor() {
    this.api = ApiService.getInstance();
    this.tracking = StudentTrackingService.getInstance();
    this.initializeData();
  }

  static getInstance(): AssessmentService {
    if (!AssessmentService.instance) {
      AssessmentService.instance = new AssessmentService();
    }
    return AssessmentService.instance;
  }

  private async initializeData(): Promise<void> {
    try {
      // Load assessment criteria
      const criteriaData = await this.api.get('/assessment/criteria');
      criteriaData.forEach((criteria: AssessmentCriteria) => {
        this.criteria.set(criteria.id, criteria);
      });

      // Load findings
      const findingsData = await this.api.get('/assessment/findings');
      findingsData.forEach((finding: AssessmentFinding) => {
        this.findings.set(finding.id, finding);
      });

      // Cache data locally
      await AsyncStorage.setItem('assessment_criteria', JSON.stringify(criteriaData));
      await AsyncStorage.setItem('assessment_findings', JSON.stringify(findingsData));
    } catch (error) {
      // Load from cache if available
      try {
        const cachedCriteria = await AsyncStorage.getItem('assessment_criteria');
        const cachedFindings = await AsyncStorage.getItem('assessment_findings');

        if (cachedCriteria) {
          JSON.parse(cachedCriteria).forEach((criteria: AssessmentCriteria) => {
            this.criteria.set(criteria.id, criteria);
          });
        }

        if (cachedFindings) {
          JSON.parse(cachedFindings).forEach((finding: AssessmentFinding) => {
            this.findings.set(finding.id, finding);
          });
        }
      } catch (cacheError) {
        console.error('Failed to load assessment data from cache:', cacheError);
      }
    }
  }

  async startAssessment(userId: string, scenarioId: string): Promise<AssessmentState> {
    try {
      const initialState: AssessmentState = {
        id: `${scenarioId}-${Date.now()}`,
        userId,
        scenarioId,
        startTime: Date.now(),
        completedCriteria: [],
        actions: [],
        currentPhase: 'primary',
        status: 'in_progress',
      };

      // Initialize on server
      const state = await this.api.post('/assessment/start', initialState);
      this.currentState = state;

      // Track activity
      await this.tracking.trackActivity({
        userId,
        moduleId: scenarioId,
        activityType: 'assessment',
        duration: 0,
        progress: 0,
        completionStatus: 'started',
        metadata: {
          assessmentId: state.id,
          startTime: state.startTime,
        },
      });

      return state;
    } catch (error) {
      console.error('Failed to start assessment:', error);
      throw new Error('Failed to start assessment');
    }
  }

  async performAssessment(
    criteriaId: string,
    findings: string[],
    notes: string
  ): Promise<AssessmentAction> {
    if (!this.currentState) {
      throw new Error('No active assessment');
    }

    const criteria = this.criteria.get(criteriaId);
    if (!criteria) {
      throw new Error('Invalid assessment criteria');
    }

    try {
      const action: AssessmentAction = {
        id: Date.now().toString(),
        criteriaId,
        timestamp: Date.now(),
        findings,
        notes,
        duration: Date.now() - this.currentState.startTime,
        interventionsPerformed: [],
      };

      // Add action to state
      this.currentState.actions.push(action);
      this.currentState.completedCriteria.push(criteriaId);

      // Update on server
      await this.api.put(`/assessment/${this.currentState.id}/action`, action);

      // Check for phase progression
      await this.checkPhaseProgression();

      return action;
    } catch (error) {
      console.error('Failed to perform assessment:', error);
      throw new Error('Failed to perform assessment');
    }
  }

  private async checkPhaseProgression(): Promise<void> {
    if (!this.currentState) return;

    const phases = ['primary', 'secondary', 'focused', 'ongoing'];
    const currentPhaseIndex = phases.indexOf(this.currentState.currentPhase);

    // Get criteria for current phase
    const currentPhaseCriteria = Array.from(this.criteria.values()).filter(
      c => c.category === this.currentState.currentPhase
    );

    // Check if all required criteria are completed
    const requiredCriteria = currentPhaseCriteria.filter(c => c.required);
    const allRequiredCompleted = requiredCriteria.every(c =>
      this.currentState?.completedCriteria.includes(c.id)
    );

    if (allRequiredCompleted && currentPhaseIndex < phases.length - 1) {
      this.currentState.currentPhase = phases[currentPhaseIndex + 1] as any;
      await this.api.put(`/assessment/${this.currentState.id}/phase`, {
        phase: this.currentState.currentPhase,
      });
    }
  }

  async addIntervention(
    actionId: string,
    intervention: string
  ): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active assessment');
    }

    const action = this.currentState.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error('Invalid action ID');
    }

    action.interventionsPerformed.push(intervention);
    await this.api.put(`/assessment/${this.currentState.id}/intervention`, {
      actionId,
      intervention,
    });
  }

  async completeAssessment(): Promise<AssessmentEvaluation> {
    if (!this.currentState) {
      throw new Error('No active assessment');
    }

    try {
      // Get evaluation from server
      const evaluation = await this.api.post(
        `/assessment/${this.currentState.id}/complete`
      );

      // Update state
      this.currentState.status = 'completed';

      // Track completion
      await this.tracking.trackActivity({
        userId: this.currentState.userId,
        moduleId: this.currentState.scenarioId,
        activityType: 'assessment',
        duration: Date.now() - this.currentState.startTime,
        progress: 100,
        score: evaluation.overallScore,
        completionStatus: 'completed',
        metadata: {
          assessmentId: this.currentState.id,
          completeness: evaluation.completeness,
          timeliness: evaluation.timeliness,
          accuracy: evaluation.accuracy,
        },
      });

      return evaluation;
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      throw new Error('Failed to complete assessment');
    }
  }

  getCurrentCriteria(): AssessmentCriteria[] {
    if (!this.currentState) return [];

    return Array.from(this.criteria.values())
      .filter(c => c.category === this.currentState?.currentPhase)
      .sort((a, b) => a.order - b.order);
  }

  getAvailableCriteria(): AssessmentCriteria[] {
    if (!this.currentState) return [];

    return this.getCurrentCriteria().filter(criteria => {
      // Check if already completed
      if (this.currentState?.completedCriteria.includes(criteria.id)) {
        return false;
      }

      // Check dependencies
      if (criteria.dependencies) {
        return criteria.dependencies.every(depId =>
          this.currentState?.completedCriteria.includes(depId)
        );
      }

      return true;
    });
  }

  getRelevantFindings(criteriaId: string): AssessmentFinding[] {
    return Array.from(this.findings.values()).filter(finding =>
      finding.relatedCriteria.includes(criteriaId)
    );
  }

  async getAssessmentHistory(
    userId: string,
    scenarioId?: string
  ): Promise<AssessmentState[]> {
    try {
      return await this.api.get('/assessment/history', { userId, scenarioId });
    } catch (error) {
      console.error('Failed to get assessment history:', error);
      return [];
    }
  }

  getCurrentState(): AssessmentState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    this.currentState = null;
  }
}

export default AssessmentService;

