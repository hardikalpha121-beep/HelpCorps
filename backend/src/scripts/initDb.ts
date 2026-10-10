import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../modules/users/user.model.js';
import Volunteer from '../modules/volunteers/volunteer.model.js';
import HelpRequest from '../modules/helpRequests/helpRequest.model.js';
import KindnessTransaction from '../modules/kindnessPoints/kindnessTransaction.model.js';
import SafetyAlert from '../modules/womenSafety/safetyAlert.model.js';

async function init() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const models = [User, Volunteer, HelpRequest, KindnessTransaction, SafetyAlert];

    for (const model of models) {
      console.log(`Creating collection and syncing indexes for ${model.modelName}...`);
      
      // Explicitly create the collection
      try {
        await model.createCollection();
      } catch (err: any) {
        if (err.code === 48) {
          // NamespaceExists (Collection already exists)
          console.log(`Collection ${model.modelName} already exists.`);
        } else {
          throw err;
        }
      }
      
      // Sync indexes (crucial for 2dsphere geo-location indexes to work)
      await model.syncIndexes();
      console.log(`✅ ${model.modelName} is ready.`);
    }
    
    console.log('\n🎉 Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

init();
