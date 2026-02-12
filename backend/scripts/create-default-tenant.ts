import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tenant from '../src/models/Tenant';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oiler-db';

interface MigrationStats {
  tenantCreated: boolean;
  tenantId: string;
}

async function createDefaultTenant(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    tenantCreated: false,
    tenantId: ''
  };

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if default tenant already exists
    let defaultTenant = await Tenant.findOne({ companyName: 'Default Company' });

    if (defaultTenant) {
      console.log('⚠️  Default tenant already exists');
      stats.tenantId = defaultTenant._id.toString();
    } else {
      // Create default tenant
      defaultTenant = await Tenant.create({
        companyName: 'Default Company',
        businessEmail: 'admin@oiler.uz',
        businessPhone: '+998901234567',
        address: 'Tashkent, Uzbekistan',
        plan: 'enterprise', // Give unlimited access to existing data
        maxEmployees: 999999,
        maxVehicles: 999999,
        isActive: true,
        settings: {
          currency: 'USD',
          timezone: 'Asia/Tashkent',
          exchangeRate: 12500,
          lowStockThreshold: 10,
          defaultOilType: '5w30',
          serviceIntervalKm: 5000,
          serviceIntervalMonths: 6
        }
      });

      console.log('✅ Default tenant created:', defaultTenant.companyName);
      stats.tenantCreated = true;
      stats.tenantId = defaultTenant._id.toString();
    }

    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Tenant Created: ${stats.tenantCreated ? 'Yes' : 'Already exists'}`);
    console.log(`Tenant ID: ${stats.tenantId}`);
    console.log(`Company Name: ${defaultTenant.companyName}`);
    console.log(`Plan: ${defaultTenant.plan}`);
    console.log('='.repeat(50));
    console.log('\n⚠️  NOTE: Models will be updated in the next migration steps');
    console.log('This script only creates the default tenant.\n');

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
createDefaultTenant()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
