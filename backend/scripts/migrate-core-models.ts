import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tenant from '../src/models/Tenant';
import Customer from '../src/models/Customer';
import Vehicle from '../src/models/Vehicle';
import Employee from '../src/models/Employee';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oiler-db';

interface MigrationStats {
  defaultTenantId: string;
  customersUpdated: number;
  vehiclesUpdated: number;
  employeesUpdated: number;
  errors: number;
}

async function migrateCoreModels(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    defaultTenantId: '',
    customersUpdated: 0,
    vehiclesUpdated: 0,
    employeesUpdated: 0,
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

    const tenantId = defaultTenant._id;

    // ==================== MIGRATE CUSTOMERS ====================
    console.log('\n📦 Migrating Customers...');
    
    const customersWithoutTenant = await Customer.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${customersWithoutTenant.length} customers without tenant`);

    for (const customer of customersWithoutTenant) {
      try {
        customer.tenant = tenantId as any;
        await customer.save();
        stats.customersUpdated++;
        console.log(`✅ Updated customer: ${customer.name}`);
      } catch (error: any) {
        console.error(`❌ Error updating customer ${customer.name}:`, error.message);
        stats.errors++;
      }
    }

    // Drop old unique index on phone (if exists)
    try {
      await Customer.collection.dropIndex('phone_1');
      console.log('✅ Dropped old unique index on phone');
    } catch (error) {
      console.log('⚠️  Old phone index not found (this is OK)');
    }

    // Create new compound unique index for phone
    try {
      await Customer.collection.createIndex(
        { tenant: 1, phone: 1 }, 
        { unique: true, name: 'tenant_1_phone_1' }
      );
      console.log('✅ Created compound unique index: tenant + phone');
    } catch (error) {
      console.log('⚠️  Compound index already exists (this is OK)');
    }

    // ==================== MIGRATE VEHICLES ====================
    console.log('\n🚗 Migrating Vehicles...');
    
    // First, rename 'model' field to 'vehicleModel' in all vehicles
    console.log('Renaming "model" field to "vehicleModel"...');
    const renameResult = await Vehicle.collection.updateMany(
      { model: { $exists: true } },
      { $rename: { model: 'vehicleModel' } }
    );
    console.log(`✅ Renamed field in ${renameResult.modifiedCount} vehicles`);
    
    const vehiclesWithoutTenant = await Vehicle.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${vehiclesWithoutTenant.length} vehicles without tenant`);

    for (const vehicle of vehiclesWithoutTenant) {
      try {
        vehicle.tenant = tenantId as any;
        await vehicle.save();
        stats.vehiclesUpdated++;
        console.log(`✅ Updated vehicle: ${vehicle.plateNumber}`);
      } catch (error: any) {
        console.error(`❌ Error updating vehicle ${vehicle.plateNumber}:`, error.message);
        stats.errors++;
      }
    }

    // Drop old unique index on plateNumber (if exists)
    try {
      await Vehicle.collection.dropIndex('plateNumber_1');
      console.log('✅ Dropped old unique index on plateNumber');
    } catch (error) {
      console.log('⚠️  Old plateNumber index not found (this is OK)');
    }

    // Create new compound unique index for plateNumber
    try {
      await Vehicle.collection.createIndex(
        { tenant: 1, plateNumber: 1 }, 
        { unique: true, name: 'tenant_1_plateNumber_1' }
      );
      console.log('✅ Created compound unique index: tenant + plateNumber');
    } catch (error) {
      console.log('⚠️  Compound index already exists (this is OK)');
    }

    // ==================== MIGRATE EMPLOYEES ====================
    console.log('\n👥 Migrating Employees...');
    
    const employeesWithoutTenant = await Employee.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${employeesWithoutTenant.length} employees without tenant`);

    for (const employee of employeesWithoutTenant) {
      try {
        employee.tenant = tenantId as any;
        await employee.save();
        stats.employeesUpdated++;
        console.log(`✅ Updated employee: ${employee.name}`);
      } catch (error: any) {
        console.error(`❌ Error updating employee ${employee.name}:`, error.message);
        stats.errors++;
      }
    }

    // Drop old unique index on email (if exists)
    try {
      await Employee.collection.dropIndex('email_1');
      console.log('✅ Dropped old unique index on email');
    } catch (error) {
      console.log('⚠️  Old email index not found (this is OK)');
    }

    // Create new compound unique index for email
    try {
      await Employee.collection.createIndex(
        { tenant: 1, email: 1 }, 
        { unique: true, name: 'tenant_1_email_1' }
      );
      console.log('✅ Created compound unique index: tenant + email');
    } catch (error) {
      console.log('⚠️  Compound index already exists (this is OK)');
    }

    // ==================== SUMMARY ====================
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Default Tenant ID: ${stats.defaultTenantId}`);
    console.log(`Customers Updated: ${stats.customersUpdated}`);
    console.log(`Vehicles Updated: ${stats.vehiclesUpdated}`);
    console.log(`Employees Updated: ${stats.employeesUpdated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateCoreModels()
  .then(() => {
    console.log('\n✅ Core models migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Core models migration failed:', error);
    process.exit(1);
  });
