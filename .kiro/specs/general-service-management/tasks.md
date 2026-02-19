# Implementation Plan: General Service Management

## Overview

This implementation plan breaks down the general service management feature into incremental, testable steps. The approach follows a bottom-up strategy: starting with data models, then building service layer logic, API endpoints, and finally frontend components. Each step builds on previous work and includes testing to validate correctness early.

## Tasks

- [x] 1. Create Universal Inventory Model and Migration
  - [x] 1.1 Create UniversalInventory model with schema
    - Define IUniversalInventoryDocument interface with all fields (name, partNumber, brand, category, price, stock, unit, description, reorderLevel)
    - Create Mongoose schema with validation, indexes, and virtual for needsReorder
    - Add multi-tenant support with tenant reference and compound indexes
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [ ]* 1.2 Write property test for inventory model
    - **Property: Inventory Tenant Filtering**
    - **Validates: Requirements 2.2**
  
  - [x] 1.3 Create data migration script for existing inventory
    - Write script to migrate OilProduct and Filter data to UniversalInventory
    - Add category field to distinguish product types ('oil', 'filter', 'part', etc.)
    - Preserve all existing data without loss
    - _Requirements: 2.3, 9.3_
  
  - [ ]* 1.4 Write unit test for migration script
    - Test that all oil products are migrated
    - Test that all filters are migrated
    - Test that no data is lost
    - _Requirements: 2.3, 9.3_

- [x] 2. Create Service Model
  - [x] 2.1 Define Service model interfaces and schema
    - Create IServiceItem interface (itemName, itemType, inventoryId, quantity, unitPrice, totalPrice)
    - Create IServiceDocument interface with all fields
    - Create Mongoose schemas with validation rules
    - Add multi-tenant indexes and compound indexes
    - Implement pre-save hook for totalPrice calculation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ]* 2.2 Write property test for service total price calculation
    - **Property 1: Service Total Price Calculation**
    - **Validates: Requirements 1.7**
  
  - [ ]* 2.3 Write property test for service item structure validation
    - **Property 2: Service Item Structure Validation**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 2.4 Write property test for service item total calculation
    - **Property 3: Service Item Total Calculation**
    - **Validates: Requirements 10.5**
  
  - [ ]* 2.5 Write unit tests for service model validation
    - Test required fields validation
    - Test enum validation for paymentStatus
    - Test minimum value constraints
    - _Requirements: 1.1, 1.7_

- [x] 3. Extend Archive and Payment Models
  - [x] 3.1 Update Archive model to support Service entity type
    - Add 'Service' to entityType enum
    - Update TypeScript types
    - _Requirements: 8.7_
  
  - [x] 3.2 Extend Payment model to support Service references
    - Add optional service field (ObjectId reference)
    - Add serviceType discriminator field ('oilChange' | 'service')
    - Add validation: exactly one of oilChange or service must be set
    - Update indexes to include service field
    - _Requirements: 6.6_
  
  - [ ]* 3.3 Write unit tests for payment model extension
    - Test that payment requires either oilChange or service
    - Test that payment cannot have both references
    - Test serviceType validation
    - _Requirements: 6.6_

- [ ] 4. Checkpoint - Ensure all model tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement ServiceService Class
  - [x] 5.1 Create ServiceService with createService method
    - Implement validation for all required fields
    - Implement validateServiceItems method (check inventory existence, tenant ownership)
    - Implement calculateTotalPrice method
    - Create service record with calculated totals
    - Update inventory stock for inventory items
    - Create archive entry with 'created' action
    - _Requirements: 1.7, 7.1, 8.1, 10.1, 10.2, 10.6_
  
  - [ ]* 5.2 Write property test for service creation archive entry
    - **Property 18: Service Creation Archive Entry**
    - **Validates: Requirements 8.1, 8.4**
  
  - [ ]* 5.3 Write property test for inventory tenant validation
    - **Property 11: Inventory Item Tenant Validation**
    - **Validates: Requirements 10.1**
  
  - [ ]* 5.4 Write property test for service item validation
    - **Property 12: Service Item Validation**
    - **Validates: Requirements 10.2, 10.3, 10.4**
  
  - [ ]* 5.5 Write property test for service requires content
    - **Property 13: Service Requires Content**
    - **Validates: Requirements 10.6**
  
  - [ ]* 5.6 Write unit tests for createService
    - Test service creation with inventory items
    - Test service creation with custom items
    - Test service creation with mixed items
    - Test error handling for invalid inventory
    - Test error handling for cross-tenant inventory access
    - _Requirements: 1.2, 1.3, 7.1, 10.1_

- [x] 6. Implement ServiceService update and query methods
  - [x] 6.1 Implement updateService method
    - Fetch existing service and validate tenant ownership
    - Calculate field-level changes for archive
    - Validate new service items
    - Update service record
    - Adjust inventory stock (revert old quantities, apply new)
    - Create archive entry with 'updated' action and changes
    - _Requirements: 7.4, 8.2_
  
  - [x] 6.2 Implement getServiceById method
    - Query service by ID with tenant validation
    - Populate all references (vehicle, customer, employees, inventory items)
    - _Requirements: 7.3_
  
  - [x] 6.3 Implement listServices method
    - Support filtering by vehicle, customer, paymentStatus
    - Enforce tenant isolation
    - Sort by createdAt descending
    - _Requirements: 7.2, 7.10_
  
  - [x] 6.4 Implement archiveService method
    - Set isArchived, archivedAt, archivedBy fields
    - Create archive entry with 'archived' action
    - _Requirements: 7.5, 8.3_
  
  - [x] 6.5 Implement getServiceHistory method
    - Query archive entries for service
    - Sort by performedAt chronologically
    - _Requirements: 7.8, 8.6_
  
  - [ ]* 6.6 Write property test for service update archive entry
    - **Property 19: Service Update Archive Entry**
    - **Validates: Requirements 8.2, 8.4, 8.5**
  
  - [ ]* 6.7 Write property test for service archive action entry
    - **Property 20: Service Archive Action Entry**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ]* 6.8 Write property test for archive history chronological order
    - **Property 21: Archive History Chronological Order**
    - **Validates: Requirements 8.6**
  
  - [ ]* 6.9 Write property test for service filtering by tenant
    - **Property 10: Service Filtering by Tenant**
    - **Validates: Requirements 7.2, 7.10**
  
  - [ ]* 6.10 Write unit tests for service operations
    - Test updateService with various changes
    - Test archiveService
    - Test getServiceHistory
    - Test listServices with filters
    - _Requirements: 7.2, 7.4, 7.5, 7.8_

- [x] 7. Extend PaymentService for Services
  - [x] 7.1 Extend recordPayment method to support services
    - Accept serviceType parameter ('oilChange' | 'service')
    - Query appropriate model based on serviceType
    - Validate service exists and belongs to tenant
    - Update service payment fields (amountPaid, amountDue, paymentStatus, paidAt)
    - Create payment record with service reference
    - Update customer debt calculation
    - _Requirements: 6.4, 6.5_
  
  - [x] 7.2 Extend calculateCustomerDebt to include services
    - Aggregate amountDue from OilChange collection
    - Aggregate amountDue from Service collection
    - Sum both amounts and return total
    - _Requirements: 5.4, 6.2_
  
  - [x] 7.3 Extend getCustomerPaymentHistory to include services
    - Query payments for both oil changes and services
    - Merge and sort by date
    - Calculate running balance including both types
    - _Requirements: 6.3_
  
  - [ ]* 7.4 Write property test for payment recording updates service
    - **Property 9: Payment Recording Updates Service**
    - **Validates: Requirements 6.5**
  
  - [ ]* 7.5 Write property test for customer debt calculation
    - **Property 6: Customer Debt Calculation**
    - **Validates: Requirements 5.4, 6.2**
  
  - [ ]* 7.6 Write property test for payment history unification
    - **Property 8: Payment History Unification**
    - **Validates: Requirements 6.3**
  
  - [ ]* 7.7 Write unit tests for payment service extensions
    - Test recording payment for service
    - Test debt calculation with both types
    - Test payment history with both types
    - _Requirements: 6.3, 6.5_

- [ ] 8. Implement VehicleService unified history method
  - [x] 8.1 Add getVehicleHistory method to VehicleService
    - Query all oil changes for vehicle
    - Query all services for vehicle
    - Map both to unified format with type indicator
    - Merge arrays and sort by createdAt descending
    - _Requirements: 4.1, 4.6, 7.6_
  
  - [ ]* 8.2 Write property test for unified service history composition
    - **Property 4: Unified Service History Composition**
    - **Validates: Requirements 4.1, 4.6, 7.6**
  
  - [ ]* 8.3 Write unit tests for unified history
    - Test with only oil changes
    - Test with only services
    - Test with both types
    - Test sorting order
    - _Requirements: 4.1, 4.6_

- [ ] 9. Checkpoint - Ensure all service layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Create API Controllers
  - [x] 10.1 Create ServiceController with CRUD endpoints
    - Implement createService (POST /services)
    - Implement listServices (GET /services)
    - Implement getService (GET /services/:id)
    - Implement updateService (PUT /services/:id)
    - Implement deleteService (DELETE /services/:id)
    - Implement archiveService (POST /services/:id/archive)
    - Implement getServiceHistory (GET /services/:id/archive-history)
    - Add proper error handling and response formatting
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_
  
  - [x] 10.2 Extend VehicleController with unified history endpoint
    - Implement getVehicleHistory (GET /vehicles/:id/history)
    - Return unified array of oil changes and services
    - _Requirements: 7.6_
  
  - [ ] 10.3 Extend PaymentController to support service payments
    - Update recordPayment to accept serviceType and serviceId
    - Add validation for service payments
    - _Requirements: 6.4_
  
  - [ ]* 10.4 Write property test for input validation rejection
    - **Property 22: Input Validation Rejection**
    - **Validates: Requirements 7.9**
  
  - [ ]* 10.5 Write integration tests for service API endpoints
    - Test POST /services with valid data
    - Test POST /services with invalid data
    - Test GET /services with filters
    - Test PUT /services/:id
    - Test DELETE /services/:id
    - Test archive endpoints
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_

- [x] 11. Create API Routes
  - [x] 11.1 Add service routes to Express app
    - Create /services route group
    - Wire up ServiceController methods
    - Add authentication middleware
    - Add validation middleware
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_
  
  - [x] 11.2 Update vehicle routes for unified history
    - Add GET /vehicles/:id/history route
    - Wire up VehicleController.getVehicleHistory
    - _Requirements: 7.6_
  
  - [x] 11.3 Update payment routes for service support
    - Update POST /payments route to handle serviceType
    - _Requirements: 6.4_

- [ ] 12. Create Universal Inventory API
  - [x] 12.1 Create InventoryController
    - Implement listInventory (GET /inventory)
    - Implement createInventory (POST /inventory)
    - Implement updateInventory (PUT /inventory/:id)
    - Implement deleteInventory (DELETE /inventory/:id)
    - Add tenant filtering and validation
    - _Requirements: 2.1, 2.2_
  
  - [ ] 12.2 Add inventory routes
    - Create /inventory route group
    - Wire up InventoryController methods
    - Add authentication middleware
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 12.3 Write integration tests for inventory API
    - Test CRUD operations
    - Test tenant isolation
    - _Requirements: 2.2_

- [ ] 13. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create Frontend API Client Functions
  - [x] 14.1 Create service API client functions
    - createService(data)
    - updateService(id, data)
    - getService(id)
    - listServices(filters)
    - deleteService(id)
    - archiveService(id, reason)
    - getServiceHistory(id)
    - Add TypeScript types for request/response
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_
  
  - [x] 14.2 Create inventory API client functions
    - listInventory(filters)
    - Add TypeScript types
    - _Requirements: 2.1_
  
  - [x] 14.3 Create unified history API client function
    - getVehicleHistory(vehicleId)
    - Add TypeScript types for unified history items
    - _Requirements: 4.1, 7.6_
  
  - [x] 14.4 Extend payment API client for services
    - Update recordPayment to support serviceType
    - _Requirements: 6.4_

- [x] 15. Create AddServiceDialog Component
  - [x] 15.1 Create AddServiceDialog component structure
    - Create component with props (open, onClose, vehicleId, customerId, onSuccess)
    - Set up form state with react-hook-form
    - Define ServiceFormData and ServiceItemForm types
    - Add service name input field
    - Add labor cost input field
    - Add employee multi-select checkboxes
    - Add optional mileage input
    - Add optional notes textarea
    - Integrate PaymentStatusSelector component
    - Add submit and cancel buttons
    - _Requirements: 3.1, 3.2, 3.8, 3.9, 3.10, 3.11, 3.12_
  
  - [x] 15.2 Implement service items section
    - Create ServiceItemForm sub-component
    - Add "Select from inventory" checkbox toggle
    - Conditionally render inventory dropdown or manual entry fields
    - Implement "Add Item" button to add unlimited items
    - Implement remove button for each item
    - Display item name, quantity, unit price, and calculated total
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 15.3 Implement calculations and validation
    - Calculate item total as quantity × unitPrice
    - Calculate service total as sum(item totals) + laborCost
    - Auto-update total price display when items or labor cost change
    - Validate service name required
    - Validate at least one item or laborCost > 0
    - Validate all quantities > 0
    - Validate all prices >= 0
    - _Requirements: 3.13, 3.14, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 15.4 Implement form submission
    - Handle form submit event
    - Call createService API
    - Show loading state
    - Handle success (call onSuccess callback)
    - Handle errors (display error messages)
    - _Requirements: 7.1_
  
  - [ ]* 15.5 Write property test for inventory dropdown tenant filtering
    - **Property 15: Inventory Dropdown Tenant Filtering**
    - **Validates: Requirements 3.4**
  
  - [ ]* 15.6 Write property test for service item display completeness
    - **Property 16: Service Item Display Completeness**
    - **Validates: Requirements 3.7**
  
  - [ ]* 15.7 Write property test for total price auto-calculation in UI
    - **Property 17: Total Price Auto-Calculation in UI**
    - **Validates: Requirements 3.13**
  
  - [ ]* 15.8 Write unit tests for AddServiceDialog
    - Test rendering with all fields
    - Test adding/removing service items
    - Test inventory vs manual entry toggle
    - Test form validation
    - Test submission handling
    - _Requirements: 3.2, 3.6, 3.13_

- [x] 16. Create UnifiedServiceHistory Component
  - [x] 16.1 Create UnifiedServiceHistory component
    - Create component with props (vehicleId, onEdit, onDelete, onPrint, onViewHistory)
    - Fetch unified history using getVehicleHistory API
    - Define UnifiedHistoryItem type
    - Render table/list with columns: Type Badge, Date, Service/Items, Price, Payment Status, Actions
    - Display [Oil Change] or [Service] badge based on type
    - For services: show service name
    - Show list of items used
    - Sort by date descending
    - Add action buttons: Edit, Delete, Print, View History
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 16.2 Write property test for service history display completeness
    - **Property 5: Service History Display Completeness**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
  
  - [ ]* 16.3 Write unit tests for UnifiedServiceHistory
    - Test rendering with oil changes only
    - Test rendering with services only
    - Test rendering with both types
    - Test type badge display
    - Test action button functionality
    - _Requirements: 4.1, 4.2, 4.6_

- [x] 17. Integrate Components into Vehicle Detail Page
  - [x] 17.1 Add "Add Service" button to vehicle detail page
    - Place button next to "Add Oil Change" button
    - Wire up to open AddServiceDialog
    - _Requirements: 3.1_
  
  - [x] 17.2 Replace service history with UnifiedServiceHistory component
    - Remove separate oil change history display
    - Add UnifiedServiceHistory component
    - Wire up action handlers (edit, delete, print, view history)
    - _Requirements: 4.1, 4.8_
  
  - [ ]* 17.3 Write integration tests for vehicle detail page
    - Test "Add Service" button opens dialog
    - Test unified history displays both types
    - Test action buttons work correctly
    - _Requirements: 3.1, 4.1_

- [ ] 18. Extend Dashboard Components
  - [ ] 18.1 Update Recent Services table to include services
    - Modify query to fetch both oil changes and services
    - Add "Type" column to table
    - Display service name for services
    - Maintain existing columns (Date, Customer, Vehicle, Price, Payment Status)
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 18.2 Update debt calculation to include services
    - Modify debt calculation logic to sum both types
    - Update CustomerDebtCard component if needed
    - _Requirements: 5.4_
  
  - [ ]* 18.3 Write property test for dashboard service display
    - **Property 7: Dashboard Service Display**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 18.4 Write unit tests for dashboard extensions
    - Test recent services table with both types
    - Test debt calculation with both types
    - _Requirements: 5.1, 5.4_

- [ ] 19. Extend Payment Components
  - [ ] 19.1 Update PaymentRecordingDialog to support services
    - Add serviceType selection or auto-detect from context
    - Update API call to include serviceType
    - Handle service payment recording
    - _Requirements: 6.4_
  
  - [ ] 19.2 Update PaymentHistoryTable to show both types
    - Modify to display payments for both oil changes and services
    - Add type indicator in payment history
    - _Requirements: 6.3_
  
  - [ ]* 19.3 Write unit tests for payment component extensions
    - Test recording payment for service
    - Test payment history with both types
    - _Requirements: 6.3, 6.4_

- [ ] 20. Run Data Migration
  - [ ] 20.1 Execute inventory migration script
    - Run migration script on development database
    - Verify all oil products migrated
    - Verify all filters migrated
    - Verify no data loss
    - _Requirements: 2.3, 9.3_
  
  - [ ] 20.2 Test backward compatibility
    - Verify existing oil change functionality works
    - Verify existing API endpoints work
    - Verify existing UI components work
    - _Requirements: 9.1, 9.2, 9.4_

- [ ] 21. Final Checkpoint - End-to-end testing
  - [ ] 21.1 Test complete service creation flow
    - Create service with inventory items
    - Create service with custom items
    - Create service with mixed items
    - Verify service appears in unified history
    - Verify service appears on dashboard
    - _Requirements: 3.1, 3.2, 4.1, 5.1_
  
  - [ ] 21.2 Test payment flow for services
    - Record payment for service
    - Verify payment status updates
    - Verify customer debt updates
    - Verify payment appears in history
    - _Requirements: 6.4, 6.5, 6.3_
  
  - [ ] 21.3 Test archive functionality
    - Archive a service
    - View service history
    - Verify archive entries created
    - _Requirements: 7.5, 7.8, 8.1, 8.2, 8.3_
  
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: models → services → controllers → routes → frontend
- Multi-tenant isolation is enforced at every layer
- Backward compatibility is maintained throughout
