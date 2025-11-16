import mongoose from 'mongoose';
import { Module } from '../models/Module';
import { Question } from '../models/Question';
import { chiefComplaintModule } from '../data/modules/chiefComplaint';
import { chiefComplaintQuestions } from '../data/questions/chiefComplaintQuestions';
import { hpiModule } from '../data/modules/hpiModule';
import { hpiQuestions } from '../data/questions/hpiQuestions';
import { redFlagsModule } from '../data/modules/redFlagsModule';
import { redFlagsQuestions } from '../data/questions/redFlagsQuestions';

async function seedEducationalContent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ems-medhx');
    console.log('Connected to MongoDB');

    // Create the Chief Complaint module
    const ccModule = new Module(chiefComplaintModule);
    const savedCCModule = await ccModule.save();
    console.log('Chief Complaint module created');

    // Create the Chief Complaint questions
    const ccQuestions = chiefComplaintQuestions.map(q => ({
      ...q,
      moduleId: savedCCModule._id
    }));
    await Question.insertMany(ccQuestions);
    console.log('Chief Complaint questions created');

    // Create the HPI module
    const hpiModuleDoc = new Module(hpiModule);
    const savedHPIModule = await hpiModuleDoc.save();
    console.log('HPI module created');

    // Create the HPI questions
    const hpiQuestionsWithModule = hpiQuestions.map(q => ({
      ...q,
      moduleId: savedHPIModule._id
    }));
    await Question.insertMany(hpiQuestionsWithModule);
    console.log('HPI questions created');

    // Create the Red Flags module
    const redFlagsModuleDoc = new Module(redFlagsModule);
    const savedRedFlagsModule = await redFlagsModuleDoc.save();
    console.log('Red Flags module created');

    // Create the Red Flags questions
    const redFlagsQuestionsWithModule = redFlagsQuestions.map(q => ({
      ...q,
      moduleId: savedRedFlagsModule._id
    }));
    await Question.insertMany(redFlagsQuestionsWithModule);
    console.log('Red Flags questions created');

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding content:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedEducationalContent();