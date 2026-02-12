import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tenant from '../src/models/Tenant';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oiler-db';

interface MigrationStats {
  defaultTenantId: string;
  usersUpdated: number;
  usersAlreadyMigrated: number;
  errors: number;
}

async function migrateUsersToTenant(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    defaultTenantId: '',
    usersUpdated: 0,
    usersAlreadyMigrated: 0,
    errors: 0
  };

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find default tenant
    const defaultTenant = await Tenant.findOne({ companyName: 'Default Company' });
    
    if (!defaultTenant) {
      throw new Error('Default tenant not found. Please run "npm run migrate:create-tenant" first.');
    }

    console.log('✅ Found default tenant:', defaultTenant.companyName);
    stats.defaultTenantId = defaultTenant._id.toString();

    // Find all users without tenant
    const usersWithoutTenant = await User.find({ 
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`\n📊 Found ${usersWithoutTenant.length} users without tenant`);

    // Update each user
    for (const user of usersWithoutTenant) {
      try {
        user.tenant = defaultTenant._id as any;
        
        // First user becomes tenant owner
        if (stats.usersUpdated === 0) {
          user.isTenantOwner = true;
          console.log(`👑 Making ${user.email} the tenant owner`);
        }
        
        await user.save();
        stats.usersUpdated++;
        console.log(`✅ Updated user: ${user.email}`);
      } catch (error: any) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
        stats.errors++;
      }
    }

    // Check for users already migrated
    const usersWithTenant = await User.countDocuments({ 
      tenant: { $exists: true, $ne: null }
    });
    stats.usersAlreadyMigrated = usersWithTenant - stats.usersUpdated;

    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Default Tenant ID: ${stats.defaultTenantId}`);
    console.log(`Users Updated: ${stats.usersUpdated}`);
    console.log(`Users Already Migrated: ${stats.usersAlreadyMigrated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    // Drop old unique index on email (if exists)
    try {
      await User.collection.dropIndex('email_1');
      console.log('\n✅ Dropped old unique index on email');
    } catch (error) {
      console.log('\n⚠️  Old email index not found (this is OK)');
    }

    // Create new compound unique index
    try {
      await User.collection.createIndex(
        { email: 1, tenant: 1 }, 
        { unique: true, name: 'email_1_tenant_1' }
      );
      console.log('✅ Created new compound unique index: email + tenant');
    } catch (error) {
      console.log('⚠️  Compound index already exists (this is OK)');
    }

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateUsersToTenant()
  .then(() => {
    console.log('\n✅ User migration completed successfully');
    console.log('\n⚠️  IMPORTANT: You need to login again to get new JWT tokens with tenantId');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ User migration failed:', error);
    process.exit(1);
  });
