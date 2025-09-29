/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'castlyo.com'],
  },
  async redirects() {
    return [
      {
        source: '/kvkk',
        destination: '/privacy',
        permanent: true,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    WEB_API_BASE_URL: process.env.WEB_API_BASE_URL || 'http://localhost:3001',
    WEB_API_PREFIX: process.env.WEB_API_PREFIX || '/api/v1',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-change-in-production',
  },
}

module.exports = nextConfig
