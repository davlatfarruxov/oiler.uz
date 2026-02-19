# Payment Tracking System - Design

## Architecture Overview

```
Payment Tracking System
├── Backend
│   ├── Models
│   │   ├── OilChange (updated)
│   │   ├── Customer (updated)
│   │   └── Payment (new)
│   ├── Services
│   │   ├── PaymentService (new)
│   │   ├── OilChangeService (updated)
│   │   └── CustomerService (updated)
│   ├── Controllers
│   │   ├── PaymentController (new)
│   │   ├── OilChangeController (updated)
│   │   └── CustomerController (updated)
│   └── Routes
│       ├── paymentRoutes (new)
│       └── oilChangeRoutes (updated)
└── Frontend
    ├── Components
    │   ├── PaymentStatusSelector
    │   ├── CustomerDebtCard
    │   ├── PaymentHistoryTable
    │   ├── PaymentRecordingDialog
    │   └── OverduePaymentsAlert
    └── Pages
        ├── service/[id]/page.tsx (updated)
        └── dashboard/page.tsx (updated)
```

## Database Schema

### Payment Collection
```typescript
{
  _id: ObjectId,
  tenant: ObjectId,
  customerId: ObjectId,
  oilChangeId: ObjectId,
  amount: Number,
  paymentDate: Date,
  paymentMethod: String (cash|card|transfer|check|other),
  notes: String,
  recordedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### OilChange Updates
```typescript
{
  // existing fields...
  paymentStatus: String (paid|partial|unpaid),
  amountPaid: Number,
  amountDue: Number,
  dueDate: Date,
  paidAt: Date
}
```

### Customer Updates
```typescript
{
  // existing fields...
  totalDebt: Number,
  lastPaymentDate: Date
}
```

## API Endpoints

### Payment Endpoints
- `POST /payments` - Record new payment
- `GET /payments?customerId=X` - Get customer payments
- `GET /payments?oilChangeId=X` - Get payments for specific service
- `PUT /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment

### OilChange Updates
- `POST /oil-changes` - Updated to include payment fields
- `PUT /oil-changes/:id` - Updated to handle payment status changes
- `GET /oil-changes/:id` - Returns payment information

### Customer Updates
- `GET /customers/:id` - Returns totalDebt and payment summary
- `GET /customers/:id/debt-summary` - Detailed debt breakdown
- `GET /customers/:id/payment-history` - Complete payment ledger

## Service Layer Design

### PaymentService
```
Methods:
- recordPayment(tenantId, customerId, oilChangeId, amount, method, notes)
- getCustomerPayments(tenantId, customerId)
- getOilChangePayments(tenantId, oilChangeId)
- calculateCustomerDebt(tenantId, customerId)
- getOverduePayments(tenantId)
- updatePaymentStatus(tenantId, oilChangeId)
```

### OilChangeService Updates
```
Methods:
- createOilChange() - now includes paymentStatus, amountDue, dueDate
- updatePaymentInfo() - updates payment-related fields
- calculateAmountDue() - calculates remaining amount
```

### CustomerService Updates
```
Methods:
- updateTotalDebt(tenantId, customerId)
- getDebtSummary(tenantId, customerId)
- getPaymentHistory(tenantId, customerId)
```

## Frontend Components

### PaymentStatusSelector
- Dropdown: Paid / Partial / Unpaid
- Conditional input for amount paid (if Partial)
- Shows calculated amount due
- Shows default due date

### CustomerDebtCard
- Total debt amount (prominent)
- Number of unpaid services
- Number of overdue services
- Last payment date
- Link to payment history

### PaymentHistoryTable
- Columns: Date, Service, Amount, Status, Method, Notes
- Sortable by date
- Filterable by status
- Running balance column
- Export button

### PaymentRecordingDialog
- Customer selector
- Service selector (auto-populated if from service detail)
- Amount input
- Payment method selector
- Payment date picker
- Notes field
- Submit button

### OverduePaymentsAlert
- Shows on dashboard
- Lists customers with overdue payments
- Shows total overdue amount
- Link to customer detail

## Correctness Properties

### Property 1: Debt Calculation Consistency
**Description:** Customer totalDebt must equal sum of all amountDue from their oil changes
**Formula:** `customer.totalDebt === sum(oilChange.amountDue where oilChange.customerId === customer._id)`
**Validates:** Requirements 2, 3

### Property 2: Payment Amount Validity
**Description:** Payment amount cannot exceed amountDue for an oil change
**Formula:** `payment.amount <= oilChange.amountDue`
**Validates:** Requirement 3

### Property 3: Amount Due Accuracy
**Description:** amountDue must equal price minus amountPaid
**Formula:** `oilChange.amountDue === oilChange.price - oilChange.amountPaid`
**Validates:** Requirement 1

### Property 4: Payment Status Correctness
**Description:** Payment status must match actual payment state
**Rules:**
- If `amountDue === 0` then `paymentStatus === 'paid'`
- If `amountDue === price` then `paymentStatus === 'unpaid'`
- If `0 < amountDue < price` then `paymentStatus === 'partial'`
**Validates:** Requirement 1

### Property 5: Overdue Calculation
**Description:** Overdue status is correct based on date and amount
**Formula:** `isOverdue === (currentDate > dueDate AND amountDue > 0)`
**Validates:** Requirement 4

### Property 6: Payment History Integrity
**Description:** Sum of all payments for an oil change equals amountPaid
**Formula:** `sum(payment.amount where payment.oilChangeId === oilChange._id) === oilChange.amountPaid`
**Validates:** Requirement 3

## Implementation Phases

### Phase 1: Data Model & Backend
1. Create Payment model
2. Update OilChange model with payment fields
3. Update Customer model with debt tracking
4. Create PaymentService
5. Create PaymentController
6. Create payment routes

### Phase 2: API Integration
1. Update OilChangeService to handle payment status
2. Update CustomerService to calculate debt
3. Create debt calculation triggers
4. Add payment endpoints

### Phase 3: Frontend - Oil Change Creation
1. Add PaymentStatusSelector to oil change dialog
2. Show amount due calculation
3. Set default due date

### Phase 4: Frontend - Customer Detail
1. Add CustomerDebtCard
2. Add PaymentHistoryTable
3. Add PaymentRecordingDialog

### Phase 5: Frontend - Dashboard
1. Add OverduePaymentsAlert
2. Add debt summary widget
3. Add overdue payments list

## Testing Strategy

### Unit Tests
- Payment calculation logic
- Debt calculation logic
- Payment status determination
- Overdue detection

### Integration Tests
- Create oil change with payment status
- Record payment and verify debt update
- Multiple payments for one service
- Customer debt summary accuracy

### Property-Based Tests
- All 6 correctness properties above
- Random payment amounts and dates
- Multiple customers and services
