# Multi-Tenant Migration Guide

## Overview
This guide documents the step-by-step migration to a multi-tenant architecture for the Oiler application.

## Architecture
- **Strategy**: Single Database, Shared Schema
- **Isolation**: Each document contains a `tenant` field (ObjectId reference)
- **Default Tenant**: All existing data will be associated with a default tenant

## Migration Steps

### Step 1: Create Tenant Model ✅ (COMPLETED)

**What was done:**
- Created `Tenant` model with:
  - Company information (name, email, phone, address)
  - Subscription info (plan, maxEmployees, maxVehicles)
  - Settings (currency, timezone, exchangeRate, etc.)
  - Status fields (isActive, expiresAt)
- Added `SubscriptionPlan` enum to types
- Created migration script to create default tenant

**Files created/modified:**
- `backend/src/models/Tenant.ts` (NEW)
- `backend/src/types/index.ts` (UPDATED - added SubscriptionPlan enum)
- `backend/scripts/create-default-tenant.ts` (NEW)
- `backend/package.json` (UPDATED - added migration script)

**How to run:**
```bash
cd backend
npm run migrate:create-tenant
```

**Expected output:**
- Default tenant created with ID
- Company name: "Default Company"
- Plan: Enterprise (unlimited)

---

### Step 2: Update User Model and Authentication ✅ (COMPLETED)

**What was done:**
- Added `tenant` field to User model (ObjectId, ref: 'Tenant', required: true)
- Added `isTenantOwner` field to User model (boolean, default: false)
- Updated User schema indexes:
  - Removed unique constraint on email alone
  - Added compound unique index: { email: 1, tenant: 1 }
  - Added indexes: { tenant: 1, role: 1 }, { tenant: 1, isActive: 1 }
- Updated Registration flow:
  - Creates new Tenant when user registers
  - User becomes tenant owner automatically
  - Tenant gets default settings (Free plan, 5 employees, 100 vehicles)
  - Requires companyName in registration
- Updated Login flow:
  - JWT token includes tenantId and isTenantOwner
  - Response includes tenant information
  - Checks if tenant is active
- Updated Auth middleware:
  - Verifies tenant is active
  - Checks subscription expiration
  - Adds tenantId and isTenantOwner to req.user
- Updated JWT utilities:
  - TokenPayload includes tenantId and isTenantOwner
- Updated AuthRequest interface:
  - Added tenantId and isTenantOwner fields

**Files created/modified:**
- `backend/src/models/User.ts` (UPDATED)
- `backend/src/services/authService.ts` (UPDATED)
- `backend/src/controllers/authController.ts` (UPDATED)
- `backend/src/middlewares/auth.ts` (UPDATED)
- `backend/src/utils/jwt.ts` (UPDATED)
- `backend/src/types/index.ts` (UPDATED)
- `backend/scripts/migrate-users-to-tenant.ts` (NEW)
- `backend/package.json` (UPDATED - added migrate:users script)

**Migration script:**
```bash
cd backend
npm run migrate:users
```

**Expected output:**
- All existing users assigned to default tenant
- First user becomes tenant owner
- Old email unique index dropped
- New compound index created (email + tenant)

**IMPORTANT NOTES:**
- Existing users need to login again to get new JWT tokens
- Registration now requires `companyName` field
- Each new registration creates a new tenant
- Email uniqueness is now per-tenant (same email can exist in different tenants)

---

### Step 3: Update Core Models - Part 1 ✅ (COMPLETED)

**What was done:**
- Added `tenant` field to Customer, Vehicle, Employee models
- Updated schema indexes:
  - Customer: Dropped old phone unique index, added compound { tenant: 1, phone: 1 } unique
  - Vehicle: Dropped old plateNumber unique index, added compound { tenant: 1, plateNumber: 1 } unique
  - Employee: Dropped old email unique index, added compound { tenant: 1, email: 1 } unique
- Added compound indexes for performance:
  - { tenant: 1, createdAt: -1 }
  - Model-specific indexes (e.g., { tenant: 1, customer: 1 } for Vehicle)
- Created migration script to update existing data

**Models updated:**
- `backend/src/models/Customer.ts` (UPDATED)
- `backend/src/models/Vehicle.ts` (UPDATED)
- `backend/src/models/Employee.ts` (UPDATED)

**Files created:**
- `backend/scripts/migrate-core-models.ts` (NEW)
- `backend/package.json` (UPDATED - added migrate:core-models script)

**Migration script:**
```bash
cd backend
npm run migrate:core-models
```

**Expected output:**
- All existing customers, vehicles, employees assigned to default tenant
- Old unique indexes dropped
- New compound unique indexes created
- Summary of updated records

**IMPORTANT NOTES:**
- Phone numbers are now unique per tenant (not globally)
- Plate numbers are now unique per tenant (not globally)
- Employee emails are now unique per tenant (not globally)
- This allows different tenants to have same phone/plate/email

---

### Step 4: Update Core Models - Part 2 (PENDING)

**Models to update:**
- OilChange
- OilProduct
- OilBrand
- Filter
- FilterBrand
- Inventory
- Settings

---

### Step 5-7: Update Service Layer (PENDING)

**Services to update:**
- All service methods to include tenant filtering
- Add tenantId parameter to methods
- Implement tenant ownership checks

---

### Step 8: Update Controllers (PENDING)

**Controllers to update:**
- Extract tenantId from req.user
- Pass tenantId to service methods

---

### Step 9-10: Update Frontend (PENDING)

**Frontend changes:**
- Update registration flow
- Add tenant context
- Update UI to show company info

---

## Subscription Plans

### Free Plan
- Max Employees: 5
- Max Vehicles: 100
- Features: Basic

### Premium Plan
- Max Employees: 20
- Max Vehicles: 500
- Features: Advanced

### Enterprise Plan
- Max Employees: Unlimited
- Max Vehicles: Unlimited
- Features: All

---

## Database Indexes

After migration, ensure these indexes exist:

```javascript
// Tenant
{ companyName: 1, isActive: 1 }
{ subdomain: 1 } (unique, sparse)
{ createdAt: -1 }

// All tenant-scoped models
{ tenant: 1, createdAt: -1 }
{ tenant: 1, <unique_field>: 1 } (for unique constraints)
```

---

## Rollback Plan

If migration fails:
1. Keep backup of database before migration
2. Restore from backup
3. Remove tenant field from models
4. Revert code changes

---

## Testing Checklist

After each step:
- [ ] Migration script runs successfully
- [ ] No errors in console
- [ ] Database indexes created
- [ ] Existing data still accessible
- [ ] New data includes tenantId
- [ ] Data isolation works (users only see their tenant's data)

---

## Notes

- Default tenant ID will be used for all existing data
- New registrations will create new tenants automatically
- Subdomain is optional (for future use)
- Settings model will become tenant-specific (one per tenant)

---

## Current Status

**Step 1**: ✅ COMPLETED
- Tenant model created
- Migration script ready
- Default tenant can be created

**Step 3**: ✅ COMPLETED
- Customer, Vehicle, Employee models updated with tenant field
- Compound unique indexes created (tenant + unique field)
- Migration script for existing data ready

**Next Step**: Run migration script and proceed to Step 4
