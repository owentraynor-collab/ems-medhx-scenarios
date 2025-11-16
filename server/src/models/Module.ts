import mongoose, { Document, Schema } from 'mongoose';

export interface IModule extends Document {
  title: string;
  type: 'chief_complaint' | 'hpi' | 'pmh' | 'meds_allergies';
  description: string;
  content: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['chief_complaint', 'hpi', 'pmh', 'meds_allergies'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
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

moduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Module = mongoose.model<IModule>('Module', moduleSchema);

