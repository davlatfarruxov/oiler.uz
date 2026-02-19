# Multi-Tenant Testing Plan

## Overview
Comprehensive testing plan for multi-tenant architecture implementation.

---

## Pre-Testing Setup

### 1. Backup Database
```bash
mongodump --db oiler_db --out ./backup/$(date +%Y%m%d)
```

### 2. Run Migrations
```bash
cd backend
npm run migrate:create-tenant
npm run migrate:users
npm run migrate:core-models
npm run migrate:remaining-models
```

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd front
npm run dev
```

---

## Test Suite 1: Authentication & Registration

### Test 1.1: New User Registration
**Objective:** Verify new tenant creation during registration

**Steps:**
1. Navigate to `/register`
2. Fill in personal information:
   - Name: "Test User"
   - Email: "test@newcompany.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Fill in company information:
   - Company Name: "Test Company"
   - Business Email: "info@testcompany.com"
   - Business Phone: "+998901234567"
   - Address: "Test Address"
4. Click "Create account"

**Expected Results:**
- ✓ Registration successful
- ✓ Redirected to dashboard
- ✓ Company name "Test Company" visible in sidebar
- ✓ Plan shows "Free" in sidebar
- ✓ User is logged in
- ✓ JWT token stored in localStorage
- ✓ Tenant data stored in localStorage

**Verification:**
```javascript
// Check localStorage
localStorage.getItem('accessToken') // Should exist
JSON.parse(localStorage.getItem('tenant')) // Should show Test Company

// Check database
db.tenants.findOne({ companyName: "Test Company" })
db.users.findOne({ email: "test@newcompany.com" })
```

---

### Test 1.2: Existing User Login
**Objective:** Verify existing users can login and see tenant data

**Steps:**
1. Navigate to `/login`
2. Enter existing user credentials
3. Click "Sign in"

**Expected Results:**
- ✓ Login successful
- ✓ Redirected to dashboard
- ✓ Company name visible in header
- ✓ Tenant data loaded

---

### Test 1.3: Duplicate Email in Different Tenants
**Objective:** Verify same email can exist in different tenants

**Steps:**
1. Logout
2. Register new user with email "admin@test.com" in "Company A"
3. Logout
4. Register new user with same email "admin@test.com" in "Company B"

**Expected Results:**
- ✓ Both registrations successful
- ✓ Two different users created
- ✓ Each belongs to different tenant
- ✓ No duplicate key error

---

## Test Suite 2: Data Isolation

### Test 2.1: Vehicle Data Isolation
**Objective:** Verify users only see their tenant's vehicles

**Setup:**
- Tenant A: Create vehicle with plate "01A123BC"
- Tenant B: Create vehicle with plate "01B456DE"

**Steps:**
1. Login as Tenant A user
2. Navigate to vehicles page
3. Note visible vehicles
4. Logout
5. Login as Tenant B user
6. Navigate to vehicles page

**Expected Results:**
- ✓ Tenant A sees only "01A123BC"
- ✓ Tenant B sees only "01B456DE"
- ✓ No cross-tenant data visible

---

### Test 2.2: Customer Data Isolation
**Objective:** Verify customer data is tenant-specific

**Steps:**
1. Login as Tenant A
2. Create customer with phone "+998901111111"
3. Logout
4. Login as Tenant B
5. Try to create customer with same phone "+998901111111"

**Expected Results:**
- ✓ Both customers created successfully
- ✓ Same phone number allowed in different tenants
- ✓ Each tenant sees only their customers

---

### Test 2.3: Employee Data Isolation
**Objective:** Verify employee data is tenant-specific

**Steps:**
1. Login as Tenant A
2. Create employee with email "mechanic@test.com"
3. Logout
4. Login as Tenant B
5. Create employee with same email "mechanic@test.com"

**Expected Results:**
- ✓ Both employees created successfully
- ✓ Same email allowed in different tenants
- ✓ Each tenant sees only their employees

---

### Test 2.4: Oil Products & Brands Isolation
**Objective:** Verify products and brands are tenant-specific

**Steps:**
1. Login as Tenant A
2. Create oil brand "Castrol"
3. Create oil product with this brand
4. Logout
5. Login as Tenant B
6. Create oil brand "Castrol" (same name)
7. Try to view products

**Expected Results:**
- ✓ Both tenants can create "Castrol" brand
- ✓ Each tenant sees only their brands
- ✓ Each tenant sees only their products

---

## Test Suite 3: Settings & Company Info

### Test 3.1: View Company Information
**Objective:** Verify settings page shows correct tenant data

**Steps:**
1. Login as any user
2. Navigate to Settings → Company tab

**Expected Results:**
- ✓ Company name displayed correctly
- ✓ Business email displayed correctly
- ✓ Business phone displayed correctly
- ✓ Address displayed correctly

---

### Test 3.2: Update Company Information
**Objective:** Verify company info can be updated

**Steps:**
1. Navigate to Settings → Company tab
2. Change company name to "Updated Company"
3. Change business email to "new@company.com"
4. Click "Save Changes"
5. Refresh page

**Expected Results:**
- ✓ Success message displayed
- ✓ Changes saved to database
- ✓ Sidebar shows updated company name
- ✓ Header shows updated company name
- ✓ Changes persist after refresh

---

### Test 3.3: View Subscription Information
**Objective:** Verify subscription tab shows correct limits

**Steps:**
1. Navigate to Settings → Subscription tab

**Expected Results:**
- ✓ Plan type displayed (Free/Premium/Enterprise)
- ✓ Max employees shown correctly
- ✓ Max vehicles shown correctly
- ✓ Status badge shows "Active"
- ✓ Expiration date shown (if applicable)

---

### Test 3.4: Exchange Rate Update
**Objective:** Verify exchange rate is tenant-specific

**Steps:**
1. Login as Tenant A
2. Set exchange rate to 12500
3. Logout
4. Login as Tenant B
5. Set exchange rate to 12600
6. Logout
7. Login as Tenant A again

**Expected Results:**
- ✓ Tenant A sees 12500
- ✓ Tenant B sees 12600
- ✓ Each tenant has independent exchange rate

---

## Test Suite 4: CRUD Operations

### Test 4.1: Create Operations
**Objective:** Verify all create operations include tenant

**Test each:**
- Create Vehicle
- Create Customer
- Create Employee
- Create Oil Product
- Create Oil Brand
- Create Filter
- Create Filter Brand
- Create Inventory Item

**Expected Results:**
- ✓ All records created successfully
- ✓ All records have tenantId in database
- ✓ Records visible only to creating tenant

---

### Test 4.2: Read Operations
**Objective:** Verify all read operations filter by tenant

**Test each:**
- List Vehicles
- List Customers
- List Employees
- List Oil Products
- List Oil Brands
- List Filters
- List Filter Brands
- List Inventory Items

**Expected Results:**
- ✓ Only tenant's data returned
- ✓ No cross-tenant data visible
- ✓ Counts are tenant-specific

---

### Test 4.3: Update Operations
**Objective:** Verify updates only affect tenant's data

**Steps:**
1. Login as Tenant A
2. Create vehicle with plate "01A111AA"
3. Note vehicle ID
4. Logout
5. Login as Tenant B
6. Try to update vehicle using Tenant A's vehicle ID

**Expected Results:**
- ✓ Update fails with 404 error
- ✓ Tenant A's vehicle unchanged
- ✓ No cross-tenant updates possible

---

### Test 4.4: Delete Operations
**Objective:** Verify deletes only affect tenant's data

**Steps:**
1. Login as Tenant A
2. Create customer
3. Note customer ID
4. Logout
5. Login as Tenant B
6. Try to delete customer using Tenant A's customer ID

**Expected Results:**
- ✓ Delete fails with 404 error
- ✓ Tenant A's customer still exists
- ✓ No cross-tenant deletes possible

---

## Test Suite 5: Security & Access Control

### Test 5.1: JWT Token Validation
**Objective:** Verify JWT tokens include tenant information

**Steps:**
1. Login as any user
2. Copy JWT token from localStorage
3. Decode token at jwt.io

**Expected Results:**
- ✓ Token includes `tenantId`
- ✓ Token includes `isTenantOwner`
- ✓ Token includes user `id`, `email`, `role`

---

### Test 5.2: Tenant Deactivation
**Objective:** Verify deactivated tenants cannot access system

**Steps:**
1. In database, set tenant isActive to false:
   ```javascript
   db.tenants.updateOne(
     { _id: ObjectId("tenant-id") },
     { $set: { isActive: false } }
   )
   ```
2. Try to login as user from that tenant
3. Or try to make API request with existing token

**Expected Results:**
- ✓ Login fails or API returns 403
- ✓ Error message: "Tenant account is not active"
- ✓ User cannot access any resources

---

### Test 5.3: Subscription Expiration
**Objective:** Verify expired subscriptions are blocked

**Steps:**
1. In database, set tenant expiresAt to past date:
   ```javascript
   db.tenants.updateOne(
     { _id: ObjectId("tenant-id") },
     { $set: { expiresAt: new Date("2023-01-01") } }
   )
   ```
2. Try to make API request

**Expected Results:**
- ✓ API returns 403
- ✓ Error message: "Subscription has expired"
- ✓ User cannot access resources

---

## Test Suite 6: Edge Cases

### Test 6.1: Missing Tenant ID
**Objective:** Verify system handles missing tenantId gracefully

**Steps:**
1. Manually remove tenantId from JWT token
2. Try to make API request

**Expected Results:**
- ✓ Request fails with appropriate error
- ✓ No data returned
- ✓ System doesn't crash

---

### Test 6.2: Invalid Tenant ID
**Objective:** Verify system handles invalid tenantId

**Steps:**
1. Manually change tenantId in JWT to invalid ID
2. Try to make API request

**Expected Results:**
- ✓ Request fails
- ✓ No data returned
- ✓ Appropriate error message

---

### Test 6.3: Concurrent Tenant Operations
**Objective:** Verify multiple tenants can operate simultaneously

**Steps:**
1. Open two browser windows
2. Login as Tenant A in window 1
3. Login as Tenant B in window 2
4. Perform operations in both windows simultaneously

**Expected Results:**
- ✓ Both tenants can work independently
- ✓ No data conflicts
- ✓ No cross-tenant interference

---

## Test Suite 7: Performance

### Test 7.1: Query Performance
**Objective:** Verify tenant filtering doesn't impact performance

**Steps:**
1. Create 1000 vehicles across 10 tenants
2. Login as one tenant
3. Measure time to load vehicles list

**Expected Results:**
- ✓ Query completes in reasonable time (<1s)
- ✓ Only tenant's vehicles returned
- ✓ Indexes are being used

**Verification:**
```javascript
// Check query plan
db.vehicles.find({ tenant: ObjectId("tenant-id") }).explain("executionStats")
// Should show index usage
```

---

## Test Suite 8: Migration Verification

### Test 8.1: Existing Data Migration
**Objective:** Verify all existing data migrated correctly

**Steps:**
1. Check database for default tenant
2. Verify all users have tenantId
3. Verify all vehicles have tenantId
4. Verify all customers have tenantId

**Verification:**
```javascript
// Count records without tenant
db.users.countDocuments({ tenant: { $exists: false } }) // Should be 0
db.vehicles.countDocuments({ tenant: { $exists: false } }) // Should be 0
db.customers.countDocuments({ tenant: { $exists: false } }) // Should be 0

// Verify indexes
db.users.getIndexes()
db.vehicles.getIndexes()
db.customers.getIndexes()
```

---

## Test Results Template

```markdown
## Test Execution Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Dev/Staging/Production]

### Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

### Failed Tests
1. Test Name: [Name]
   - Expected: [Expected result]
   - Actual: [Actual result]
   - Error: [Error message]
   - Screenshot: [Link]

### Notes
- [Any additional observations]
- [Performance issues]
- [Suggestions]

### Sign-off
- [ ] All critical tests passed
- [ ] No data leakage detected
- [ ] Performance acceptable
- [ ] Ready for production
```

---

## Automated Testing (Future)

Consider implementing:
1. Unit tests for service layer
2. Integration tests for API endpoints
3. E2E tests for critical flows
4. Load tests for performance
5. Security tests for access control

---

## Rollback Criteria

Rollback if:
- [ ] Data leakage detected between tenants
- [ ] Critical functionality broken
- [ ] Performance degradation >50%
- [ ] Security vulnerabilities found
- [ ] Migration cannot be completed

---

## Sign-off Checklist

- [ ] All test suites completed
- [ ] No critical issues found
- [ ] Data isolation verified
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team trained on changes
- [ ] Rollback plan tested
- [ ] Production deployment approved
