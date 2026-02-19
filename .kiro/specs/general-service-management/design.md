# Design Document: General Service Management

## Overview

This design extends the existing oil change management system with a flexible general service management capability. The system allows recording any type of automotive service (brake repairs, tire changes, diagnostics, etc.) with service items that can be sourced from a universal inventory or manually entered. The design maintains backward compatibility with existing oil change functionality while providing a unified service history view.

### Key Design Principles

1. **Separation of Concerns**: Services and oil changes remain separate entities with distinct models
2. **Unified Interface**: Frontend presents a unified service history combining both types
3. **Reusable Components**: Leverage existing payment tracking, archive system, and UI components
4. **Multi-Tenant Isolation**: All queries and operations enforce tenant boundaries
5. **Flexible Data Entry**: Support both inventory-based and manual item entry

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Vehicle Detail Page                                         │
│  ├─ Add Service Dialog                                       │
│  ├─ Unified Service History (Oil Changes + Services)         │
│  └─ Payment Recording Dialog (shared)                        │
├─────────────────────────────────────────────────────────────┤
│  Dashboard                                                    │
│  ├─ Recent Services Table (both types)                       │
│  └─ Debt Summary (both types)                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Service Controller                                          │
│  ├─ Create Service                                           │
│  ├─ Update Service                                           │
│  ├─ List Services                                            │
│  ├─ Archive Service                                          │
│  └─ Get Service History                                      │
├─────────────────────────────────────────────────────────────┤
│  Vehicle Controller (extended)                               │
│  └─ Get Unified History (Oil Changes + Services)             │
├─────────────────────────────────────────────────────────────┤
│  Payment Controller (extended)                               │
│  └─ Support Service payments                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Service Service                                             │
│  ├─ Business logic for service operations                    │
│  ├─ Validation and calculations                              │
│  └─ Archive integration                                      │
├─────────────────────────────────────────────────────────────┤
│  Payment Service (extended)                                  │
│  ├─ Support both OilChange and Service references            │
│  └─ Unified debt calculation                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Service Model (new)                                         │
│  OilChange Model (existing, unchanged)                       │
│  Universal Inventory Model (new)                             │
│  Payment Model (extended)                                    │
│  Archive Model (extended)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Service Creation Flow:**
```
User fills form → Validate inputs → Calculate totals → Create Service record
                                                      ↓
                                    Create Archive entry (created action)
                                                      ↓
                                    Update inventory stock (if applicable)
                                                      ↓
                                    Return created service
```

**Payment Recording Flow:**
```
User records payment → Validate service exists → Create Payment record
                                                ↓
                              Update Service payment fields
                                                ↓
                              Update Customer debt (both types)
                                                ↓
                              Create Archive entry (updated action)
```

**Unified History Retrieval:**
```
Request vehicle history → Query OilChanges → Query Services
                                           ↓
                        Merge and sort by date
                                           ↓
                        Add type indicators
                                           ↓
                        Return unified list
```

## Components and Interfaces

### Backend Models

#### Service Model

```typescript
interface IServiceItem {
  itemName: string;
  itemType: 'inventory' | 'custom';
  inventoryId?: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface IServiceDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  serviceName: string;
  serviceItems: IServiceItem[];
  laborCost: number;
  totalPrice: number;
  employees: mongoose.Types.ObjectId[];
  mileage?: number;
  notes?: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  amountDue: number;
  dueDate?: Date;
  paidAt?: Date;
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema Definition:**
- Indexes: tenant, vehicle, customer, createdAt, paymentStatus, dueDate
- Compound indexes: (tenant, createdAt), (tenant, vehicle, createdAt), (tenant, customer, createdAt)
- Validation: serviceName required, serviceItems array, totalPrice >= 0
- Pre-save hook: Calculate totalPrice from serviceItems and laborCost

#### Universal Inventory Model

```typescript
interface IUniversalInventoryDocument extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  partNumber?: string;
  brand?: string;
  category: string;
  price: number;
  stock: number;
  unit: string; // 'piece', 'liter', 'kg', etc.
  description?: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema Definition:**
- Indexes: tenant, category, name, stock
- Compound indexes: (tenant, category), (tenant, stock)
- Virtual: needsReorder (stock <= reorderLevel)

#### Payment Model Extension

```typescript
interface IPayment extends Document {
  tenant: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  // Support both oil changes and services
  oilChange?: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId;
  serviceType: 'oilChange' | 'service'; // Discriminator field
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation:**
- Exactly one of oilChange or service must be set
- serviceType must match the reference type

#### Archive Model Extension

Update entityType enum to include 'Service':
```typescript
entityType: 'Vehicle' | 'OilChange' | 'Service'
```

### Backend Services

#### ServiceService Class

```typescript
class ServiceService {
  // Create new service
  async createService(tenantId: string, data: CreateServiceData, userId: string): Promise<IServiceDocument>
  
  // Update existing service
  async updateService(tenantId: string, serviceId: string, data: UpdateServiceData, userId: string): Promise<IServiceDocument>
  
  // Get service by ID
  async getServiceById(tenantId: string, serviceId: string): Promise<IServiceDocument>
  
  // List services with filters
  async listServices(tenantId: string, filters: ServiceFilters): Promise<IServiceDocument[]>
  
  // Archive service
  async archiveService(tenantId: string, serviceId: string, userId: string, reason?: string): Promise<void>
  
  // Get service archive history
  async getServiceHistory(tenantId: string, serviceId: string): Promise<IArchiveDocument[]>
  
  // Calculate service total price
  private calculateTotalPrice(serviceItems: IServiceItem[], laborCost: number): number
  
  // Validate service items
  private async validateServiceItems(tenantId: string, serviceItems: IServiceItem[]): Promise<void>
  
  // Update inventory stock
  private async updateInventoryStock(tenantId: string, serviceItems: IServiceItem[]): Promise<void>
}
```

**Key Methods:**

**createService:**
1. Validate all required fields
2. Validate service items (inventory existence, quantities)
3. Calculate item totals and service total price
4. Create service record
5. Update inventory stock for inventory items
6. Create archive entry with 'created' action
7. Return populated service

**updateService:**
1. Fetch existing service
2. Calculate field-level changes
3. Validate new service items
4. Update service record
5. Adjust inventory stock (revert old, apply new)
6. Create archive entry with 'updated' action and changes
7. Return updated service

**archiveService:**
1. Fetch service
2. Set isArchived = true, archivedAt, archivedBy
3. Create archive entry with 'archived' action
4. Save service

#### PaymentService Extension

Extend existing PaymentService to support services:

```typescript
class PaymentService {
  // Extended to support both oil changes and services
  async recordPayment(
    tenantId: string,
    data: RecordPaymentData,
    userId: string
  ): Promise<IPayment>
  
  // Calculate customer debt from both sources
  async calculateCustomerDebt(tenantId: string, customerId: string): Promise<number>
  
  // Get unified payment history
  async getCustomerPaymentHistory(tenantId: string, customerId: string): Promise<any[]>
}
```

**recordPayment Extension:**
- Accept serviceType parameter ('oilChange' | 'service')
- Query appropriate model based on serviceType
- Update payment fields on correct entity
- Create payment record with correct reference

**calculateCustomerDebt Extension:**
- Aggregate amountDue from OilChange collection
- Aggregate amountDue from Service collection
- Sum both amounts
- Return total debt

#### VehicleService Extension

Add method to get unified service history:

```typescript
class VehicleService {
  async getVehicleHistory(tenantId: string, vehicleId: string): Promise<UnifiedHistoryItem[]>
}
```

**getVehicleHistory:**
1. Query all oil changes for vehicle
2. Query all services for vehicle
3. Map oil changes to unified format with type: 'oilChange'
4. Map services to unified format with type: 'service'
5. Merge arrays
6. Sort by createdAt descending
7. Return unified array

### Backend Controllers

#### ServiceController

```typescript
class ServiceController {
  // POST /services
  async createService(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // GET /services
  async listServices(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // GET /services/:id
  async getService(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // PUT /services/:id
  async updateService(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // DELETE /services/:id
  async deleteService(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // POST /services/:id/archive
  async archiveService(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
  
  // GET /services/:id/archive-history
  async getServiceHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
}
```

#### VehicleController Extension

Add endpoint:
```typescript
// GET /vehicles/:id/history
async getVehicleHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>
```

### Frontend Components

#### AddServiceDialog Component

```typescript
interface AddServiceDialogProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  customerId: string;
  onSuccess: () => void;
}

interface ServiceItemForm {
  itemName: string;
  itemType: 'inventory' | 'custom';
  inventoryId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ServiceFormData {
  serviceName: string;
  serviceItems: ServiceItemForm[];
  laborCost: number;
  employees: string[];
  mileage?: number;
  notes?: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountPaid: number;
  dueDate?: Date;
}
```

**Component Structure:**
- Service name text input
- Service items section:
  - List of service item forms
  - Each item has:
    - Checkbox: "Select from inventory"
    - If checked: Inventory dropdown (filtered by tenant)
    - If unchecked: Manual entry fields (name, price)
    - Quantity input
    - Unit price (auto-filled from inventory or manual)
    - Total price (calculated, read-only)
    - Remove button
  - "Add Item" button
- Labor cost number input
- Employee multi-select (checkboxes)
- Mileage input (optional)
- Notes textarea (optional)
- PaymentStatusSelector component (reused)
- Total price display (calculated, read-only)
- Submit and Cancel buttons

**Calculations:**
- Item total = quantity × unitPrice
- Service total = sum(item totals) + laborCost
- Amount due = service total - amountPaid

**Validation:**
- Service name required
- At least one service item OR laborCost > 0
- All item quantities > 0
- All item prices >= 0
- If inventory selected, inventoryId required
- If custom, itemName required

#### UnifiedServiceHistory Component

```typescript
interface UnifiedHistoryItem {
  id: string;
  type: 'oilChange' | 'service';
  date: Date;
  serviceName?: string; // For services
  items: string[]; // Item descriptions
  price: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  amountDue: number;
  employees: string[];
  mileage?: number;
}

interface UnifiedServiceHistoryProps {
  vehicleId: string;
  onEdit: (id: string, type: 'oilChange' | 'service') => void;
  onDelete: (id: string, type: 'oilChange' | 'service') => void;
  onPrint: (id: string, type: 'oilChange' | 'service') => void;
  onViewHistory: (id: string, type: 'oilChange' | 'service') => void;
}
```

**Display:**
- Table or list view
- Columns: Type Badge, Date, Service/Items, Price, Payment Status, Actions
- Type badge: [Oil Change] or [Service]
- For services: Show service name
- Items: Show list of items used
- Sort by date descending
- Action buttons: Edit, Delete, Print, View History

#### Dashboard Extensions

**Recent Services Table:**
- Add "Type" column
- Show both oil changes and services
- Display service name for services
- Maintain existing columns: Date, Customer, Vehicle, Price, Payment Status

**Debt Summary:**
- Calculate total debt from both oil changes and services
- Show breakdown by type (optional)

## Data Models

### Service Model Schema

```typescript
const serviceItemSchema = new Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    enum: ['inventory', 'custom'],
    required: true
  },
  inventoryId: {
    type: Schema.Types.ObjectId,
    ref: 'UniversalInventory',
    required: function() {
      return this.itemType === 'inventory';
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const serviceSchema = new Schema<IServiceDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    serviceItems: {
      type: [serviceItemSchema],
      required: true,
      validate: {
        validator: function(items: IServiceItem[]) {
          return items.length > 0 || this.laborCost > 0;
        },
        message: 'Service must have at least one item or labor cost'
      }
    },
    laborCost: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    employees: [{
      type: Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    mileage: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
      index: true
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      index: true
    },
    paidAt: {
      type: Date
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: Date,
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
serviceSchema.index({ tenant: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, vehicle: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, customer: 1, createdAt: -1 });
serviceSchema.index({ tenant: 1, paymentStatus: 1 });
serviceSchema.index({ tenant: 1, dueDate: 1, paymentStatus: 1 });

// Pre-save hook to calculate totalPrice
serviceSchema.pre('save', function(next) {
  const itemsTotal = this.serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalPrice = itemsTotal + this.laborCost;
  this.amountDue = this.totalPrice - this.amountPaid;
  next();
});
```

### Universal Inventory Schema

```typescript
const universalInventorySchema = new Schema<IUniversalInventoryDocument>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    partNumber: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['piece', 'liter', 'kg', 'meter', 'set', 'pair', 'box'],
      default: 'piece'
    },
    description: {
      type: String,
      trim: true
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    }
  },
  {
    timestamps: true
  }
);

// Indexes
universalInventorySchema.index({ tenant: 1, category: 1 });
universalInventorySchema.index({ tenant: 1, name: 'text' });
universalInventorySchema.index({ tenant: 1, stock: 1 });

// Virtual
universalInventorySchema.virtual('needsReorder').get(function() {
  return this.stock <= this.reorderLevel;
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I'll analyze the acceptance criteria to determine which are testable as properties:


### Property 1: Service Total Price Calculation
*For any* service with service items and labor cost, the total price should equal the sum of all service item total prices plus the labor cost.
**Validates: Requirements 1.7, 3.14**

### Property 2: Service Item Structure Validation
*For any* service item, if it is from inventory then it must include inventoryId, itemType='inventory', itemName, quantity, unitPrice, and totalPrice; if it is custom then it must include itemType='custom', itemName, quantity, unitPrice, and totalPrice.
**Validates: Requirements 1.2, 1.3**

### Property 3: Service Item Total Calculation
*For any* service item, the total price should equal quantity multiplied by unit price.
**Validates: Requirements 10.5**

### Property 4: Unified Service History Composition
*For any* vehicle, retrieving the service history should return a list containing both oil changes and services, sorted by date with newest first, where each item includes a type indicator.
**Validates: Requirements 4.1, 4.6, 7.6**

### Property 5: Service History Display Completeness
*For any* service in the history display, the rendered output should include the service name, all service items, price, date, and payment status.
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 6: Customer Debt Calculation
*For any* customer, the total debt should equal the sum of all unpaid amounts from oil changes plus the sum of all unpaid amounts from services.
**Validates: Requirements 5.4, 6.2**

### Property 7: Dashboard Service Display
*For any* dashboard recent services query, the result should include both oil changes and services, where each item has a type field and payment status field.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 8: Payment History Unification
*For any* customer, the payment history should include payment records for both oil changes and services.
**Validates: Requirements 6.3**

### Property 9: Payment Recording Updates Service
*For any* service, when a payment is recorded, the service's amountPaid should increase by the payment amount, amountDue should decrease by the payment amount, and paymentStatus should update to reflect the new state.
**Validates: Requirements 6.5**

### Property 10: Service Filtering by Tenant
*For any* tenant, querying services should only return services that belong to that tenant, never services from other tenants.
**Validates: Requirements 7.2, 7.10**

### Property 11: Inventory Item Tenant Validation
*For any* service item from inventory, the inventory item must exist and belong to the same tenant as the service.
**Validates: Requirements 10.1**

### Property 12: Service Item Validation
*For any* service item, quantity must be positive, unit price must be non-negative, and if custom then itemName must be non-empty.
**Validates: Requirements 10.2, 10.3, 10.4**

### Property 13: Service Requires Content
*For any* service submission, it must have at least one service item OR a labor cost greater than zero.
**Validates: Requirements 10.6**

### Property 14: Service Name Required
*For any* service creation, the service name must be a non-empty string.
**Validates: Requirements 3.2**

### Property 15: Inventory Dropdown Tenant Filtering
*For any* tenant, the inventory dropdown should only display inventory items that belong to that tenant.
**Validates: Requirements 3.4**

### Property 16: Service Item Display Completeness
*For any* service item in the dialog, the display should show itemName, quantity, unitPrice, and calculated totalPrice.
**Validates: Requirements 3.7**

### Property 17: Total Price Auto-Calculation in UI
*For any* service form state, when service items or labor cost change, the displayed total price should automatically update to reflect the new sum.
**Validates: Requirements 3.13**

### Property 18: Service Creation Archive Entry
*For any* service creation, an archive entry with action='created' should be created containing the full service snapshot and the user who created it.
**Validates: Requirements 8.1, 8.4**

### Property 19: Service Update Archive Entry
*For any* service update, an archive entry with action='updated' should be created containing field-level changes, the user who updated it, and a timestamp.
**Validates: Requirements 8.2, 8.4, 8.5**

### Property 20: Service Archive Action Entry
*For any* service archival, an archive entry with action='archived' should be created containing the user who archived it and a timestamp.
**Validates: Requirements 8.3, 8.4, 8.5**

### Property 21: Archive History Chronological Order
*For any* service, retrieving its archive history should return all archive entries sorted by timestamp in chronological order.
**Validates: Requirements 8.6**

### Property 22: Input Validation Rejection
*For any* service creation or update with invalid data (missing required fields, wrong types, negative values where not allowed), the operation should be rejected with a descriptive error.
**Validates: Requirements 7.9**

## Error Handling

### Validation Errors

**Service Creation/Update:**
- Missing required fields → 400 Bad Request with field-specific error messages
- Invalid service item structure → 400 Bad Request
- Inventory item not found → 404 Not Found
- Inventory item belongs to different tenant → 403 Forbidden
- Negative or zero quantity → 400 Bad Request
- Negative unit price → 400 Bad Request
- Empty service (no items and no labor cost) → 400 Bad Request
- Service name empty or missing → 400 Bad Request

**Payment Recording:**
- Service not found → 404 Not Found
- Payment amount exceeds amount due → 400 Bad Request
- Payment amount <= 0 → 400 Bad Request
- Service belongs to different tenant → 403 Forbidden

**Archive Operations:**
- Service not found → 404 Not Found
- Service already archived → 400 Bad Request
- User not authorized → 403 Forbidden

### Multi-Tenant Isolation Errors

All operations must validate tenant ownership:
- Service access from different tenant → 404 Not Found (not 403, to avoid information leakage)
- Inventory access from different tenant → 404 Not Found
- Cross-tenant references in service items → 400 Bad Request

### Database Errors

- Connection failures → 503 Service Unavailable
- Validation errors → 400 Bad Request
- Duplicate key errors → 409 Conflict
- Transaction failures → 500 Internal Server Error with rollback

### Inventory Stock Errors

- Insufficient stock → 400 Bad Request with available quantity
- Stock update failures → 500 Internal Server Error with rollback

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of service creation with known inputs
- Edge cases (empty service items, zero labor cost, boundary values)
- Error conditions (missing fields, invalid references, cross-tenant access)
- Integration points (payment recording, archive creation, inventory updates)
- API endpoint responses and status codes

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (calculations, validations, data integrity)
- Comprehensive input coverage through randomization
- Invariants that must hold across all operations

Both approaches are complementary and necessary. Unit tests catch concrete bugs and validate specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:**
- TypeScript/JavaScript: Use `fast-check` library
- Minimum 100 iterations per property test (due to randomization)

**Test Tagging:**
Each property test must include a comment referencing the design property:
```typescript
// Feature: general-service-management, Property 1: Service Total Price Calculation
```

**Property Test Implementation:**
- Each correctness property listed above must be implemented as a SINGLE property-based test
- Tests should generate random valid inputs within the domain
- Tests should verify the property holds for all generated inputs
- Tests should use appropriate generators (positive numbers, non-empty strings, valid ObjectIds, etc.)

### Test Coverage Requirements

**Backend Unit Tests:**
- Service model validation
- Service creation with inventory items
- Service creation with custom items
- Service creation with mixed items
- Total price calculation
- Payment status updates
- Archive entry creation
- Multi-tenant isolation
- Error handling for all validation rules

**Backend Property Tests:**
- Property 1: Total price calculation
- Property 2: Service item structure
- Property 3: Item total calculation
- Property 6: Customer debt calculation
- Property 9: Payment recording updates
- Property 10: Tenant filtering
- Property 11: Inventory tenant validation
- Property 12: Service item validation
- Property 13: Service requires content
- Property 14: Service name required
- Property 18-21: Archive entries
- Property 22: Input validation rejection

**Frontend Unit Tests:**
- AddServiceDialog rendering
- Service item addition/removal
- Inventory selection vs manual entry toggle
- Total price display updates
- Form validation
- Submission handling
- UnifiedServiceHistory rendering
- Type badge display
- Action button functionality

**Frontend Property Tests:**
- Property 15: Inventory dropdown filtering
- Property 16: Service item display
- Property 17: Total price auto-calculation

**Integration Tests:**
- End-to-end service creation flow
- Payment recording for services
- Unified history retrieval
- Dashboard data aggregation
- Archive history retrieval

### Migration Testing

**Data Migration Validation:**
- Verify all existing oil products migrated to universal inventory
- Verify all existing filters migrated to universal inventory
- Verify no data loss during migration
- Verify backward compatibility with existing oil change records
- Verify existing API endpoints continue to work

## API Endpoints

### Service Endpoints

**POST /services**
- Create new service
- Request body: CreateServiceData
- Response: 201 Created with service object
- Errors: 400 (validation), 403 (forbidden), 404 (not found)

**GET /services**
- List services with optional filters
- Query params: vehicleId, customerId, paymentStatus, startDate, endDate
- Response: 200 OK with array of services
- Errors: 400 (invalid params)

**GET /services/:id**
- Get service by ID
- Response: 200 OK with service object (populated references)
- Errors: 404 (not found)

**PUT /services/:id**
- Update service
- Request body: UpdateServiceData
- Response: 200 OK with updated service
- Errors: 400 (validation), 404 (not found)

**DELETE /services/:id**
- Soft delete (archive) service
- Response: 204 No Content
- Errors: 404 (not found), 400 (already archived)

**POST /services/:id/archive**
- Manually archive service with reason
- Request body: { reason?: string }
- Response: 200 OK
- Errors: 404 (not found), 400 (already archived)

**GET /services/:id/archive-history**
- Get service archive history
- Response: 200 OK with array of archive entries
- Errors: 404 (not found)

### Vehicle Endpoints (Extended)

**GET /vehicles/:id/history**
- Get unified service history (oil changes + services)
- Response: 200 OK with array of unified history items
- Errors: 404 (vehicle not found)

### Payment Endpoints (Extended)

**POST /payments**
- Record payment for oil change or service
- Request body: { serviceType: 'oilChange' | 'service', serviceId, amount, ... }
- Response: 201 Created with payment object
- Errors: 400 (validation), 404 (not found)

### Universal Inventory Endpoints

**GET /inventory**
- List inventory items
- Query params: category, search
- Response: 200 OK with array of inventory items
- Errors: 400 (invalid params)

**POST /inventory**
- Create inventory item
- Request body: CreateInventoryData
- Response: 201 Created with inventory object
- Errors: 400 (validation)

**PUT /inventory/:id**
- Update inventory item
- Request body: UpdateInventoryData
- Response: 200 OK with updated inventory
- Errors: 400 (validation), 404 (not found)

**DELETE /inventory/:id**
- Delete inventory item
- Response: 204 No Content
- Errors: 404 (not found), 400 (item in use)

## Implementation Notes

### Database Migration Strategy

1. Create UniversalInventory model
2. Create migration script to copy existing OilProduct and Filter data
3. Add category field to distinguish product types
4. Verify data integrity after migration
5. Update references in existing code (optional, can keep old models for backward compatibility)
6. Create Service model
7. Update Archive model to support 'Service' entity type
8. Update Payment model to support service references

### Backward Compatibility

- Keep existing OilChange model unchanged
- Keep existing oil change API endpoints unchanged
- Keep existing oil change UI components unchanged
- New service functionality is additive, not replacing

### Performance Considerations

- Index all foreign key fields (tenant, vehicle, customer, employees)
- Index payment status and due date for debt queries
- Use compound indexes for common query patterns
- Implement pagination for service lists
- Cache inventory items per tenant
- Use aggregation pipelines for debt calculations

### Security Considerations

- Always validate tenant ownership before operations
- Never expose cross-tenant data
- Validate all user inputs
- Sanitize service names and notes
- Prevent SQL injection through parameterized queries
- Use proper authentication middleware on all endpoints
- Log all archive operations for audit trail

### UI/UX Considerations

- Auto-calculate totals as user types
- Provide clear visual feedback for validation errors
- Show loading states during API calls
- Confirm before deleting services
- Display type badges clearly in history
- Use consistent styling with existing oil change UI
- Provide keyboard shortcuts for common actions
- Support mobile responsive design
