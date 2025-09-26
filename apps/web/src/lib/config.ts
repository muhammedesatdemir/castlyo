// Client-side API URL (for browser requests)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

// Internal API URL (for server-side requests from container)
export const INTERNAL_API_URL = 
  process.env.INTERNAL_API_URL || 
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-change-in-production';
