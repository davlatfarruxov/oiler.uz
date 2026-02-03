# MongoDB Schema Documentation

## Overview
This document describes the MongoDB schemas for the oil change service automation platform.

## Models

### 1. User
Authentication and authorization model for system users.

```typescript
{
  name: string;           // User's full name
  email: string;          // Unique email (indexed)
  password: string;       // Bcrypt hashed (12 rounds)
  role: UserRole;         // employee | admin | super_admin
  isActive: boolean;      // Account status
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

**Indexes:**
- `email` (unique)

**Methods:**
- `comparePassword(password: string): Promise<boolean>`

---

### 2. Customer
Customer information and vehicle ownership.

```typescript
{
  name: string;           // Customer's full name
  phone: string;          // Contact number (indexed)
  vehicles: ObjectId[];   // Reference to Vehicle[]
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `phone`
- `name`

**Relations:**
- Has many `Vehicle`

---

### 3. Employee
Employee records for service tracking.

```typescript
{
  name: string;           // Employee's full name
  role: UserRole;         // employee | admin | super_admin
  active: boolean;        // Employment status
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `active`
- `role`

---

### 4. Vehicle
Vehicle information linked to customers.

```typescript
{
  plateNumber: string;    // Unique plate number (indexed, uppercase)
  brand: string;          // Vehicle brand (e.g., Toyota)
  model: string;          // Vehicle model (e.g., Camry)
  engineType: EngineType; // petrol | diesel | hybrid | electric
  customer: ObjectId;     // Reference to Customer (indexed)
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `plateNumber` (unique) - Fast search by plate
- `customer`

**Relations:**
- Belongs to `Customer`

---

### 5. OilChange
Oil change service records.

```typescript
{
  vehicle: ObjectId;              // Reference to Vehicle (indexed)
  customer: ObjectId;             // Reference to Customer (indexed)
  employee: ObjectId;             // Reference to Employee (indexed)
  oilType: OilType;               // mineral | semi_synthetic | full_synthetic
  oilQuantity: number;            // Liters of oil used
  oilFilter: ObjectId;            // Reference to Inventory (filter)
  additionalProducts: [{          // Extra products used
    product: ObjectId;            // Reference to Inventory
    quantity: number;
    price: number;
  }];
  mileage: number;                // Vehicle mileage at service
  price: number;                  // Total service price
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `vehicle, createdAt` (compound) - Service history by vehicle
- `customer, createdAt` (compound) - Service history by customer
- `employee, createdAt` (compound) - Services by employee
- `createdAt` - Recent services

**Relations:**
- Belongs to `Vehicle`
- Belongs to `Customer`
- Belongs to `Employee`
- References `Inventory` (oil filter + additional products)

---

### 6. Inventory
Product inventory management.

```typescript
{
  productType: ProductType;  // oil | filter | other
  name: string;              // Product name
  stock: number;             // Current stock quantity
  reorderLevel: number;      // Minimum stock before reorder
  price: number;             // Product price
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:**
- `productType`
- `stock`
- `name`

**Virtuals:**
- `needsReorder: boolean` - Returns true if stock <= reorderLevel

---

## Enums

### UserRole
```typescript
enum UserRole {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}
```

### EngineType
```typescript
enum EngineType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric'
}
```

### OilType
```typescript
enum OilType {
  MINERAL = 'mineral',
  SEMI_SYNTHETIC = 'semi_synthetic',
  FULL_SYNTHETIC = 'full_synthetic'
}
```

### ProductType
```typescript
enum ProductType {
  OIL = 'oil',
  FILTER = 'filter',
  OTHER = 'other'
}
```

---

## Relationships

```
User (Authentication)
  └─ role: employee | admin | super_admin

Customer
  └─ vehicles[] → Vehicle[]

Employee
  └─ role: employee | admin | super_admin

Vehicle
  └─ customer → Customer

OilChange
  ├─ vehicle → Vehicle
  ├─ customer → Customer
  ├─ employee → Employee
  ├─ oilFilter → Inventory
  └─ additionalProducts[].product → Inventory

Inventory
  └─ productType: oil | filter | other
```

---

## Index Strategy

### Fast Lookups
- `Vehicle.plateNumber` - Primary vehicle search
- `Customer.phone` - Customer lookup by phone
- `User.email` - Authentication

### Service History
- `OilChange.vehicle + createdAt` - Vehicle service history
- `OilChange.customer + createdAt` - Customer service history
- `OilChange.employee + createdAt` - Employee performance

### Inventory Management
- `Inventory.productType` - Filter by product category
- `Inventory.stock` - Low stock alerts

---

## Best Practices

1. **Always use indexes** for frequently queried fields
2. **Populate references** when needed for complete data
3. **Use virtuals** for computed fields (e.g., needsReorder)
4. **Timestamps** are automatic with `{ timestamps: true }`
5. **Validation** is enforced at schema level
6. **Unique constraints** prevent duplicates (email, plateNumber)
