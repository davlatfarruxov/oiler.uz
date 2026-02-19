import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tenant from '../src/models/Tenant';
import OilChange from '../src/models/OilChange';
import OilProduct from '../src/models/OilProduct';
import OilBrand from '../src/models/OilBrand';
import Filter from '../src/models/Filter';
import FilterBrand from '../src/models/FilterBrand';
import Inventory from '../src/models/Inventory';
import Settings from '../src/models/Settings';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oiler-db';

interface MigrationStats {
  defaultTenantId: string;
  oilChangesUpdated: number;
  oilProductsUpdated: number;
  oilBrandsUpdated: number;
  filtersUpdated: number;
  filterBrandsUpdated: number;
  inventoryUpdated: number;
  settingsCreated: number;
  errors: number;
}

async function migrateRemainingModels(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    defaultTenantId: '',
    oilChangesUpdated: 0,
    oilProductsUpdated: 0,
    oilBrandsUpdated: 0,
    filtersUpdated: 0,
    filterBrandsUpdated: 0,
    inventoryUpdated: 0,
    settingsCreated: 0,
    errors: 0
  };

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find default tenant
    const defaultTenant = await Tenant.findOne({ companyName: 'Default Company' });
    
    if (!defaultTenant) {
      throw new Error('Default tenant not found. Please run migrations in order.');
    }

    console.log('✅ Found default tenant:', defaultTenant.companyName);
    stats.defaultTenantId = defaultTenant._id.toString();

    const tenantId = defaultTenant._id;

    // ==================== MIGRATE OIL CHANGES ====================
    console.log('\n🛢️  Migrating Oil Changes...');
    
    const oilChangesWithoutTenant = await OilChange.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${oilChangesWithoutTenant.length} oil changes without tenant`);

    for (const oilChange of oilChangesWithoutTenant) {
      try {
        oilChange.tenant = tenantId as any;
        await oilChange.save();
        stats.oilChangesUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating oil change:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.oilChangesUpdated} oil changes`);

    // ==================== MIGRATE OIL PRODUCTS ====================
    console.log('\n🛢️  Migrating Oil Products...');
    
    const oilProductsWithoutTenant = await OilProduct.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${oilProductsWithoutTenant.length} oil products without tenant`);

    for (const oilProduct of oilProductsWithoutTenant) {
      try {
        oilProduct.tenant = tenantId as any;
        await oilProduct.save();
        stats.oilProductsUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating oil product:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.oilProductsUpdated} oil products`);

    // ==================== MIGRATE OIL BRANDS ====================
    console.log('\n🏷️  Migrating Oil Brands...');
    
    const oilBrandsWithoutTenant = await OilBrand.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${oilBrandsWithoutTenant.length} oil brands without tenant`);

    for (const oilBrand of oilBrandsWithoutTenant) {
      try {
        oilBrand.tenant = tenantId as any;
        await oilBrand.save();
        stats.oilBrandsUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating oil brand ${oilBrand.name}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.oilBrandsUpdated} oil brands`);

    // Drop old unique index on name (if exists)
    try {
      await OilBrand.collection.dropIndex('name_1');
      console.log('✅ Dropped old unique index on name');
    } catch (error) {
      console.log('⚠️  Old name index not found (this is OK)');
    }

    // ==================== MIGRATE FILTERS ====================
    console.log('\n🔧 Migrating Filters...');
    
    const filtersWithoutTenant = await Filter.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${filtersWithoutTenant.length} filters without tenant`);

    for (const filter of filtersWithoutTenant) {
      try {
        filter.tenant = tenantId as any;
        await filter.save();
        stats.filtersUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating filter:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.filtersUpdated} filters`);

    // ==================== MIGRATE FILTER BRANDS ====================
    console.log('\n🏷️  Migrating Filter Brands...');
    
    const filterBrandsWithoutTenant = await FilterBrand.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${filterBrandsWithoutTenant.length} filter brands without tenant`);

    for (const filterBrand of filterBrandsWithoutTenant) {
      try {
        filterBrand.tenant = tenantId as any;
        await filterBrand.save();
        stats.filterBrandsUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating filter brand ${filterBrand.name}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.filterBrandsUpdated} filter brands`);

    // Drop old unique index on name (if exists)
    try {
      await FilterBrand.collection.dropIndex('name_1');
      console.log('✅ Dropped old unique index on name');
    } catch (error) {
      console.log('⚠️  Old name index not found (this is OK)');
    }

    // ==================== MIGRATE INVENTORY ====================
    console.log('\n📦 Migrating Inventory...');
    
    const inventoryWithoutTenant = await Inventory.find({
      $or: [
        { tenant: { $exists: false } },
        { tenant: null }
      ]
    });

    console.log(`Found ${inventoryWithoutTenant.length} inventory items without tenant`);

    for (const inventory of inventoryWithoutTenant) {
      try {
        inventory.tenant = tenantId as any;
        await inventory.save();
        stats.inventoryUpdated++;
      } catch (error: any) {
        console.error(`❌ Error updating inventory ${inventory.name}:`, error.message);
        stats.errors++;
      }
    }
    console.log(`✅ Updated ${stats.inventoryUpdated} inventory items`);

    // ==================== MIGRATE SETTINGS ====================
    console.log('\n⚙️  Migrating Settings...');
    
    // Check if settings already exist for this tenant
    const existingSettings = await Settings.findOne({ tenant: tenantId });
    
    if (existingSettings) {
      console.log('⚠️  Settings already exist for default tenant');
    } else {
      // Find old settings (without tenant)
      const oldSettings = await Settings.findOne({
        $or: [
          { tenant: { $exists: false } },
          { tenant: null }
        ]
      });

      if (oldSettings) {
        // Update old settings with tenant
        oldSettings.tenant = tenantId as any;
        await oldSettings.save();
        stats.settingsCreated++;
        console.log('✅ Updated existing settings with tenant');
      } else {
        // Create new settings from tenant settings
        await Settings.create({
          tenant: tenantId,
          companyName: defaultTenant.companyName,
          businessEmail: defaultTenant.businessEmail,
          businessPhone: defaultTenant.businessPhone,
          address: defaultTenant.address,
          defaultOilType: defaultTenant.settings.defaultOilType,
          serviceIntervalKm: defaultTenant.settings.serviceIntervalKm,
          serviceIntervalMonths: defaultTenant.settings.serviceIntervalMonths,
          lowStockThreshold: defaultTenant.settings.lowStockThreshold,
          currency: defaultTenant.settings.currency,
          timezone: defaultTenant.settings.timezone,
          exchangeRate: defaultTenant.settings.exchangeRate
        });
        stats.settingsCreated++;
        console.log('✅ Created new settings for tenant');
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Default Tenant ID: ${stats.defaultTenantId}`);
    console.log(`Oil Changes Updated: ${stats.oilChangesUpdated}`);
    console.log(`Oil Products Updated: ${stats.oilProductsUpdated}`);
    console.log(`Oil Brands Updated: ${stats.oilBrandsUpdated}`);
    console.log(`Filters Updated: ${stats.filtersUpdated}`);
    console.log(`Filter Brands Updated: ${stats.filterBrandsUpdated}`);
    console.log(`Inventory Updated: ${stats.inventoryUpdated}`);
    console.log(`Settings Created/Updated: ${stats.settingsCreated}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateRemainingModels()
  .then(() => {
    console.log('\n✅ Remaining models migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Remaining models migration failed:', error);
    process.exit(1);
  });
