# Oiler Backend - Oil Change Service Automation Platform

Production-grade backend API for oil change service automation.

## Tech Stack

- Node.js + Express.js
- TypeScript
- MongoDB + Mongoose
- JWT Authentication (Access + Refresh tokens)
- REST API

## Features

- **Secure Authentication**: JWT with HttpOnly cookies for refresh tokens
- **Role-Based Access Control**: Employee, Admin, SuperAdmin
- **Rate Limiting**: Brute-force protection on auth routes
- **Vehicle Management**: Track vehicles by car number
- **Service Catalog**: Manage oil change services
- **Appointment System**: Book and manage appointments
- **Service History**: Complete service tracking

## Security Features

✅ JWT access + refresh tokens  
✅ HttpOnly cookies for refresh tokens  
✅ Bcrypt password hashing (12 rounds)  
✅ Rate limiting (5 attempts per 15min on auth)  
✅ Role-based authorization  
✅ Input validation on all routes  
✅ Helmet security headers  
✅ CORS with credentials  

See [SECURITY.md](./SECURITY.md) for detailed security implementation.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, rate limiting
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. **Important**: Update `.env` with:
   - MongoDB connection string (local or Atlas)
   - Strong JWT secrets (use random 32+ character strings)

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login (sets HttpOnly cookie)
- POST `/api/v1/auth/refresh` - Refresh access token
- POST `/api/v1/auth/logout` - Logout (clears cookie)
- GET `/api/v1/auth/profile` - Get user profile

### Vehicles
- POST `/api/v1/vehicles` - Create vehicle
- GET `/api/v1/vehicles` - Get my vehicles
- GET `/api/v1/vehicles/all` - Get all vehicles (Admin/SuperAdmin)
- GET `/api/v1/vehicles/:id` - Get vehicle by ID
- PUT `/api/v1/vehicles/:id` - Update vehicle
- DELETE `/api/v1/vehicles/:id` - Delete vehicle

### Services
- GET `/api/v1/services` - Get all services
- GET `/api/v1/services/:id` - Get service by ID
- POST `/api/v1/services` - Create service (Admin/SuperAdmin)
- PUT `/api/v1/services/:id` - Update service (Admin/SuperAdmin)
- PATCH `/api/v1/services/:id/toggle` - Toggle status (Admin/SuperAdmin)
- DELETE `/api/v1/services/:id` - Delete service (Admin/SuperAdmin)

### Appointments
- POST `/api/v1/appointments` - Create appointment
- GET `/api/v1/appointments` - Get my appointments
- GET `/api/v1/appointments/all` - Get all (Admin/SuperAdmin)
- GET `/api/v1/appointments/:id` - Get appointment by ID
- PATCH `/api/v1/appointments/:id/assign` - Assign mechanic (Admin/SuperAdmin)
- PATCH `/api/v1/appointments/:id/status` - Update status
- PATCH `/api/v1/appointments/:id/cancel` - Cancel appointment

## User Roles & Permissions

### Employee (Default)
- Manage own vehicles
- Book appointments
- View/cancel own appointments

### Admin
- All Employee permissions
- Manage services (CRUD)
- View all vehicles and appointments
- Assign mechanics

### SuperAdmin
- All Admin permissions
- Full system access

## Authentication Flow

1. **Login**: User receives access token + refresh token (HttpOnly cookie)
2. **API Calls**: Send access token in Authorization header
3. **Token Expired**: Call refresh endpoint with cookie
4. **Logout**: Clear refresh token cookie

## Rate Limiting

- General API: 100 requests / 15 minutes
- Auth routes: 5 attempts / 15 minutes (brute-force protection)

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, random JWT secrets
3. Enable HTTPS
4. Configure proper CORS origins
5. Use MongoDB Atlas or secured MongoDB instance
6. Review [SECURITY.md](./SECURITY.md) checklist

