import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import OilProduct from '../src/models/OilProduct';
import Filter from '../src/models/Filter';
import UniversalInventory from '../src/models/UniversalInventory';
import OilBrand from '../src/models/OilBrand';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oiler-db';

interface MigrationStats {
  oilProductsMigrated: number;
  filtersMigrated: number;
  totalMigrated: number;
  errors: number;
  skipped: number;
}

async function migrateToUniversalInventory(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    oilProductsMigrated: 0,
    filtersMigrated: 0,
    totalMigrated: 0,
    errors: 0,
    skipped: 0
  };

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ==================== MIGRATE OIL PRODUCTS ====================
    console.log('\n🛢️  Migrating Oil Products...');
    
    const oilProducts = await OilProduct.find().populate('brand');
    console.log(`Found ${oilProducts.length} oil products to migrate`);

    for (const oilProduct of oilProducts) {
      try {
        // Get brand name
        const brand = oilProduct.populated('brand') || oilProduct.brand;
        let brandName = 'Unknown';
        
        if (brand && typeof brand === 'object' && 'name' in brand) {
          brandName = brand.name;
        } else if (brand) {
          // If brand is not populated, fetch it
          const brandDoc = await OilBrand.findById(brand);
          if (brandDoc) {
            brandName = brandDoc.name;
          }
        }

        // Create name from brand, viscosity, apiGrade, and volume
        const name = `${brandName} ${oilProduct.viscosity} ${oilProduct.apiGrade} ${oilProduct.volume}L`;

        // Check if already migrated
        const existing = await UniversalInventory.findOne({
          tenant: oilProduct.tenant,
          name: name,
          category: 'oil'
        });

        if (existing) {
          console.log(`⚠️  Skipping duplicate: ${name}`);
          stats.skipped++;
          continue;
        }

        // Create universal inventory item
        await UniversalInventory.create({
          tenant: oilProduct.tenant,
          name: name,
          brand: brandName,
          category: 'oil',
          price: oilProduct.price,
          stock: oilProduct.stock,
          unit: 'liter',
          description: `Viscosity: ${oilProduct.viscosity}, API Grade: ${oilProduct.apiGrade}, Volume: ${oilProduct.volume}L`,
          reorderLevel: oilProduct.reorderLevel
        });

        stats.oilProductsMigrated++;
        console.log(`✅ Migrated oil product: ${name}`);
      } catch (error: any) {
        console.error(`❌ Error migrating oil product ${oilProduct._id}:`, error.message);
        stats.errors++;
      }
    }

    // ==================== MIGRATE FILTERS ====================
    console.log('\n🔧 Migrating Filters...');
    
    const filters = await Filter.find();
    console.log(`Found ${filters.length} filters to migrate`);

    for (const filter of filters) {
      try {
        // Map filterType to category
        let category = 'filter';
        switch (filter.filterType) {
          case 'oil_filter':
            category = 'oil_filter';
            break;
          case 'air_filter':
            category = 'air_filter';
            break;
          case 'cabin_filter':
            category = 'cabin_filter';
            break;
          case 'fuel_filter':
            category = 'fuel_filter';
            break;
          default:
            category = 'filter';
        }

        // Create name from brand and part number
        const name = `${filter.brandName} ${filter.partNumber}`;

        // Check if already migrated
        const existing = await UniversalInventory.findOne({
          tenant: filter.tenant,
          name: name,
          category: category
        });

        if (existing) {
          console.log(`⚠️  Skipping duplicate: ${name}`);
          stats.skipped++;
          continue;
        }

        // Create description with filter details
        let description = `Type: ${filter.filterType}, Quality: ${filter.quality}`;
        if (filter.compatibleVehicles && filter.compatibleVehicles.length > 0) {
          description += `, Compatible: ${filter.compatibleVehicles.join(', ')}`;
        }

        // Create universal inventory item
        await UniversalInventory.create({
          tenant: filter.tenant,
          name: name,
          partNumber: filter.partNumber,
          brand: filter.brandName,
          category: category,
          price: filter.price,
          stock: filter.stock,
          unit: 'piece',
          description: description,
          reorderLevel: filter.reorderLevel
        });

        stats.filtersMigrated++;
        console.log(`✅ Migrated filter: ${name} (${category})`);
      } catch (error: any) {
        console.error(`❌ Error migrating filter ${filter._id}:`, error.message);
        stats.errors++;
      }
    }

    // Calculate total
    stats.totalMigrated = stats.oilProductsMigrated + stats.filtersMigrated;

    // ==================== SUMMARY ====================
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Oil Products Migrated: ${stats.oilProductsMigrated}`);
    console.log(`Filters Migrated: ${stats.filtersMigrated}`);
    console.log(`Total Migrated: ${stats.totalMigrated}`);
    console.log(`Skipped (duplicates): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToUniversalInventory()
  .then(() => {
    console.log('\n✅ Universal inventory migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Universal inventory migration failed:', error);
    process.exit(1);
  });
