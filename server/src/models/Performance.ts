import mongoose, { Document, Schema } from 'mongoose';

export interface IPerformance extends Document {
  userId: Schema.Types.ObjectId;
  scenarioId: Schema.Types.ObjectId;
  scenarioType: string;
  date: Date;
  duration: number;
  metrics: {
    overallScore: number;
    criticalActions: {
      completed: number;
      total: number;
      timing: {
        action: string;
        actual: number;
        target: number;
      }[];
    };
    redFlags: {
      identified: number;
      total: number;
      timing: {
        flag: string;
        timeToIdentification: number;
      }[];
    };
    interventions: {
      correct: number;
      total: number;
      sequence: {
        action: string;
        expected: number;
        actual: number;
      }[];
    };
    timing: {
      totalTime: number;
      benchmarkTime: number;
    };
  };
  actions: {
    timestamp: number;
    action: string;
    category: string;
    outcome?: string;
  }[];
  feedback: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  learningPoints: {
    topic: string;
    mastered: boolean;
    attempts: number;
  }[];
}

const performanceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scenarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true
  },
  scenarioType: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: {
    type: Number,
    required: true
  },
  metrics: {
    overallScore: Number,
    criticalActions: {
      completed: Number,
      total: Number,
      timing: [{
        action: String,
        actual: Number,
        target: Number
      }]
    },
    redFlags: {
      identified: Number,
      total: Number,
      timing: [{
        flag: String,
        timeToIdentification: Number
      }]
    },
    interventions: {
      correct: Number,
      total: Number,
      sequence: [{
        action: String,
        expected: Number,
        actual: Number
      }]
    },
    timing: {
      totalTime: Number,
      benchmarkTime: Number
    }
  },
  actions: [{
    timestamp: Number,
    action: String,
    category: String,
    outcome: String
  }],
  feedback: {
    strengths: [String],
    improvements: [String],
    recommendations: [String]
  },
  learningPoints: [{
    topic: String,
    mastered: Boolean,
    attempts: Number
  }]
});

// Index for querying recent performances
performanceSchema.index({ userId: 1, date: -1 });

// Index for scenario type analysis
performanceSchema.index({ userId: 1, scenarioType: 1, date: -1 });

export const Performance = mongoose.model<IPerformance>('Performance', performanceSchema);

