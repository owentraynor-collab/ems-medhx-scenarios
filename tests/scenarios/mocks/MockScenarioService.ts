/**
 * Mock Scenario Service for Testing
 * 
 * Simulates the scenario service behavior without requiring
 * React Native or external API dependencies
 */

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

export class MockScenarioService {
  private static instance: MockScenarioService;
  private currentState: ScenarioState | null = null;
  private interventionCounter = 0;

  private constructor() {}

  static getInstance(): MockScenarioService {
    if (!MockScenarioService.instance) {
      MockScenarioService.instance = new MockScenarioService();
    }
    return MockScenarioService.instance;
  }

  async startScenario(userId: string, scenarioId: string): Promise<ScenarioState> {
    this.currentState = {
      id: `scenario-${Date.now()}`,
      userId,
      scenarioId,
      currentTime: Date.now(),
      startTime: Date.now(),
      patientState: {
        consciousness: 'alert',
        breathing: 'normal',
        circulation: 'normal',
        disability: 'none',
        exposure: [],
        pain: {
          score: 5,
          location: 'chest',
          quality: 'crushing',
          radiation: 'left arm',
          severity: 'severe',
          timing: 'constant',
        },
      },
      vitalSigns: {
        heartRate: 110,
        bloodPressure: '150/90',
        respiratoryRate: 20,
        oxygenSaturation: 95,
        temperature: 98.6,
      },
      context: {
        location: 'home',
        timeOfDay: 'morning',
        resources: {
          available: ['ALS', 'BLS'],
          eta: {},
        },
      },
      interventions: [],
      redFlags: [],
      notes: [],
      status: 'in_progress',
    };

    return this.currentState;
  }

  async askQuestion(question: string): Promise<AIResponse> {
    return {
      content: `Mock response to: ${question}`,
      redFlagHints: [],
    };
  }

  async performIntervention(intervention: Omit<Intervention, 'timestamp' | 'outcome' | 'effectiveness'>): Promise<Intervention> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    const completedIntervention: Intervention = {
      ...intervention,
      id: intervention.id || `intervention-${++this.interventionCounter}`,
      timestamp: Date.now(),
      outcome: 'successful',
      effectiveness: 85,
    };

    this.currentState.interventions.push(completedIntervention);
    return completedIntervention;
  }

  async identifyRedFlag(redFlagId: string): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    const redFlag: RedFlag = {
      id: redFlagId,
      category: 'test',
      description: `Red flag: ${redFlagId}`,
      severity: 'high',
      identified: true,
      timeIdentified: Date.now(),
    };

    this.currentState.redFlags.push(redFlag);
  }

  async addNote(note: string): Promise<void> {
    if (!this.currentState) {
      throw new Error('No active scenario');
    }

    this.currentState.notes.push(note);
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

    this.currentState.status = 'completed';

    return {
      score: 85,
      feedback: {
        redFlags: {
          identified: this.currentState.redFlags.length,
          missed: 0,
          criticalMissed: 0,
        },
        interventions: {
          appropriate: this.currentState.interventions.length,
          inappropriate: 0,
          timing: 100,
        },
        overallPerformance: 'Good',
        recommendations: [],
      },
    };
  }

  getCurrentState(): ScenarioState | null {
    return this.currentState;
  }

  async cleanup(): Promise<void> {
    this.currentState = null;
    this.interventionCounter = 0;
  }
}

export default MockScenarioService;

