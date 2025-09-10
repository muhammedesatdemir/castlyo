# Manual Auth API Testing

## Test Environment
- Backend: http://localhost:3001
- Database: In-memory mock (Docker not available)
- Logging: Enabled in AuthService

## Test Cases

### 1. Register Success Case
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "passwordConfirm": "Password123!",
    "role": "TALENT",
    "kvkkConsent": true,
    "marketingConsent": false
  }'
```

**Expected Result:**
- Status: 201
- Response: `{"message": "Registration successful...", "userId": "...", "verificationToken": "..."}`
- Backend Log: `[REGISTER] User created successfully: {userId} | Email: test@example.com | Role: TALENT`

### 2. Register Duplicate Email (409)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "passwordConfirm": "Password123!",
    "role": "TALENT",
    "kvkkConsent": true,
    "marketingConsent": false
  }'
```

**Expected Result:**
- Status: 409
- Response: `{"message": "User with this email already exists"}`
- Backend Log: `[REGISTER] User already exists: test@example.com`

### 3. Register Password Mismatch (400)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "Password123!",
    "passwordConfirm": "DifferentPassword!",
    "role": "TALENT",
    "kvkkConsent": true,
    "marketingConsent": false
  }'
```

**Expected Result:**
- Status: 400
- Response: `{"message": "Passwords do not match"}`
- Backend Log: `[REGISTER] Password mismatch for email: test2@example.com`

### 4. Login Success Case
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Expected Result:**
- Status: 200
- Response: `{"access_token": "...", "refresh_token": "...", "user": {...}}`
- Backend Log: `[LOGIN] Login successful for user: {userId} | Email: test@example.com | Role: TALENT`

### 5. Login Invalid Credentials (401)
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Result:**
- Status: 401
- Response: `{"message": "Invalid credentials"}`
- Backend Log: `[LOGIN] Invalid credentials for email: test@example.com`

## Evidence Collection

### Backend Logs
Check terminal output for:
- `[REGISTER]` entries with user creation details
- `[LOGIN]` entries with authentication results
- Password hash verification (exists but not exposed)

### Frontend Network Logs
Open browser DevTools → Network tab during registration:
- POST /api/auth/register
- Status codes and response bodies
- Payload verification

### Database Evidence (When Docker Available)
```sql
SELECT id, email, role, status, created_at, 
       CASE WHEN password_hash IS NOT NULL THEN 'YES' ELSE 'NO' END as password_hashed
FROM users 
WHERE email = 'test@example.com';
```

## Manual Test Execution Log

| Test Case | Status | Response Code | Backend Log | Notes |
|-----------|--------|---------------|-------------|-------|
| Register Success | ⏳ | - | - | To be executed |
| Duplicate Email | ⏳ | - | - | To be executed |
| Password Mismatch | ⏳ | - | - | To be executed |
| Login Success | ⏳ | - | - | To be executed |
| Invalid Login | ⏳ | - | - | To be executed |

## Next Steps
1. Execute manual tests
2. Document results with screenshots
3. Fix Docker setup for real DB testing
4. Create automated test suite
