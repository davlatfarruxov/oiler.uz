# Payment Tracking System - Requirements

## Overview
Implement a comprehensive payment tracking system to manage customer debts, payments, and payment history for oil change services.

## User Stories

### 1. Record Payment Status on Oil Change
**As a** service manager
**I want to** record whether a customer paid for the service or owes money
**So that** I can track customer debts and payment obligations

**Acceptance Criteria:**
- When creating an oil change, I can select payment status: Paid, Partial, or Unpaid
- If Partial, I can enter the amount paid
- The system calculates remaining amount due
- Payment status is saved with the oil change record

### 2. View Customer Debt Summary
**As a** service manager
**I want to** see total debt for each customer
**So that** I can manage customer relationships and follow up on payments

**Acceptance Criteria:**
- Customer detail page shows total debt amount
- Shows breakdown of unpaid services
- Shows overdue payments (past due date)
- Shows payment history

### 3. Record Customer Payments
**As a** service manager
**I want to** record when a customer makes a payment
**So that** I can track payment history and update debt

**Acceptance Criteria:**
- Can record partial or full payment for a service
- Can record payment for multiple services at once
- Payment date is recorded
- Payment method can be recorded (cash, card, transfer, etc.)
- Debt amount updates automatically

### 4. Set Payment Due Dates
**As a** service manager
**I want to** set a due date for payment
**So that** I can track overdue payments

**Acceptance Criteria:**
- Can set custom due date when creating oil change
- Default due date can be configured (e.g., 7 days)
- System shows overdue payments
- Can filter by overdue status

### 5. View Payment History
**As a** service manager
**I want to** see complete payment history for a customer
**So that** I can verify payment records and resolve disputes

**Acceptance Criteria:**
- Customer ledger shows all transactions (services and payments)
- Each transaction shows date, amount, type, and status
- Running balance is calculated
- Can export payment history

### 6. Dashboard Debt Overview
**As a** manager
**I want to** see dashboard summary of customer debts
**So that** I can quickly identify payment issues

**Acceptance Criteria:**
- Dashboard shows total outstanding debt
- Shows number of overdue payments
- Shows customers with highest debt
- Shows recent payments

## Data Model Changes

### OilChange Model
- `paymentStatus`: enum (paid, partial, unpaid) - default: unpaid
- `amountPaid`: number - amount customer paid
- `amountDue`: number - remaining amount to pay
- `dueDate`: date - when payment is due
- `paidAt`: date - when payment was made

### Customer Model
- `totalDebt`: number - total outstanding debt
- `lastPaymentDate`: date - when last payment was made
- `paymentHistory`: array of payment IDs

### New Payment Model
- `customerId`: reference to Customer
- `oilChangeId`: reference to OilChange
- `amount`: number - payment amount
- `paymentDate`: date
- `paymentMethod`: enum (cash, card, transfer, check, other)
- `notes`: string
- `recordedBy`: reference to User
- `createdAt`: date

## UI Components Needed

1. **Payment Status Selector** - When creating/editing oil change
2. **Customer Debt Card** - Shows total debt on customer detail page
3. **Payment History Table** - Shows all transactions for a customer
4. **Payment Recording Dialog** - To record new payments
5. **Overdue Payments Alert** - Warning on dashboard
6. **Debt Summary Widget** - Dashboard overview

## Business Rules

1. When oil change is created with `paymentStatus: paid`, `amountDue` = 0
2. When `paymentStatus: partial`, `amountDue` = `price - amountPaid`
3. When `paymentStatus: unpaid`, `amountDue` = `price`
4. Customer `totalDebt` = sum of all `amountDue` from their oil changes
5. When payment is recorded, corresponding oil change `amountDue` is reduced
6. If `amountDue` becomes 0, `paymentStatus` changes to `paid`
7. Due date defaults to 7 days from service date if not specified
8. Overdue = current date > dueDate AND amountDue > 0

## Priority
High - Critical for business operations and customer management
