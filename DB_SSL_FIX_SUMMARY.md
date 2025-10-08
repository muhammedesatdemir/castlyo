# 🔧 Database SSL Fix - Critical Deployment Guide

## 🚨 ROOT CAUSE IDENTIFIED

The 500 Internal Server Errors were caused by **missing SSL configuration** for Render Postgres connections. The `postgres` client in the API was not configured to use SSL, causing all database operations to fail.

## ✅ FIXES APPLIED

### 1. Database SSL Configuration
**File**: `apps/api/src/config/database.module.ts`
```javascript
// Added SSL configuration
const shouldUseSSL = isProduction || dbSsl;
const client = postgres(url!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: shouldUseSSL ? { rejectUnauthorized: false } : false, // CRITICAL FIX
});
```

### 2. Enhanced Error Handling
- **AuthService**: Detailed error logging with database error codes
- **ProfilesService**: Error handling for talents endpoint  
- **Health Controller**: Comprehensive database health checks
- **Global Exception Filter**: Already in place from previous fixes

### 3. Migration Script SSL
**File**: `apps/api/src/scripts/migrate.ts`
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});
```

### 4. Smoke Test Script
**File**: `apps/api/scripts/smoke-test.js`
- Tests all critical endpoints
- Validates database connectivity
- Exit codes for CI/CD integration

## 🚀 DEPLOYMENT STEPS

### Step 1: Update Render Environment Variables
Go to Render Dashboard → castlyo (API service) → Environment:

**CRITICAL ADDITIONS:**
```env
DB_SSL=true
```

**CRITICAL UPDATE:**
```env
DATABASE_URL=postgresql://user:pass@host:port/castlyo_db?sslmode=require
```
*(Add `?sslmode=require` to the end of your existing DATABASE_URL)*

### Step 2: Deploy API
1. Click "Manual Deploy" 
2. Select "Clear build cache & deploy"
3. Wait for deployment to complete

### Step 3: Verify Database Connection
Immediately test the health endpoint:
```bash
curl https://castlyo.onrender.com/api/v1/health/db
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T...",
  "database": {
    "status": "connected",
    "responseTime": 45
  }
}
```

### Step 4: Test Authentication Flow
```bash
# Test login (should return 200 + Set-Cookie)
curl -X POST https://castlyo.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test talents endpoint (should return 200 + data)
curl https://castlyo.onrender.com/api/v1/profiles/talents?limit=5
```

## 🎯 EXPECTED RESULTS

### Before Fix (500 Errors):
- ❌ `POST /auth/login` → 500 "Authentication service temporarily unavailable"
- ❌ `POST /auth/register` → 500 "Registration service temporarily unavailable"
- ❌ `GET /profiles/talents` → 500 "Profiles service temporarily unavailable"
- ❌ `GET /auth/exists` → 500 "Email check service temporarily unavailable"

### After Fix (Proper Status Codes):
- ✅ `POST /auth/login` → 200 + Set-Cookie headers
- ✅ `POST /auth/register` → 201 + Set-Cookie headers (or 409 for duplicates)
- ✅ `GET /profiles/talents` → 200 with talent data
- ✅ `GET /auth/exists` → 200 with email check result
- ✅ `GET /health/db` → 200 "connected"

## 🔍 TROUBLESHOOTING

### If /health/db still returns 500:
1. Check DATABASE_URL has `?sslmode=require`
2. Verify DB_SSL=true is set
3. Check Render logs for SSL connection errors

### If authentication still fails:
1. Verify database connection is working (`/health/db` returns 200)
2. Check if users table exists and has data
3. Look for detailed error logs in Render console

### Common Error Messages:
- `"no pg_hba.conf entry"` → SSL not enabled
- `"connection terminated"` → SSL configuration issue
- `"Authentication service temporarily unavailable"` → Database connection failed

## 📋 VERIFICATION CHECKLIST

After deployment, verify these endpoints:

- [ ] `GET /health` → 200 OK
- [ ] `GET /health/db` → 200 OK (CRITICAL)
- [ ] `POST /auth/register` → 201 or 409 (not 500)
- [ ] `POST /auth/login` → 200 + cookies (not 500)
- [ ] `GET /users/me` → 200 with auth (not 500)
- [ ] `GET /profiles/talents` → 200 + data (not 500)
- [ ] `POST /auth/logout` → 200 OK

## 🎉 SUCCESS INDICATORS

1. **No more 500 errors** in browser console
2. **Login works** and sets cookies properly
3. **User dashboard loads** without errors
4. **Talent profiles display** correctly
5. **All errors are 4xx** (400, 401, 409) not 500

## 📞 NEXT STEPS

Once deployed and verified:
1. Test the full user registration flow
2. Verify cookie persistence across page reloads
3. Test logout functionality
4. Monitor Render logs for any remaining issues

The SSL fix should resolve all the 500 errors you were experiencing. The database connection will now work properly with Render's managed Postgres service.
