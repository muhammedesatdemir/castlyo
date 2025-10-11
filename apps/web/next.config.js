/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000', pathname: '/**' },
      { protocol: 'https', hostname: 'castlyo.com', pathname: '/**' },
      { protocol: 'https', hostname: 'your-s3-bucket.amazonaws.com', pathname: '/**' },
    ],
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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://castlyo-web.onrender.com/api/proxy/api/v1'
        : 'http://localhost:3001'),
    WEB_API_BASE_URL: process.env.WEB_API_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://castlyo-web.onrender.com/api/proxy/api/v1'
        : 'http://localhost:3001'),
    WEB_API_PREFIX: process.env.WEB_API_PREFIX || '/api/v1',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 
      (process.env.NODE_ENV === 'production'
        ? 'https://castlyo-web.onrender.com'
        : 'http://localhost:3000'),
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-nextauth-secret-change-in-production',
  },
}

module.exports = nextConfig
