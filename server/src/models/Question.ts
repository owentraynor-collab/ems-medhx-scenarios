import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  moduleId: Schema.Types.ObjectId;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema({
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    required: true,
  },
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

questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Question = mongoose.model<IQuestion>('Question', questionSchema);

