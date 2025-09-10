/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'castlyo.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-change-in-production',
  },
}

module.exports = nextConfig
