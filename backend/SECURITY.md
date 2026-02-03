# Security Implementation

## Authentication & Authorization

### JWT Strategy
- **Access Token**: Short-lived (15 minutes), sent via Authorization header
- **Refresh Token**: Long-lived (7 days), stored in HttpOnly cookie
- **Token Rotation**: New refresh token issued on each refresh

### Password Security
- Bcrypt hashing with 12 salt rounds
- Minimum 6 characters (configurable)
- Passwords never returned in API responses

### Role-Based Access Control (RBAC)

#### Roles
1. **Employee** (Default)
   - Create and manage own vehicles
   - Book appointments
   - View own appointments
   - Cancel own appointments

2. **Admin**
   - All Employee permissions
   - Manage services (CRUD)
   - View all vehicles
   - View all appointments
   - Assign mechanics to appointments

3. **SuperAdmin**
   - All Admin permissions
   - Full system access
   - User management capabilities

### Security Features

#### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Auth Routes**: 5 attempts per 15 minutes (brute-force protection)

#### HttpOnly Cookies
- Refresh tokens stored in HttpOnly cookies
- Prevents XSS attacks
- Secure flag enabled in production
- SameSite: strict

#### Headers Security
- Helmet.js for security headers
- CORS configured with credentials
- Content Security Policy

#### Input Validation
- Express-validator on all routes
- Mongoose schema validation
- Sanitization of user inputs

### API Security Best Practices

1. **Never expose sensitive data**
   - Passwords excluded from queries
   - Tokens not logged

2. **Environment variables**
   - All secrets in .env
   - No hardcoded credentials

3. **Error handling**
   - Generic error messages to clients
   - Detailed logs server-side only

4. **Database security**
   - Mongoose query sanitization
   - Indexed fields for performance
   - Connection string in environment

## Usage

### Login Flow
```
POST /api/v1/auth/login
Body: { email, password }
Response: { user, accessToken }
Cookie: refreshToken (HttpOnly)
```

### Protected Route Access
```
GET /api/v1/protected-route
Header: Authorization: Bearer <accessToken>
```

### Token Refresh
```
POST /api/v1/auth/refresh
Cookie: refreshToken (automatic)
Response: { accessToken }
Cookie: new refreshToken (HttpOnly)
```

### Logout
```
POST /api/v1/auth/logout
Response: Success
Cookie: refreshToken cleared
```

## Production Checklist

- [ ] Change all JWT secrets in .env
- [ ] Use strong, random secrets (32+ characters)
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB authentication
- [ ] Enable MongoDB encryption at rest
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting based on traffic
- [ ] Regular security audits
- [ ] Keep dependencies updated
