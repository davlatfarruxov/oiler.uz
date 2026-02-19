# Oiler - Multi-Tenant Oil Change Service Management System

## Overview
Oiler is a comprehensive multi-tenant oil change service management platform that helps automotive service businesses manage their operations efficiently.

## 🎯 Key Features

### Multi-Tenant Architecture
- **Complete Data Isolation**: Each company has fully isolated data
- **Automatic Tenant Creation**: New tenant created during user registration
- **Subscription Plans**: Free, Premium, and Enterprise tiers
- **Company Branding**: Customizable company information per tenant
- **Tenant-Specific Settings**: Independent configurations for each tenant

### Core Functionality
- Vehicle Management with service history
- Employee Management and performance tracking
- Inventory Management (oil products, filters, supplies)
- Service Tracking and oil change records
- Customer Database management
- Tenant-specific settings and configurations

### Security & Access Control
- JWT-based authentication with tenant context
- Role-based access control (Admin, Employee)
- Tenant-level data isolation
- Rate limiting and brute-force protection
- Password hashing with bcrypt
- Active tenant and subscription validation

## 🏗️ Architecture

### Database Strategy
- **Single Database, Shared Schema**
- All documents include `tenant` field (ObjectId reference)
- Compound indexes with tenant prefix for performance
- Unique constraints scoped to tenant

### Tenant Isolation
- All queries automatically filtered by `tenantId`
- Controllers extract `tenantId` from JWT token
- Services enforce tenant filtering
- Cross-tenant data access prevented at multiple layers

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB 6+ with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, express-rate-limit
- **Validation**: express-validator

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB 6 or higher
- npm or yarn package manager

### Installation

1. **Clone and Install**
```bash
git clone <repository-url>
cd oiler/backend
npm install
```

2. **Environment Configuration**

Create `.env` file:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/oiler_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

3. **Database Migration** (if upgrading from single-tenant)

```bash
# Run migrations in order
npm run migrate:create-tenant      # Create default tenant
npm run migrate:users              # Migrate users to tenant
npm run migrate:core-models        # Migrate vehicles, customers, employees
npm run migrate:remaining-models   # Migrate products, brands, inventory
```

See `MIGRATION_GUIDE.md` for detailed instructions.

4. **Start Development Server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register New User & Tenant
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "companyName": "Acme Oil Change",
  "businessEmail": "info@acme.com",
  "businessPhone": "+998901234567",
  "address": "123 Main St, Tashkent"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "tenantId": "...",
      "isTenantOwner": true
    },
    "tenant": {
      "id": "...",
      "companyName": "Acme Oil Change",
      "plan": "free",
      "isActive": true,
      "maxEmployees": 5,
      "maxVehicles": 100
    },
    "accessToken": "jwt-token"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Resource Endpoints

All resource endpoints automatically filter by tenant:

- `GET /api/vehicles` - List tenant's vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/employees` - List tenant's employees
- `GET /api/oil-products` - List tenant's products
- `GET /api/settings` - Get tenant settings
- `PUT /api/settings/company-info` - Update company info

See `API_CHANGES.md` for complete documentation.

## 🗄️ Database Schema

### Tenant Model
```typescript
{
  companyName: string
  businessEmail: string
  businessPhone: string
  address?: string
  plan: 'free' | 'premium' | 'enterprise'
  isActive: boolean
  maxEmployees: number
  maxVehicles: number
  expiresAt?: Date
  settings: {
    currency: string
    timezone: string
    exchangeRate: number
  }
}
```

### User Model
```typescript
{
  name: string
  email: string  // Unique per tenant
  password: string
  role: 'admin' | 'employee'
  tenant: ObjectId  // Reference to Tenant
  isTenantOwner: boolean
}
```

### Vehicle Model
```typescript
{
  tenant: ObjectId
  plateNumber: string  // Unique per tenant
  brand: string
  vehicleModel: string
  year: number
  customer: ObjectId
  mileage: number
}
```

See `SCHEMAS.md` for complete schema documentation.

## 🔒 Security Features

### Authentication
- JWT tokens include `tenantId` and `isTenantOwner`
- Tokens validated on every request
- Expired tokens rejected

### Authorization
- Tenant ownership verified for sensitive operations
- Active tenant check on all requests
- Subscription expiration validation

### Data Isolation
- All queries include tenant filter
- Controllers extract tenantId from authenticated user
- Services enforce tenant-scoped operations
- Cross-tenant access prevented

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
See `TEST_PLAN.md` for comprehensive testing guide covering:
- Authentication & Registration
- Data Isolation
- CRUD Operations
- Settings Management
- Security & Access Control
- Edge Cases
- Performance

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # MongoDB connection
│   │   └── env.ts            # Environment variables
│   ├── controllers/          # Request handlers
│   │   ├── authController.ts
│   │   ├── vehicleController.ts
│   │   ├── employeeController.ts
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── errorHandler.ts  # Error handling
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── models/               # Mongoose models
│   │   ├── Tenant.ts
│   │   ├── User.ts
│   │   ├── Vehicle.ts
│   │   └── ...
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   │   ├── authService.ts
│   │   ├── vehicleService.ts
│   │   └── ...
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilities
│   └── server.ts             # Entry point
├── scripts/                  # Migration scripts
│   ├── create-default-tenant.ts
│   ├── migrate-users-to-tenant.ts
│   ├── migrate-core-models.ts
│   └── migrate-remaining-models.ts
├── MIGRATION_GUIDE.md        # Migration instructions
├── API_CHANGES.md            # API documentation
├── TEST_PLAN.md              # Testing guide
├── MULTI_TENANT_MIGRATION.md # Technical details
└── package.json
```

## 📖 Documentation

- **MIGRATION_GUIDE.md** - Step-by-step migration from single to multi-tenant
- **API_CHANGES.md** - Complete API reference and changes
- **TEST_PLAN.md** - Comprehensive testing procedures
- **MULTI_TENANT_MIGRATION.md** - Technical implementation details
- **SCHEMAS.md** - Database schema documentation
- **SECURITY.md** - Security best practices

## 🔄 Migration from Single-Tenant

If you have existing data, follow these steps:

1. **Backup Database**
```bash
mongodump --db oiler_db --out ./backup
```

2. **Run Migrations**
```bash
npm run migrate:create-tenant
npm run migrate:users
npm run migrate:core-models
npm run migrate:remaining-models
```

3. **Verify Migration**
- Check all users have `tenantId`
- Verify data isolation works
- Test authentication flow
- Confirm settings are tenant-specific

4. **Update Frontend**
- Users must re-login to get new JWT tokens
- Frontend should handle tenant context
- Display company information in UI

See `MIGRATION_GUIDE.md` for detailed instructions.

## 🎯 Subscription Plans

### Free Plan
- 5 employees maximum
- 100 vehicles maximum
- Basic features
- Community support

### Premium Plan
- 20 employees maximum
- 500 vehicles maximum
- Advanced features
- Email support

### Enterprise Plan
- Unlimited employees
- Unlimited vehicles
- All features
- Priority support
- Custom integrations

## 🚨 Important Notes

### Unique Constraints
The following are unique **per tenant** (not globally):
- User email addresses
- Customer phone numbers
- Vehicle plate numbers
- Oil brand names
- Filter brand names

### Breaking Changes
Multi-tenant migration includes breaking changes:
- Registration requires company information
- JWT tokens include tenantId
- All API responses include tenant context
- Existing users must re-login after migration

### Data Isolation
- Users can only access their tenant's data
- Cross-tenant queries return 404 (not 403) to prevent information leakage
- Tenant deactivation blocks all access
- Subscription expiration prevents operations

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run tests
npm run lint             # Lint code

# Migration scripts
npm run migrate:create-tenant
npm run migrate:users
npm run migrate:core-models
npm run migrate:remaining-models
```

### Environment Variables

Required:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing

Optional:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS

## 🐛 Troubleshooting

### Common Issues

**"Tenant not found" error**
- Verify tenant exists in database
- Check user has valid tenantId
- Ensure migration completed successfully

**"Cannot read property 'tenantId' of undefined"**
- User needs to login again
- JWT token doesn't include tenantId
- Run user migration script

**Data not showing after migration**
- Verify all records have tenantId
- Check compound indexes created
- Confirm tenant is active

See `MIGRATION_GUIDE.md` troubleshooting section for more.

## 📝 License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

For issues and questions:
1. Check documentation files
2. Review `MIGRATION_GUIDE.md`
3. See `TEST_PLAN.md`
4. Open GitHub issue

## 🗺️ Roadmap

- [ ] Plan upgrade functionality
- [ ] Tenant analytics dashboard
- [ ] Admin panel for managing all tenants
- [ ] Usage tracking and billing
- [ ] Tenant-specific customization (themes, logos)
- [ ] Advanced reporting
- [ ] Email/SMS notifications
- [ ] Multi-language support
- [ ] Mobile API
- [ ] Webhook integrations

## ✨ Acknowledgments

- Express.js team
- MongoDB team
- TypeScript team
- Open source community
