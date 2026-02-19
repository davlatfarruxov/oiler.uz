# API Changes - Multi-Tenant Architecture

## Overview
This document outlines all API changes made during the multi-tenant migration.

---

## Authentication Endpoints

### POST `/api/auth/register`

**CHANGED**: Now requires company information

**Old Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**New Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "companyName": "Acme Oil Change",
  "businessEmail": "info@acme.com",
  "businessPhone": "+998901234567",
  "address": "123 Main St, Tashkent" // optional
}
```

**New Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "tenantId": "tenant-id",
      "isTenantOwner": true
    },
    "tenant": {
      "id": "tenant-id",
      "companyName": "Acme Oil Change",
      "businessEmail": "info@acme.com",
      "businessPhone": "+998901234567",
      "address": "123 Main St, Tashkent",
      "plan": "free",
      "isActive": true,
      "maxEmployees": 5,
      "maxVehicles": 100
    },
    "accessToken": "jwt-token"
  }
}
```

**Changes:**
- Creates new tenant automatically
- User becomes tenant owner
- Returns tenant information
- JWT token includes tenantId and isTenantOwner

---

### POST `/api/auth/login`

**CHANGED**: Now returns tenant information

**Request:** (No change)
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**New Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "tenantId": "tenant-id",
      "isTenantOwner": true
    },
    "tenant": {
      "id": "tenant-id",
      "companyName": "Acme Oil Change",
      "businessEmail": "info@acme.com",
      "businessPhone": "+998901234567",
      "plan": "free",
      "isActive": true
    },
    "accessToken": "jwt-token"
  }
}
```

**Changes:**
- Returns tenant information
- JWT token includes tenantId and isTenantOwner

---

### GET `/api/auth/profile`

**CHANGED**: Now returns tenant information

**New Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "tenantId": "tenant-id",
    "isTenantOwner": true,
    "tenant": {
      "id": "tenant-id",
      "companyName": "Acme Oil Change",
      "businessEmail": "info@acme.com",
      "businessPhone": "+998901234567",
      "plan": "free",
      "isActive": true
    }
  }
}
```

---

## Data Isolation

### All Resource Endpoints

**CHANGED**: All endpoints now automatically filter by tenant

All endpoints that return data now only return data belonging to the authenticated user's tenant:

- `GET /api/vehicles` - Only returns tenant's vehicles
- `GET /api/customers` - Only returns tenant's customers
- `GET /api/employees` - Only returns tenant's employees
- `GET /api/oil-changes` - Only returns tenant's oil changes
- `GET /api/oil-products` - Only returns tenant's products
- `GET /api/oil-brands` - Only returns tenant's brands
- `GET /api/filters` - Only returns tenant's filters
- `GET /api/filter-brands` - Only returns tenant's filter brands
- `GET /api/inventory` - Only returns tenant's inventory

**Implementation:**
- TenantId extracted from JWT token
- All queries automatically include `{ tenant: tenantId }` filter
- No changes required in request/response format
- Cross-tenant data access is prevented

---

## Settings Endpoints

### GET `/api/settings`

**CHANGED**: Returns tenant-specific settings

**New Response:**
```json
{
  "success": true,
  "data": {
    "id": "settings-id",
    "tenant": "tenant-id",
    "companyName": "Acme Oil Change",
    "businessEmail": "info@acme.com",
    "businessPhone": "+998901234567",
    "address": "123 Main St",
    "exchangeRate": 12500,
    "defaultOilType": "5W-30",
    "serviceIntervalKm": 5000,
    "serviceIntervalMonths": 6
  }
}
```

---

### PUT `/api/settings/company-info`

**NEW**: Update company information

**Request:**
```json
{
  "companyName": "New Company Name",
  "businessEmail": "new@company.com",
  "businessPhone": "+998901234567",
  "address": "New Address"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company information updated",
  "data": {
    // Updated settings object
  }
}
```

---

### PUT `/api/settings/exchange-rate`

**CHANGED**: Now tenant-specific

**Request:**
```json
{
  "exchangeRate": 12600
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exchange rate updated",
  "data": {
    // Updated settings object
  }
}
```

---

## Unique Constraints

### Email Uniqueness

**CHANGED**: Email is now unique per tenant

**Old Behavior:**
- Email must be globally unique
- `john@example.com` can only exist once

**New Behavior:**
- Email must be unique within tenant
- `john@example.com` can exist in multiple tenants
- Same email in different tenants = different users

---

### Phone Number Uniqueness

**CHANGED**: Phone is now unique per tenant

**Old Behavior:**
- Phone must be globally unique in customers

**New Behavior:**
- Phone must be unique within tenant
- Same phone can exist in different tenants

---

### Plate Number Uniqueness

**CHANGED**: Plate number is now unique per tenant

**Old Behavior:**
- Plate number must be globally unique

**New Behavior:**
- Plate number must be unique within tenant
- Same plate can exist in different tenants

---

### Brand Name Uniqueness

**CHANGED**: Brand names are now unique per tenant

**Old Behavior:**
- Brand names must be globally unique

**New Behavior:**
- Brand names must be unique within tenant
- Same brand name can exist in different tenants

---

## JWT Token Changes

### Token Payload

**CHANGED**: JWT now includes tenant information

**Old Payload:**
```json
{
  "id": "user-id",
  "email": "john@example.com",
  "role": "admin"
}
```

**New Payload:**
```json
{
  "id": "user-id",
  "email": "john@example.com",
  "role": "admin",
  "tenantId": "tenant-id",
  "isTenantOwner": true
}
```

**Important:**
- Existing tokens will not have tenantId
- Users must login again after migration
- Frontend should handle missing tenantId gracefully

---

## Error Responses

### New Error: Tenant Not Active

**Status Code:** 403 Forbidden

**Response:**
```json
{
  "success": false,
  "message": "Tenant account is not active"
}
```

**When:** User's tenant is deactivated

---

### New Error: Subscription Expired

**Status Code:** 403 Forbidden

**Response:**
```json
{
  "success": false,
  "message": "Subscription has expired"
}
```

**When:** Tenant's subscription has expired

---

### New Error: Resource Not Found (Tenant Mismatch)

**Status Code:** 404 Not Found

**Response:**
```json
{
  "success": false,
  "message": "Vehicle not found"
}
```

**When:** Resource exists but belongs to different tenant

**Note:** Returns 404 instead of 403 to prevent information leakage

---

## Breaking Changes Summary

1. **Registration**: Now requires company information
2. **Login/Register Response**: Now includes tenant object
3. **JWT Token**: Now includes tenantId and isTenantOwner
4. **Data Queries**: Automatically filtered by tenant
5. **Unique Constraints**: Now scoped to tenant
6. **Settings**: Now tenant-specific
7. **Existing Tokens**: Invalid after migration (users must re-login)

---

## Migration Impact

### Frontend Changes Required

1. Update registration form to collect company info
2. Store tenant data in state/localStorage
3. Display company name in UI
4. Handle tenant context throughout app
5. Update settings page to show/edit company info

### Backend Changes Required

1. All service methods now require tenantId parameter
2. All queries must include tenant filter
3. Controllers extract tenantId from req.user
4. Middleware validates tenant is active
5. Settings are tenant-specific

---

## Testing Checklist

- [ ] Register new user with company info
- [ ] Login returns tenant data
- [ ] JWT token includes tenantId
- [ ] Data queries filtered by tenant
- [ ] Cannot access other tenant's data
- [ ] Settings are tenant-specific
- [ ] Company info can be updated
- [ ] Unique constraints work per-tenant
- [ ] Tenant deactivation prevents access
- [ ] Subscription expiration handled

---

## Backward Compatibility

**NOT BACKWARD COMPATIBLE**

This is a breaking change that requires:
1. Database migration
2. Frontend updates
3. Users to re-login
4. API clients to handle new response format

---

## Support

For questions or issues:
1. Review `MIGRATION_GUIDE.md` for migration steps
2. Check `MULTI_TENANT_MIGRATION.md` for implementation details
3. Test API endpoints with Postman/curl
4. Verify JWT token payload
5. Check database for tenant data
