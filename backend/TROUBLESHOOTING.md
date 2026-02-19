# Troubleshooting Guide

## Common Issues and Solutions

### 1. "SettingsService is not a constructor" Error

**Symptoms:**
```
TypeError: settingsService_1.SettingsService is not a constructor
```

**Cause:**
- TypeScript compilation cache issue
- ts-node-dev cache not cleared

**Solution:**

**Option 1: Clear ts-node-dev cache**
```bash
# Windows
rd /s /q %TEMP%\ts-node-dev-*

# Linux/Mac
rm -rf /tmp/ts-node-dev-*
```

**Option 2: Restart with clean cache**
```bash
# Stop the server (Ctrl+C)
# Delete node_modules/.cache
rm -rf node_modules/.cache

# Restart
npm run dev
```

**Option 3: Use nodemon instead**
```bash
# Install nodemon and ts-node
npm install --save-dev nodemon ts-node

# Update package.json script:
"dev": "nodemon --exec ts-node src/server.ts"
```

---

### 2. Duplicate Schema Index Warning

**Symptoms:**
```
Warning: Duplicate schema index on {"tenant":1,"plateNumber":1} found
```

**Cause:**
- Index defined twice in schema
- Once as regular index
- Once as unique index

**Solution:**

Remove the duplicate non-unique index. Keep only the unique one:

**Before:**
```typescript
customerSchema.index({ tenant: 1, phone: 1 });
customerSchema.index({ tenant: 1, phone: 1 }, { unique: true });
```

**After:**
```typescript
customerSchema.index({ tenant: 1, phone: 1 }, { unique: true });
```

**Models to check:**
- Customer.ts (phone)
- Vehicle.ts (plateNumber)
- Employee.ts (email)

---

### 3. MongoDB Connection Error

**Symptoms:**
```
MongooseError: Operation `users.findOne()` buffering timed out
```

**Cause:**
- MongoDB not running
- Wrong connection string
- Network issues

**Solution:**

1. **Check MongoDB is running:**
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongod
```

2. **Verify connection string in .env:**
```env
MONGODB_URI=mongodb://localhost:27017/oiler_db
```

3. **Test connection:**
```bash
mongosh
use oiler_db
db.stats()
```

---

### 4. Migration Script Fails

**Symptoms:**
```
Error: Default tenant not found
```

**Cause:**
- Migrations run out of order
- Default tenant not created

**Solution:**

Run migrations in correct order:
```bash
npm run migrate:create-tenant      # Must run first
npm run migrate:users
npm run migrate:core-models
npm run migrate:remaining-models
```

If migration partially completed:
```javascript
// Check what was migrated
db.tenants.find()
db.users.find({ tenant: { $exists: true } }).count()
db.vehicles.find({ tenant: { $exists: true } }).count()
```

---

### 5. "Tenant not found" API Error

**Symptoms:**
```json
{
  "success": false,
  "message": "Tenant not found"
}
```

**Cause:**
- User JWT token doesn't have tenantId
- User needs to re-login after migration

**Solution:**

1. **Clear localStorage and login again:**
```javascript
// In browser console
localStorage.clear()
// Then login again
```

2. **Verify JWT token includes tenantId:**
```javascript
// Decode token at jwt.io
// Should include: { id, email, role, tenantId, isTenantOwner }
```

3. **Check user in database:**
```javascript
db.users.findOne({ email: "user@example.com" })
// Should have tenant field
```

---

### 6. Cross-Tenant Data Visible

**Symptoms:**
- User sees data from other tenants
- Data isolation not working

**Cause:**
- Service not filtering by tenant
- Controller not passing tenantId

**Solution:**

1. **Verify service includes tenant filter:**
```typescript
// WRONG
Vehicle.find({ plateNumber: "ABC123" })

// CORRECT
Vehicle.find({ tenant: tenantId, plateNumber: "ABC123" })
```

2. **Verify controller passes tenantId:**
```typescript
// WRONG
await vehicleService.getAllVehicles()

// CORRECT
const tenantId = req.user!.tenantId
await vehicleService.getAllVehicles(tenantId)
```

---

### 7. Unique Constraint Violation

**Symptoms:**
```
E11000 duplicate key error collection: oiler_db.vehicles index: plateNumber_1
```

**Cause:**
- Old global unique index still exists
- New compound index not created

**Solution:**

1. **Drop old indexes:**
```javascript
db.vehicles.dropIndex("plateNumber_1")
db.customers.dropIndex("phone_1")
db.users.dropIndex("email_1")
```

2. **Verify new indexes:**
```javascript
db.vehicles.getIndexes()
// Should see: { tenant: 1, plateNumber: 1 } with unique: true
```

3. **Re-run migration if needed:**
```bash
npm run migrate:core-models
```

---

### 8. Settings Not Loading

**Symptoms:**
- Settings page shows loading forever
- API returns 500 error

**Cause:**
- Settings not created for tenant
- API endpoint mismatch

**Solution:**

1. **Create settings manually:**
```javascript
db.settings.insertOne({
  tenant: ObjectId("tenant-id"),
  exchangeRate: 12500,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

2. **Verify API endpoint:**
```bash
# Should be:
GET /api/settings
PUT /api/settings/company-info
PUT /api/settings/exchange-rate
```

---

### 9. Frontend Not Showing Company Name

**Symptoms:**
- Dashboard shows "Admin Panel" instead of company name
- Sidebar shows "OilServe" instead of company name

**Cause:**
- Tenant data not in localStorage
- User needs to re-login

**Solution:**

1. **Check localStorage:**
```javascript
// In browser console
JSON.parse(localStorage.getItem('tenant'))
// Should show company info
```

2. **Re-login:**
- Logout
- Login again
- Tenant data should load

3. **Verify Redux state:**
```javascript
// In Redux DevTools
state.auth.tenant
// Should have company info
```

---

### 10. TypeScript Compilation Errors

**Symptoms:**
```
TS2339: Property 'tenantId' does not exist on type 'User'
```

**Cause:**
- Type definitions not updated
- IDE cache not refreshed

**Solution:**

1. **Restart TypeScript server:**
- VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

2. **Verify type definitions:**
```typescript
// types/index.ts should have:
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
    isTenantOwner: boolean;
  };
}
```

3. **Rebuild:**
```bash
npm run build
```

---

## Performance Issues

### Slow Queries

**Symptoms:**
- API responses take >1 second
- Database queries slow

**Solution:**

1. **Verify indexes exist:**
```javascript
db.vehicles.getIndexes()
db.customers.getIndexes()
db.employees.getIndexes()
```

2. **Check query plans:**
```javascript
db.vehicles.find({ tenant: ObjectId("...") }).explain("executionStats")
// Should show: "stage": "IXSCAN" (index scan)
```

3. **Add missing indexes:**
```javascript
db.collection.createIndex({ tenant: 1, createdAt: -1 })
```

---

## Development Tips

### Clear All Caches

```bash
# Stop server
# Clear all caches
rm -rf node_modules/.cache
rm -rf /tmp/ts-node-dev-*
rm -rf dist

# Reinstall and restart
npm install
npm run dev
```

### Reset Database

```bash
# Backup first!
mongodump --db oiler_db --out ./backup

# Drop database
mongosh
use oiler_db
db.dropDatabase()

# Re-run migrations
npm run migrate:create-tenant
npm run migrate:users
npm run migrate:core-models
npm run migrate:remaining-models
```

### Debug Mode

Add to .env:
```env
DEBUG=true
LOG_LEVEL=debug
```

---

## Getting Help

If issues persist:

1. Check `MIGRATION_GUIDE.md` for migration steps
2. Review `API_CHANGES.md` for API documentation
3. Follow `TEST_PLAN.md` for testing
4. Check MongoDB logs
5. Check application logs
6. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs

---

## Quick Fixes Checklist

- [ ] MongoDB is running
- [ ] Environment variables set correctly
- [ ] Migrations completed in order
- [ ] No duplicate indexes
- [ ] Users re-logged in after migration
- [ ] Tenant data in localStorage
- [ ] JWT tokens include tenantId
- [ ] All caches cleared
- [ ] TypeScript compiled successfully
- [ ] No TypeScript errors
