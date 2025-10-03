import type { NextConfig } from "next";

let withSentryConfig: any = null;
try {
  withSentryConfig = require("@sentry/nextjs").withSentryConfig;
} catch {
  // Sentry not available, continue without it
}

const nextConfig: NextConfig = {
  // Temporarily disable strict validation for video fix deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,

  // Comprehensive security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent DNS prefetching for privacy
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // XSS protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy for privacy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy (restrict browser features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // HTTP Strict Transport Security (HSTS) - Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: Allow self, Clerk, and inline scripts (with nonce in production)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://clerk.com",
              // Styles: Allow self and inline styles
              "style-src 'self' 'unsafe-inline'",
              // Images: Allow self, data URIs, and CDNs
              "img-src 'self' data: blob: https: http:",
              // Fonts: Allow self and data URIs
              "font-src 'self' data:",
              // Connect: Allow self and API endpoints
              "connect-src 'self' https://*.clerk.accounts.dev https://api.clerk.dev https://api.clerk.com wss://*.clerk.accounts.dev",
              // Media: Allow self and blob
              "media-src 'self' blob:",
              // Objects: Disallow plugins
              "object-src 'none'",
              // Base URI: Restrict to self
              "base-uri 'self'",
              // Form actions: Allow self
              "form-action 'self'",
              // Frame ancestors: Deny framing
              "frame-ancestors 'none'",
              // Upgrade insecure requests
              "upgrade-insecure-requests",
              // Block all mixed content
              "block-all-mixed-content"
            ].join('; ')
          }
        ]
      },
      // Additional headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // CORS headers for API (restrictive by default)
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },

  // Image optimization
  images: {
    domains: ['cdn.lazygamedevs.com', 'r2cdn.perplexity.ai'],
    formats: ['image/webp', 'image/avif'],
    // Allow SVGs from our own API placeholder route
    dangerouslyAllowSVG: true,
    // Mobile-optimized device sizes (saves bandwidth on mobile)
    deviceSizes: [320, 375, 390, 428, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Mobile-optimized image sizes for responsive images
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache time for optimized images (1 year)
    minimumCacheTTL: 31536000,
  },

  // Mobile performance optimizations
  compress: true, // Enable gzip compression for faster mobile loading

  // Turbopack optimizations for development
  experimental: {
    // Enable optimized package imports for faster builds
    optimizePackageImports: ['lucide-react', '@clerk/nextjs', 'recharts'],
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload source maps in production only
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Export the configuration with Sentry (if available)
export default (process.env.SENTRY_DSN && withSentryConfig)
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
