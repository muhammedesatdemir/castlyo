# API Error Handling & Cookie Flow Fixes

## Overview
This document summarizes the comprehensive fixes applied to resolve 500 Internal Server Errors and proxy/cookie flow issues in the Castlyo monorepo.

## Changes Made

### 1. API - Error Handling & Logging

#### ✅ Global Exception Filter
- **File**: `apps/api/src/common/filters/http-exception.filter.ts`
- **Purpose**: Centralized error handling with proper HTTP status mapping
- **Features**:
  - Maps all errors to appropriate 4xx/5xx status codes
  - Generates unique request IDs for tracking
  - Rich error payload with timestamp, path, and request ID
  - Handles database constraints, JWT errors, bcrypt errors
  - Logs all 500 errors with stack traces for debugging

#### ✅ Request Logging Interceptor
- **File**: `apps/api/src/common/interceptors/logging.interceptor.ts`
- **Purpose**: Comprehensive request/response logging
- **Features**:
  - Logs method, URL, status, latency, user ID, IP
  - Adds unique request ID to each request
  - Tracks both successful and failed requests

#### ✅ Enhanced AuthService
- **File**: `apps/api/src/modules/auth/auth.service.ts`
- **Improvements**:
  - Proper input validation with BadRequestException
  - bcrypt error handling with guards against undefined
  - Database error handling with proper exception mapping
  - Email uniqueness checks before registration
  - Comprehensive error logging

### 2. API - JWT & Cookie Configuration

#### ✅ Cookie Configuration Service
- **File**: `apps/api/src/modules/auth/utils/cookie.config.ts`
- **Purpose**: Environment-based cookie configuration
- **Features**:
  - Configurable cookie names (COOKIE_NAME, REFRESH_COOKIE_NAME)
  - Environment-based security settings (secure, sameSite, domain)
  - TTL parsing for access/refresh tokens
  - Production vs development configurations

#### ✅ Updated AuthController
- **File**: `apps/api/src/modules/auth/auth.controller.ts`
- **Improvements**:
  - Uses CookieConfigService for all cookie operations
  - Proper cookie clearing in logout endpoint
  - Environment-based cookie security settings

#### ✅ Enhanced JWT Strategy
- **File**: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- **Improvements**:
  - Configurable cookie name extraction
  - Backward compatibility with legacy cookie names

### 3. API - Infrastructure

#### ✅ Updated main.ts
- **File**: `apps/api/src/main.ts`
- **Changes**:
  - Replaced PrismaExceptionFilter with HttpExceptionFilter
  - Added LoggingInterceptor globally
  - Fixed CORS_ORIGIN environment variable name
  - Added Cookie header to allowed headers

#### ✅ Enhanced Health Endpoints
- **File**: `apps/api/src/common/health/health.controller.ts`
- **Features**:
  - Basic health check at `/health`
  - Database connectivity check at `/health/db`
  - Proper error handling for database failures

### 4. Web - Proxy & Cookie Flow

#### ✅ Improved Proxy Route
- **File**: `apps/web/src/app/api/proxy/[...path]/route.ts`
- **Improvements**:
  - Uses API_BASE_URL environment variable
  - Enhanced Set-Cookie header forwarding
  - Improved cookie rewriting for production
  - Proper SameSite and Secure attribute handling

### 5. Environment Configuration

#### ✅ Updated env.example
- **File**: `env.example`
- **New Variables**:
  ```env
  # JWT Configuration
  JWT_ACCESS_SECRET=your-access-token-secret-here
  ACCESS_TOKEN_TTL=15m
  REFRESH_TOKEN_TTL=14d
  
  # CORS Configuration
  CORS_ORIGIN=http://localhost:3000,https://castlyo-web.onrender.com
  
  # Cookie Configuration
  COOKIE_NAME=castlyo_at
  REFRESH_COOKIE_NAME=castlyo_rt
  COOKIE_SECURE=false
  COOKIE_SAMESITE=lax
  COOKIE_DOMAIN=
  
  # API Base URL
  API_BASE_URL=http://localhost:3001
  ```

## Error Mapping Strategy

### Before (500 Errors)
- Unhandled database constraint violations
- bcrypt errors with undefined values
- JWT validation failures
- Missing input validation
- Uncaught exceptions

### After (Controlled HTTP Status)
- `400 Bad Request`: Missing/invalid input, validation errors
- `401 Unauthorized`: Invalid credentials, expired tokens
- `409 Conflict`: Email already exists, unique constraint violations
- `500 Internal Server Error`: Only for unexpected system errors (logged with stack traces)

## Cookie Flow Fixes

### Production Configuration
```javascript
// API Cookie Settings (Production)
{
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 900000 // 15 minutes for access token
}
```

### Development Configuration
```javascript
// API Cookie Settings (Development)
{
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
  maxAge: 900000
}
```

### Proxy Cookie Forwarding
- Properly forwards Set-Cookie headers from API to browser
- Rewrites cookie attributes for production environment
- Maintains cookie security while ensuring cross-origin functionality

## Testing

### ✅ Test Script
- **File**: `test-api-endpoints.js`
- **Coverage**:
  - Health endpoints (`/health`, `/health/db`)
  - Authentication flow (`/auth/register`, `/auth/login`, `/auth/logout`)
  - Protected endpoints (`/users/me`)
  - Public endpoints (`/profiles/talents`)
  - Proxy functionality
  - Cookie handling verification

### Test Commands
```bash
# Test API directly
node test-api-endpoints.js

# Test specific endpoints
curl -X GET http://localhost:3001/api/v1/health
curl -X GET http://localhost:3001/api/v1/health/db
```

## Deployment Configuration

### API Environment (Render)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<secure-random>
JWT_ACCESS_SECRET=<secure-random>
JWT_REFRESH_SECRET=<secure-random>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=14d
CORS_ORIGIN=https://castlyo-web.onrender.com
COOKIE_NAME=castlyo_at
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

### Web Environment (Render)
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://castlyo-web.onrender.com
API_BASE_URL=https://castlyo.onrender.com
NEXT_PUBLIC_API_BASE_URL=/api/proxy/api/v1
```

## Expected Results

### ✅ Resolved Issues
1. **500 Internal Server Errors**: Now mapped to appropriate 4xx status codes
2. **Cookie Flow**: Login cookies properly set and forwarded through proxy
3. **Authentication**: Consistent JWT handling across API and Web
4. **Error Tracking**: All errors logged with request IDs for debugging
5. **Health Monitoring**: Proper health checks for API and database

### ✅ Verification Steps
1. `POST /api/v1/auth/login` → 200 + Set-Cookie headers
2. `GET /api/v1/users/me` → 200 (with cookie authentication)
3. `GET /api/v1/profiles/talents` → 200
4. `POST /api/v1/auth/logout` → 200 + cookie expiration
5. Web proxy forwards all Set-Cookie headers correctly

## Monitoring & Debugging

### Request Tracking
- Each request gets a unique UUID for tracking across logs
- Error responses include request ID for correlation
- Comprehensive logging of request/response cycles

### Error Analysis
- All 500 errors logged with full stack traces
- Database constraint violations properly categorized
- JWT and authentication errors clearly identified

### Health Monitoring
- `/health` - Basic API health check
- `/health/db` - Database connectivity verification
- Proper error responses for service unavailability

## Next Steps

1. **Deploy API**: Update environment variables and redeploy
2. **Deploy Web**: Update environment variables and redeploy
3. **Monitor**: Check logs for any remaining 500 errors
4. **Test**: Run comprehensive tests in production environment
5. **Optimize**: Fine-tune cookie settings based on production behavior
