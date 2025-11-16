import { ApiService } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudentTrackingService } from './StudentTrackingService';

export interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
  temperature: number;
  bloodGlucose?: number;
  etco2?: number;
  gcs?: {
    eyes: number;
    verbal: number;
    motor: number;
    total: number;
  };
}

export interface PatientState {
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  breathing: 'normal' | 'labored' | 'absent';
  circulation: 'normal' | 'abnormal' | 'absent';
  disability: string;
  exposure: string[];
  pain: {
    score: number;
    location: string;
    quality: string;
    radiation: string;
    severity: string;
    timing: string;
  };
}

export interface ScenarioContext {
  location: string;
  timeOfDay: string;
  weather?: string;
  bystanders?: string[];
  resources: {
    available: string[];
    eta: { [key: string]: number };
  };
}

export interface Intervention {
  id: string;
  type: 'assessment' | 'treatment' | 'medication' | 'procedure';
  name: string;
  timestamp: number;
  parameters?: Record<string, any>;
  outcome: string;
  effectiveness: number;
}

export interface RedFlag {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  identified: boolean;
  timeIdentified?: number;
}

export interface ScenarioState {
  id: string;
  userId: string;
  scenarioId: string;
  currentTime: number;
  startTime: number;
  patientState: PatientState;
  vitalSigns: VitalSigns;
  context: ScenarioContext;
  interventions: Intervention[];
  redFlags: RedFlag[];
  notes: string[];
  status: 'in_progress' | 'completed' | 'failed';
}

export interface AIResponse {
  content: string;
  vitalSigns?: Partial<VitalSigns>;
  stateChanges?: Partial<PatientState>;
  redFlagHints?: string[];
}

export class ScenarioService {
  private static instance: ScenarioService;
  private api: ApiService;
  private tracking: StudentTrackingService;
  private currentState: ScenarioState | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.api = ApiService.getInstance();
    this.tracking = StudentTrackingService.getInstance();
  }

  static getInstance(): ScenarioService {
    if (!ScenarioService.instance) {
      ScenarioService.instance = new ScenarioService();
    }
    return ScenarioService.instance;
  }

  async startScenario(userId: string, scenarioId: string): Promise<ScenarioState> {
    try {
      // Initialize scenario from server
      const initialState = await this.api.post('/scenarios/start', {
        userId,
        scenarioId,
      });

      // Store state locally
      this.currentState = initialState;
      await this.saveState();

      // Start vital signs updates
      this.startVitalSignsUpdates();

      // Track activity
      await this.tracking.trackActivity({
        userId,
        moduleId: scenarioId,
        activityType: 'scenario',
        duration: 0,
        progress: 0,
        completionStatus: 'started',
        metadata: {
          scenarioId,
          startTime: initialState.startTime,
        },
      });

      return initialState;
    } catch (error) {
      console.error('Failed to start scenario:', error);
      throw new Error('Failed to start scenario');
    }
  }

  private startVitalSignsUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      if (!this.currentState) return;

      try {
        // Get updated vitals based on current state and interventions
        const updatedVitals = await this.api.post('/scenarios/vitals/update', {
          state: this.currentState,
        });

        // Update state
        this.currentState.vitalSigns = updatedVitals;
        await this.saveState();
      } catch (error) {
        console.error('Failed to update vital signs:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  async askQuestion(question: string): Promise<AIResponse> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    try {
      const response = await this.api.post('/scenarios/interact', {
        state: this.currentState,
        question,
      });

      // Update state if response includes changes
      if (response.vitalSigns || response.stateChanges) {
        this.currentState = {
          ...this.currentState,
          vitalSigns: {
            ...this.currentState.vitalSigns,
            ...response.vitalSigns,
          },
          patientState: {
            ...this.currentState.patientState,
            ...response.stateChanges,
          },
        };
        await this.saveState();
      }

      return response;
    } catch (error) {
      console.error('Failed to process question:', error);
      throw new Error('Failed to get patient response');
    }
  }

  async performIntervention(intervention: Omit<Intervention, 'timestamp' | 'outcome' | 'effectiveness'>): Promise<Intervention> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    try {
      // Get intervention outcome from server
      const result = await this.api.post('/scenarios/intervene', {
        state: this.currentState,
        intervention,
      });

      // Update state
      this.currentState.interventions.push(result);
      await this.saveState();

      return result;
    } catch (error) {
      console.error('Failed to perform intervention:', error);
      throw new Error('Failed to perform intervention');
    }
  }

  async identifyRedFlag(redFlagId: string): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    const redFlag = this.currentState.redFlags.find(rf => rf.id === redFlagId);
    if (redFlag && !redFlag.identified) {
      redFlag.identified = true;
      redFlag.timeIdentified = Date.now();
      await this.saveState();
    }
  }

  async addNote(note: string): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    this.currentState.notes.push(note);
    await this.saveState();
  }

  async completeScenario(): Promise<{
    score: number;
    feedback: {
      redFlags: {
        identified: number;
        missed: number;
        criticalMissed: number;
      };
      interventions: {
        appropriate: number;
        inappropriate: number;
        timing: number;
      };
      overallPerformance: string;
      recommendations: string[];
    };
  }> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    try {
      // Stop vital signs updates
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      // Get evaluation from server
      const evaluation = await this.api.post('/scenarios/complete', {
        state: this.currentState,
      });

      // Update state
      this.currentState.status = 'completed';
      await this.saveState();

      // Track completion
      await this.tracking.trackActivity({
        userId: this.currentState.userId,
        moduleId: this.currentState.scenarioId,
        activityType: 'scenario',
        duration: Date.now() - this.currentState.startTime,
        progress: 100,
        score: evaluation.score,
        completionStatus: 'completed',
        metadata: {
          scenarioId: this.currentState.scenarioId,
          redFlagsIdentified: evaluation.feedback.redFlags.identified,
          interventionsScore: evaluation.feedback.interventions.appropriate,
        },
      });

      return evaluation;
    } catch (error) {
      console.error('Failed to complete scenario:', error);
      throw new Error('Failed to complete scenario');
    }
  }

  private async saveState(): Promise<void> {
    if (!this.currentState) return;

    try {
      // Save to local storage
      await AsyncStorage.setItem(
        `scenario_${this.currentState.id}`,
        JSON.stringify(this.currentState)
      );

      // Try to sync with server
      await this.api.put(`/scenarios/${this.currentState.id}`, this.currentState);
    } catch (error) {
      console.error('Failed to save scenario state:', error);
    }
  }

  async loadScenario(scenarioId: string): Promise<ScenarioState | null> {
    try {
      // Try to load from server first
      const state = await this.api.get(`/scenarios/${scenarioId}`);
      this.currentState = state;
      return state;
    } catch (error) {
      // Fallback to local storage
      const savedState = await AsyncStorage.getItem(`scenario_${scenarioId}`);
      if (savedState) {
        this.currentState = JSON.parse(savedState);
        return this.currentState;
      }
      return null;
    }
  }

  getCurrentState(): ScenarioState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.currentState = null;
  }
}

export default ScenarioService;

