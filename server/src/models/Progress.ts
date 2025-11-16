import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  userId: Schema.Types.ObjectId;
  moduleId: Schema.Types.ObjectId;
  completed: boolean;
  quizScores: {
    attemptDate: Date;
    score: number;
    totalQuestions: number;
    incorrectAnswers: Array<{
      questionId: Schema.Types.ObjectId;
      userAnswer: string;
      correctAnswer: string;
    }>;
  }[];
  lastAccessed: Date;
  timeSpent: number; // in minutes
}

const progressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  quizScores: [{
    attemptDate: {
      type: Date,
      default: Date.now,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    incorrectAnswers: [{
      questionId: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
      userAnswer: String,
      correctAnswer: String,
    }],
  }],
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  timeSpent: {
    type: Number,
    default: 0,
  },
});

// Create a compound index for userId and moduleId
progressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

export const Progress = mongoose.model<IProgress>('Progress', progressSchema);

