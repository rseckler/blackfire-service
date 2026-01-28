import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable standalone output for Docker
  output: 'standalone',

  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
  }),
}

export default nextConfig
