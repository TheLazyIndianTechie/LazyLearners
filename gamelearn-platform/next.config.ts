import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict build validation for production
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  },

  // Image optimization
  images: {
    domains: ['cdn.lazygamedevs.com', 'r2cdn.perplexity.ai'],
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
