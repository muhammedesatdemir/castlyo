// Client-side API URL (for browser requests) - should use proxy
export const API_BASE_URL = '/api/proxy';

// Internal API URL (for server-side requests from container)
export const INTERNAL_API_URL = 
  process.env.API_INTERNAL_URL || 
  process.env.INTERNAL_API_URL ||
  'http://api:3001';

export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 
  (process.env.NODE_ENV === 'production'
    ? 'https://castlyo-web.onrender.com'
    : 'http://localhost:3000');
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-change-in-production';
