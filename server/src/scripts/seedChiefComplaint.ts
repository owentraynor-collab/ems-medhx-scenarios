import mongoose from 'mongoose';
import { Module } from '../models/Module';
import { Question } from '../models/Question';
import { chiefComplaintModule } from '../data/modules/chiefComplaint';
import { chiefComplaintQuestions } from '../data/questions/chiefComplaintQuestions';

async function seedChiefComplaintContent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ems-medhx');
    console.log('Connected to MongoDB');

    // Create the module
    const module = new Module(chiefComplaintModule);
    const savedModule = await module.save();
    console.log('Chief Complaint module created');

    // Create the questions
    const questions = chiefComplaintQuestions.map(q => ({
      ...q,
      moduleId: savedModule._id
    }));

    await Question.insertMany(questions);
    console.log('Chief Complaint questions created');

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding content:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedChiefComplaintContent();

