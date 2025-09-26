# Castlyo Development Setup - Auth & API Connection

## Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```bash
# API Connection
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth Configuration  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-change-in-production

# Database
DATABASE_URL=postgresql://castlyo:castlyo_password@localhost:5432/castlyo

# Email (Development - Mailhog/Mailpit)
ENABLE_EMAIL_VERIFICATION=true
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@castlyo.com
```

## Development Servers

### 1. Start Database
Make sure PostgreSQL is running on localhost:5432 with the database `castlyo`.

### 2. Start API Server
```bash
cd apps/api
npm run dev
```
API should be available at http://localhost:3001

### 3. Start Web Server  
```bash
cd apps/web
npm run dev
```
Web should be available at http://localhost:3000

## Health Check

When you visit http://localhost:3000 in development mode, you'll see an "API Health Check" widget in the top-right corner that shows:

- ✅ **Connected**: API is running and responding properly
- ❌ **Failed**: API is not reachable (check if it's running on port 3001)
- 🔄 **Checking**: Initial connection test in progress

## API Endpoints

### Health Check
- `GET /api/v1/health` - Returns `{ ok: true }` if API is running

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration  
- `POST /api/v1/auth/verify` - Email verification

### Users
- `GET /api/v1/users/me` - Get current user profile

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (web app)
- Credentials are enabled for cookie-based auth

## Troubleshooting

### "Network error: Could not reach API server"
1. Check if API server is running: `curl http://localhost:3001/api/v1/health`
2. Verify DATABASE_URL is correct
3. Check PostgreSQL is running

### "HTTP 500: Internal Server Error"  
1. Check API server logs for errors
2. Verify database connection and schema migrations
3. Check if required environment variables are set

### CORS Errors
1. Verify API CORS settings allow localhost:3000
2. Check withCredentials is set to true in API requests
3. Ensure cookies/session configuration is correct

## Current Status

⚠️ **Note**: The API is currently undergoing schema alignment. Some advanced features (payments, complex permissions, search) may not work until schema issues are resolved.

**Working Features:**
- Health check endpoint
- Basic CORS setup
- Database connection

**In Progress:**
- User authentication endpoints
- Profile management
- Job posts (basic functionality)

**Pending:**
- Advanced permissions system
- Payment processing
- Search functionality
- Message system
