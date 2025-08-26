/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@strapi-railway-framework/shared'],
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.railway.app',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
      },
    ],
  },
  env: {
    STRAPI_API_URL: process.env.STRAPI_API_URL || 'http://localhost:1337/api',
    STRAPI_MEDIA_URL: process.env.STRAPI_MEDIA_URL || 'http://localhost:1337',
  },
  async rewrites() {
    return [
      {
        source: '/api/strapi/:path*',
        destination: `${process.env.STRAPI_API_URL || 'http://localhost:1337/api'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig