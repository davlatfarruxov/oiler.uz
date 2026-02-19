# Requirements Document

## Introduction

This document specifies the requirements for a general service management system that extends the existing oil change tracking system. The system enables users to record any type of automotive service (brake repair, tire changes, diagnostics, etc.) with flexible service items that can be sourced from inventory or manually entered. The system maintains backward compatibility with existing oil change functionality while providing a unified service history view.

## Glossary

- **Service**: A general automotive service record (brake repair, tire change, etc.) distinct from oil changes
- **Service_Item**: An individual product or part used in a service, either from inventory or manually entered
- **Universal_Inventory**: A unified inventory system that stores any type of automotive product or part
- **Service_History**: Combined chronological list of both oil changes and general services for a vehicle
- **Payment_Tracker**: Existing system for tracking payment status and customer debt
- **Archive_System**: Existing system for tracking all changes to entities over time
- **Multi_Tenant_System**: Architecture where each business (tenant) has isolated data
- **Labor_Cost**: The cost charged for work performed, separate from parts/products
- **Payment_Status**: One of 'paid', 'partial', or 'unpaid' indicating payment state

## Requirements

### Requirement 1: Service Data Model

**User Story:** As a service manager, I want to record general automotive services with flexible service items, so that I can track all types of repairs and maintenance beyond oil changes.

#### Acceptance Criteria

1. THE Service_Model SHALL store vehicle reference, customer reference, service name, service items array, labor cost, total price, employees array, optional mileage, optional notes, payment status, amount paid, and due date
2. WHEN a service item is from inventory, THE Service_Item SHALL include inventory ID reference, item type 'inventory', item name, quantity, unit price, and total price
3. WHEN a service item is manually entered, THE Service_Item SHALL include item type 'custom', item name, quantity, unit price, and total price
4. THE Service_Model SHALL support multi-tenant architecture with tenant reference and appropriate indexes
5. THE Service_Model SHALL include archive fields (isArchived, archivedAt, archivedBy) consistent with OilChange model
6. THE Service_Model SHALL include timestamp fields (createdAt, updatedAt)
7. THE Service_Model SHALL calculate total price as sum of all service item totals plus labor cost

### Requirement 2: Universal Inventory System

**User Story:** As an inventory manager, I want a universal inventory system that can store any type of automotive product, so that I can manage all parts and products in one place.

#### Acceptance Criteria

1. THE Universal_Inventory SHALL store name, part number, brand, category, price, stock quantity, unit of measure, and description
2. THE Universal_Inventory SHALL support multi-tenant architecture with tenant reference
3. WHEN migrating existing data, THE System SHALL preserve all existing oil products and filters in the universal inventory
4. THE Universal_Inventory SHALL maintain stock levels and support inventory tracking
5. THE Universal_Inventory SHALL allow categorization of products for easy filtering and search

### Requirement 3: Service Creation Interface

**User Story:** As a service technician, I want to create service records with flexible item entry, so that I can quickly record any type of service performed.

#### Acceptance Criteria

1. WHEN viewing a vehicle detail page, THE System SHALL display an "Add Service" button alongside the existing "Add Oil Change" button
2. WHEN creating a service, THE Service_Dialog SHALL require service name as text input
3. WHEN adding service items, THE Service_Dialog SHALL provide a checkbox to toggle between inventory selection and manual entry
4. WHEN "Select from inventory" is checked, THE Service_Dialog SHALL display an inventory dropdown filtered by tenant
5. WHEN "Select from inventory" is unchecked, THE Service_Dialog SHALL display manual entry fields for item name, price, and quantity
6. THE Service_Dialog SHALL allow adding unlimited service items via an "Add Item" button
7. WHEN displaying service items, THE Service_Dialog SHALL show item name, quantity, unit price, and calculated total for each item
8. THE Service_Dialog SHALL include labor cost input field
9. THE Service_Dialog SHALL include employee multi-select checkboxes without commission display
10. THE Service_Dialog SHALL include optional mileage input field
11. THE Service_Dialog SHALL include optional notes textarea
12. THE Service_Dialog SHALL reuse the existing PaymentStatusSelector component
13. THE Service_Dialog SHALL display auto-calculated total price as read-only field
14. WHEN calculating total price, THE System SHALL sum all service item totals and add labor cost

### Requirement 4: Unified Service History Display

**User Story:** As a service manager, I want to view all services and oil changes in one unified history, so that I can see the complete maintenance record for each vehicle.

#### Acceptance Criteria

1. WHEN viewing vehicle detail page, THE System SHALL display oil changes and services in a single chronological list
2. WHEN displaying history items, THE System SHALL show a type badge indicating [Oil Change] or [Service]
3. WHEN displaying a service, THE System SHALL show the service name
4. WHEN displaying a service, THE System SHALL show the list of service items used
5. THE Service_History SHALL display price, date, and payment status for all items
6. THE Service_History SHALL sort items by date with newest first
7. THE Service_History SHALL support edit, delete, print, and view history actions for services
8. THE Service_History SHALL maintain existing functionality for oil changes

### Requirement 5: Dashboard Integration

**User Story:** As a business owner, I want to see recent services on the dashboard alongside oil changes, so that I can monitor all business activity in one place.

#### Acceptance Criteria

1. WHEN displaying recent services table, THE Dashboard SHALL show both oil changes and general services
2. THE Dashboard SHALL include a type column to distinguish between oil changes and services
3. THE Dashboard SHALL display payment status for both service types
4. WHEN calculating total debt, THE Dashboard SHALL include unpaid amounts from both oil changes and services

### Requirement 6: Payment Integration

**User Story:** As an accountant, I want services to use the same payment tracking as oil changes, so that I can manage all customer payments consistently.

#### Acceptance Criteria

1. THE Service_Model SHALL use the same payment status values as OilChange ('paid', 'partial', 'unpaid')
2. WHEN calculating customer debt, THE System SHALL include unpaid service amounts
3. WHEN displaying payment history, THE System SHALL show payments for both oil changes and services
4. THE PaymentRecordingDialog SHALL support recording payments for both service types
5. WHEN a payment is recorded for a service, THE System SHALL update the service payment status and amount paid
6. THE Payment_Model SHALL support references to both OilChange and Service entities

### Requirement 7: Service API Endpoints

**User Story:** As a frontend developer, I want RESTful API endpoints for service management, so that I can build the user interface.

#### Acceptance Criteria

1. THE API SHALL provide POST /services endpoint to create new services
2. THE API SHALL provide GET /services endpoint to list services with filtering by tenant, vehicle, customer, and payment status
3. THE API SHALL provide GET /services/:id endpoint to retrieve service details with populated references
4. THE API SHALL provide PUT /services/:id endpoint to update existing services
5. THE API SHALL provide DELETE /services/:id endpoint to soft delete (archive) services
6. THE API SHALL provide GET /vehicles/:id/history endpoint that returns both oil changes and services sorted by date
7. THE API SHALL provide POST /services/:id/archive endpoint to manually archive services
8. THE API SHALL provide GET /services/:id/archive-history endpoint to retrieve service change history
9. WHEN creating or updating services, THE API SHALL validate all required fields and data types
10. WHEN querying services, THE API SHALL enforce multi-tenant isolation

### Requirement 8: Archive and History Tracking

**User Story:** As a system administrator, I want complete audit trails for all service operations, so that I can track changes and maintain data integrity.

#### Acceptance Criteria

1. WHEN a service is created, THE Archive_System SHALL record a 'created' action with full snapshot
2. WHEN a service is updated, THE Archive_System SHALL record an 'updated' action with field-level changes
3. WHEN a service is deleted, THE Archive_System SHALL record an 'archived' action with reason
4. THE Archive_System SHALL store the user who performed each action
5. THE Archive_System SHALL store timestamps for all actions
6. WHEN viewing service history, THE System SHALL display all archived records in chronological order
7. THE Archive_Model SHALL support 'Service' as a valid entity type alongside existing types

### Requirement 9: Data Migration and Compatibility

**User Story:** As a system administrator, I want seamless migration to the new system, so that existing functionality remains intact.

#### Acceptance Criteria

1. THE System SHALL maintain the existing OilChange model without modifications
2. THE System SHALL preserve all existing oil change functionality
3. WHEN migrating to universal inventory, THE System SHALL convert existing oil products and filters without data loss
4. THE System SHALL maintain backward compatibility with existing API endpoints
5. THE System SHALL follow the existing multi-tenant architecture patterns
6. THE System SHALL reuse existing payment tracking components and logic

### Requirement 10: Service Item Validation

**User Story:** As a service technician, I want validation on service items, so that I can ensure data accuracy.

#### Acceptance Criteria

1. WHEN adding a service item from inventory, THE System SHALL validate that the inventory item exists and belongs to the tenant
2. WHEN adding a custom service item, THE System SHALL require item name, quantity, and unit price
3. THE System SHALL validate that quantity is a positive number
4. THE System SHALL validate that unit price is a non-negative number
5. THE System SHALL calculate item total price as quantity multiplied by unit price
6. WHEN submitting a service, THE System SHALL require at least one service item or a non-zero labor cost
