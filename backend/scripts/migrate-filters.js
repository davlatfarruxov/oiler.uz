// Migration script to move filters from Inventory to new Filter model
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateFilters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all filters from inventory
    const inventoryFilters = await db.collection('inventories').find({
      productType: 'filter'
    }).toArray();

    console.log(`Found ${inventoryFilters.length} filters in inventory`);

    if (inventoryFilters.length === 0) {
      console.log('No filters to migrate');
      process.exit(0);
    }

    // Create default filter brand if not exists
    let defaultBrand = await db.collection('filterbrands').findOne({ name: 'Generic' });
    if (!defaultBrand) {
      const result = await db.collection('filterbrands').insertOne({
        name: 'Generic',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      defaultBrand = { _id: result.insertedId, name: 'Generic' };
      console.log('Created default filter brand: Generic');
    }

    // Get current exchange rate from settings
    const settings = await db.collection('settings').findOne({});
    const exchangeRate = settings?.exchangeRate || 12500;

    let migratedCount = 0;
    let skippedCount = 0;

    for (const filter of inventoryFilters) {
      try {
        // Check if already migrated
        const existing = await db.collection('filters').findOne({
          partNumber: filter.name
        });

        if (existing) {
          console.log(`Skipping ${filter.name} - already exists`);
          skippedCount++;
          continue;
        }

        // Create new filter
        await db.collection('filters').insertOne({
          brand: defaultBrand._id,
          filterType: 'oil_filter', // Default to oil filter
          partNumber: filter.name,
          quality: 'Standard',
          compatibleVehicles: [],
          costPrice: filter.price * 0.7, // Estimate cost as 70% of sale price
          costCurrency: 'UZS',
          exchangeRateUsed: exchangeRate,
          price: filter.price,
          stock: filter.stock || 0,
          reorderLevel: filter.reorderLevel || 10,
          active: true,
          createdAt: filter.createdAt || new Date(),
          updatedAt: filter.updatedAt || new Date()
        });

        migratedCount++;
        console.log(`✓ Migrated: ${filter.name}`);
      } catch (error) {
        console.error(`Error migrating ${filter.name}:`, error.message);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total filters found: ${inventoryFilters.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log('========================\n');

    console.log('✓ Migration completed successfully');
    console.log('\nNote: Old filters in inventory are NOT deleted.');
    console.log('You can manually review and delete them after verifying the migration.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateFilters();
