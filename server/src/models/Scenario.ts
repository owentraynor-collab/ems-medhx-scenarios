import mongoose, { Document, Schema } from 'mongoose';

export interface IScenario extends Document {
  title: string;
  category: 'chest_pain' | 'shortness_of_breath' | 'abdominal_pain' | 'altered_mental_status' | 'headache' | 'trauma' | 'other';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  setting: string;
  initialPresentation: {
    dispatchInfo: string;
    sceneDescription: string;
    patientAppearance: string;
  };
  vitalSigns: {
    initial: {
      bloodPressure: string;
      heartRate: number;
      respiratoryRate: number;
      spO2: number;
      temperature: number;
      bloodGlucose?: number;
      etCO2?: number;
      gcs?: {
        eyes: number;
        verbal: number;
        motor: number;
        total: number;
      };
    };
    trending?: {
      timeOffset: number; // minutes from initial assessment
      changes: {
        parameter: string;
        value: string;
        trend: 'improving' | 'worsening' | 'stable';
      }[];
    }[];
  };
  redFlags: {
    present: {
      finding: string;
      significance: string;
      requiredAction: string;
    }[];
    potential: {
      trigger: string;
      finding: string;
      significance: string;
      requiredAction: string;
    }[];
  };
  patientResponses: {
    trigger: string; // question or action that prompts this response
    response: string;
    relatedFindings?: string[];
    revealsRedFlag?: boolean;
  }[];
  expectedAssessment: {
    category: 'history' | 'physical' | 'intervention';
    items: {
      action: string;
      rationale: string;
      priority: 'critical' | 'important' | 'supportive';
    }[];
  }[];
  differentialDiagnosis: {
    condition: string;
    supportingFindings: string[];
    redFlags: string[];
  }[];
  correctTreatmentPath: {
    step: number;
    action: string;
    rationale: string;
    timing: 'immediate' | 'urgent' | 'prompt' | 'delayed';
  }[];
  feedback: {
    criticalActions: {
      action: string;
      completed: boolean;
      timeToCompletion?: number;
    }[];
    redFlagRecognition: {
      flag: string;
      identified: boolean;
      timeToIdentification?: number;
    }[];
    overallPerformance: {
      strengths: string[];
      areasForImprovement: string[];
      recommendedReview: string[];
    };
  };
  learningObjectives: string[];
  keywords: string[];
  references: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scenarioSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['chest_pain', 'shortness_of_breath', 'abdominal_pain', 'altered_mental_status', 'headache', 'trauma', 'other'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    required: true,
  },
  setting: {
    type: String,
    required: true,
  },
  initialPresentation: {
    dispatchInfo: String,
    sceneDescription: String,
    patientAppearance: String,
  },
  vitalSigns: {
    initial: {
      bloodPressure: String,
      heartRate: Number,
      respiratoryRate: Number,
      spO2: Number,
      temperature: Number,
      bloodGlucose: Number,
      etCO2: Number,
      gcs: {
        eyes: Number,
        verbal: Number,
        motor: Number,
        total: Number,
      },
    },
    trending: [{
      timeOffset: Number,
      changes: [{
        parameter: String,
        value: String,
        trend: {
          type: String,
          enum: ['improving', 'worsening', 'stable'],
        },
      }],
    }],
  },
  redFlags: {
    present: [{
      finding: String,
      significance: String,
      requiredAction: String,
    }],
    potential: [{
      trigger: String,
      finding: String,
      significance: String,
      requiredAction: String,
    }],
  },
  patientResponses: [{
    trigger: String,
    response: String,
    relatedFindings: [String],
    revealsRedFlag: Boolean,
  }],
  expectedAssessment: [{
    category: {
      type: String,
      enum: ['history', 'physical', 'intervention'],
    },
    items: [{
      action: String,
      rationale: String,
      priority: {
        type: String,
        enum: ['critical', 'important', 'supportive'],
      },
    }],
  }],
  differentialDiagnosis: [{
    condition: String,
    supportingFindings: [String],
    redFlags: [String],
  }],
  correctTreatmentPath: [{
    step: Number,
    action: String,
    rationale: String,
    timing: {
      type: String,
      enum: ['immediate', 'urgent', 'prompt', 'delayed'],
    },
  }],
  feedback: {
    criticalActions: [{
      action: String,
      completed: Boolean,
      timeToCompletion: Number,
    }],
    redFlagRecognition: [{
      flag: String,
      identified: Boolean,
      timeToIdentification: Number,
    }],
    overallPerformance: {
      strengths: [String],
      areasForImprovement: [String],
      recommendedReview: [String],
    },
  },
  learningObjectives: [String],
  keywords: [String],
  references: [String],
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

scenarioSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Scenario = mongoose.model<IScenario>('Scenario', scenarioSchema);