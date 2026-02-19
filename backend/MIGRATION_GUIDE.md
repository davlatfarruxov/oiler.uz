# Multi-Tenant Migration Guide

## Overview
This guide walks you through migrating your existing single-tenant Oiler application to a multi-tenant architecture.

## Prerequisites

1. **Backup your database** before running any migration scripts
2. Ensure MongoDB is running
3. All dependencies are installed: `npm install`
4. Environment variables are configured in `.env`

---

## Migration Steps

### Step 1: Create Default Tenant

This creates a default tenant that will own all existing data.

```bash
cd backend
npm run migrate:create-tenant
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Default tenant created successfully
  - Tenant ID: [tenant-id]
  - Company: Default Company
  - Plan: Enterprise (Unlimited)
✓ Migration completed
```

**What it does:**
- Creates a tenant with company name "Default Company"
- Sets plan to Enterprise (unlimited employees and vehicles)
- Tenant is active by default

---

### Step 2: Migrate Users to Tenant

This assigns all existing users to the default tenant.

```bash
npm run migrate:users
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Found default tenant: [tenant-id]
✓ Migrated X users to default tenant
✓ First user set as tenant owner
✓ Dropped old email unique index
✓ Created compound index: { email: 1, tenant: 1 }
✓ Migration completed
```

**What it does:**
- Assigns all users to default tenant
- Makes first user the tenant owner
- Updates email unique constraint to be per-tenant
- Creates compound indexes for performance

---

### Step 3: Migrate Core Models

This migrates Customer, Vehicle, and Employee models.

```bash
npm run migrate:core-models
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Found default tenant: [tenant-id]
✓ Migrated X customers
✓ Migrated X vehicles
✓ Migrated X employees
✓ Updated unique indexes for all models
✓ Migration completed
```

**What it does:**
- Assigns tenant to all customers, vehicles, employees
- Updates unique constraints (phone, plateNumber, email) to be per-tenant
- Creates compound indexes with tenant prefix

---

### Step 4: Migrate Remaining Models

This migrates all other models (OilChange, Products, Brands, Inventory, Settings).

```bash
npm run migrate:remaining-models
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Found default tenant: [tenant-id]
✓ Migrated X oil changes
✓ Migrated X oil products
✓ Migrated X oil brands
✓ Migrated X filters
✓ Migrated X filter brands
✓ Migrated X inventory items
✓ Created/updated settings for tenant
✓ Updated unique indexes
✓ Migration completed
```

**What it does:**
- Assigns tenant to all remaining models
- Updates brand name unique constraints to be per-tenant
- Creates tenant-specific settings
- Creates compound indexes

---

## Complete Migration Command

Run all migrations in sequence:

```bash
npm run migrate:create-tenant && \
npm run migrate:users && \
npm run migrate:core-models && \
npm run migrate:remaining-models
```

---

## Verification

After migration, verify the changes:

### 1. Check Database

```javascript
// Connect to MongoDB
use oiler_db

// Check tenant
db.tenants.find().pretty()

// Check users have tenantId
db.users.find({}, { email: 1, tenant: 1, isTenantOwner: 1 }).pretty()

// Check vehicles have tenantId
db.vehicles.find({}, { plateNumber: 1, tenant: 1 }).limit(5).pretty()

// Check indexes
db.users.getIndexes()
db.vehicles.getIndexes()
db.customers.getIndexes()
```

### 2. Test Backend API

```bash
# Start backend
npm run dev
```

Test endpoints:
- POST `/api/auth/register` - Create new tenant
- POST `/api/auth/login` - Login with existing user
- GET `/api/vehicles` - Should only return tenant's vehicles
- GET `/api/employees` - Should only return tenant's employees

### 3. Test Frontend

```bash
# Start frontend
cd ../front
npm run dev
```

Test flows:
1. **Registration**: Create new account with company info
2. **Login**: Login with existing user
3. **Dashboard**: Verify company name in header
4. **Settings**: View and edit company information
5. **Data Isolation**: Create/view data (should be tenant-specific)

---

## Rollback Plan

If migration fails or you need to rollback:

### 1. Restore from Backup

```bash
# Restore MongoDB backup
mongorestore --db oiler_db /path/to/backup
```

### 2. Remove Tenant Fields (Manual)

```javascript
// Remove tenant field from all collections
db.users.updateMany({}, { $unset: { tenant: "", isTenantOwner: "" } })
db.vehicles.updateMany({}, { $unset: { tenant: "" } })
db.customers.updateMany({}, { $unset: { tenant: "" } })
// ... repeat for all collections

// Restore old unique indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.vehicles.createIndex({ plateNumber: 1 }, { unique: true })
db.customers.createIndex({ phone: 1 }, { unique: true })
```

---

## Troubleshooting

### Migration Script Fails

**Error: "Default tenant not found"**
- Solution: Run `migrate:create-tenant` first

**Error: "Duplicate key error"**
- Solution: Check if migration was already run
- Clean up partial migration and retry

**Error: "Cannot connect to MongoDB"**
- Solution: Verify MongoDB is running
- Check connection string in `.env`

### API Errors After Migration

**Error: "Cannot read property 'tenantId' of undefined"**
- Solution: User needs to login again to get new JWT token with tenantId

**Error: "Tenant not found"**
- Solution: Verify tenant exists in database
- Check user has valid tenantId

### Frontend Issues

**Company name not showing**
- Solution: Clear localStorage and login again
- Verify tenant data in Redux state

**Settings not loading**
- Solution: Check API endpoint `/settings/company-info`
- Verify tenant context is working

---

## Post-Migration Checklist

- [ ] All migration scripts completed successfully
- [ ] Database indexes created
- [ ] Existing users can login
- [ ] New users can register with company info
- [ ] Data isolation verified (users only see their tenant's data)
- [ ] Settings page shows company information
- [ ] Dashboard shows company name
- [ ] All CRUD operations work correctly
- [ ] No cross-tenant data leakage

---

## Important Notes

1. **Existing Users**: Must login again to get new JWT tokens with tenantId
2. **Email Uniqueness**: Now per-tenant (same email can exist in different tenants)
3. **Phone/Plate Numbers**: Now unique per-tenant
4. **Brand Names**: Now unique per-tenant
5. **Settings**: Each tenant has their own settings
6. **Default Tenant**: All existing data belongs to default tenant

---

## Support

If you encounter issues:
1. Check migration logs for errors
2. Verify database state
3. Review `MULTI_TENANT_MIGRATION.md` for detailed changes
4. Check API responses for error messages

---

## Next Steps

After successful migration:
1. Test all features thoroughly
2. Update API documentation
3. Train users on new registration flow
4. Monitor for any issues
5. Consider implementing:
   - Plan upgrade functionality
   - Tenant analytics
   - Admin panel for managing tenants
   - Usage tracking and billing
