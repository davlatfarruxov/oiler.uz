import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../src/config/env';
import OilChange from '../src/models/OilChange';
import Service from '../src/models/Service';

async function addUuidToServices() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Update OilChange documents without publicUuid
    const oilChangesWithoutUuid = await OilChange.find({ 
      $or: [
        { publicUuid: { $exists: false } },
        { publicUuid: null },
        { publicUuid: '' }
      ]
    });

    console.log(`Found ${oilChangesWithoutUuid.length} oil changes without UUID`);

    for (const oilChange of oilChangesWithoutUuid) {
      await OilChange.updateOne(
        { _id: oilChange._id },
        { $set: { publicUuid: uuidv4() } }
      );
      console.log(`Updated oil change ${oilChange._id} with UUID`);
    }

    // Update Service documents without publicUuid
    const servicesWithoutUuid = await Service.find({ 
      $or: [
        { publicUuid: { $exists: false } },
        { publicUuid: null },
        { publicUuid: '' }
      ]
    });

    console.log(`Found ${servicesWithoutUuid.length} services without UUID`);

    for (const service of servicesWithoutUuid) {
      await Service.updateOne(
        { _id: service._id },
        { $set: { publicUuid: uuidv4() } }
      );
      console.log(`Updated service ${service._id} with UUID`);
    }

    console.log('Migration completed successfully!');
    
    // Show some examples
    const sampleOilChange = await OilChange.findOne().select('_id publicUuid');
    const sampleService = await Service.findOne().select('_id publicUuid');
    
    if (sampleOilChange) {
      console.log(`\nSample Oil Change UUID: ${sampleOilChange.publicUuid}`);
      console.log(`Test URL: http://localhost:3001/public/service/${sampleOilChange.publicUuid}`);
    }
    
    if (sampleService) {
      console.log(`\nSample Service UUID: ${sampleService.publicUuid}`);
      console.log(`Test URL: http://localhost:3001/public/service/${sampleService.publicUuid}`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addUuidToServices();