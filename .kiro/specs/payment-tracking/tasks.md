# Payment Tracking System - Implementation Tasks

## Phase 1: Data Models & Backend Setup

- [x] 1.1 Create Payment model with all required fields
- [x] 1.2 Update OilChange model - add paymentStatus, amountPaid, amountDue, dueDate, paidAt
- [x] 1.3 Update Customer model - add totalDebt, lastPaymentDate
- [x] 1.4 Create PaymentService with core methods
- [x] 1.5 Create PaymentController with CRUD operations
- [x] 1.6 Create payment routes (/payments endpoints)

## Phase 2: OilChange & Customer Service Updates

- [x] 2.1 Update OilChangeService.createOilChange() to handle payment fields
- [x] 2.2 Update OilChangeService.updateOilChange() to handle payment status changes
- [x] 2.3 Create OilChangeService.calculateAmountDue() method
- [x] 2.4 Update CustomerService to add updateTotalDebt() method
- [x] 2.5 Update CustomerService to add getDebtSummary() method
- [x] 2.6 Update CustomerService to add getPaymentHistory() method
- [x] 2.7 Create trigger to update customer totalDebt when payment is recorded

## Phase 3: Payment Recording Logic

- [x] 3.1 Implement PaymentService.recordPayment() with validation
- [x] 3.2 Implement PaymentService.calculateCustomerDebt() method
- [x] 3.3 Implement PaymentService.getOverduePayments() method
- [x] 3.4 Add payment amount validation (cannot exceed amountDue)
- [x] 3.5 Add automatic payment status update when amountDue becomes 0
- [x] 3.6 Add payment history retrieval methods

## Phase 4: Frontend - Payment Status in Oil Change

- [x] 4.1 Create PaymentStatusSelector component
- [x] 4.2 Add PaymentStatusSelector to oil change creation dialog
- [x] 4.3 Add amount paid input field (conditional on Partial status)
- [x] 4.4 Add due date picker to oil change dialog
- [x] 4.5 Display calculated amount due in real-time
- [x] 4.6 Update oil change edit dialog to show/edit payment status

## Phase 5: Frontend - Customer Debt Display

- [x] 5.1 Create CustomerDebtCard component
- [x] 5.2 Add CustomerDebtCard to customer/vehicle detail page
- [x] 5.3 Create PaymentHistoryTable component
- [x] 5.4 Add PaymentHistoryTable to customer detail page
- [x] 5.5 Add sorting and filtering to payment history
- [x] 5.6 Add export payment history functionality

## Phase 6: Frontend - Payment Recording

- [x] 6.1 Create PaymentRecordingDialog component
- [x] 6.2 Add PaymentRecordingDialog to customer detail page
- [x] 6.3 Implement payment form with validation
- [x] 6.4 Add payment method selector
- [x] 6.5 Add notes field for payment
- [x] 6.6 Handle payment submission and debt update

## Phase 7: Frontend - Dashboard Updates

- [x] 7.1 Create OverduePaymentsAlert component
- [x] 7.2 Add OverduePaymentsAlert to dashboard
- [x] 7.3 Create debt summary widget for dashboard
- [x] 7.4 Add overdue payments list to dashboard
- [x] 7.5 Add total outstanding debt card to dashboard
- [x] 7.6 Add recent payments widget to dashboard

## Phase 8: Property-Based Testing

- [ ] 8.1 Write PBT for debt calculation consistency (Property 1)
- [ ] 8.2 Write PBT for payment amount validity (Property 2)
- [ ] 8.3 Write PBT for amount due accuracy (Property 3)
- [ ] 8.4 Write PBT for payment status correctness (Property 4)
- [ ] 8.5 Write PBT for overdue calculation (Property 5)
- [ ] 8.6 Write PBT for payment history integrity (Property 6)

## Phase 9: Integration & Testing

- [ ] 9.1 Test oil change creation with payment status
- [ ] 9.2 Test payment recording and debt update
- [ ] 9.3 Test multiple payments for single service
- [ ] 9.4 Test customer debt summary accuracy
- [ ] 9.5 Test overdue payment detection
- [ ] 9.6 Test payment history retrieval
- [ ] 9.7 End-to-end testing of complete flow

## Phase 10: Polish & Documentation

- [x] 10.1 Add validation error messages
- [x] 10.2 Add success notifications for payments
- [x] 10.3 Add confirmation dialogs for payment recording
- [ ] 10.4 Update API documentation
- [ ] 10.5 Add user guide for payment tracking
- [ ] 10.6 Performance optimization if needed

## Optional Enhancements

- [ ]* 11.1 Add payment reminders/notifications
- [ ]* 11.2 Add payment receipt generation
- [ ]* 11.3 Add payment analytics/reports
- [ ]* 11.4 Add automatic payment due date calculation based on service type
- [ ]* 11.5 Add payment plan support (installments)
- [ ]* 11.6 Add SMS/Email payment reminders
