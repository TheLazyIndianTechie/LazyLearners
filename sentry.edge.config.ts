import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Filter out noisy edge runtime errors
  ignoreErrors: [
    'Network request failed',
    'Failed to fetch',
    // Edge runtime specific errors
    'Runtime.UnknownIdentifier',
    'Runtime.InvalidHandler',
  ],

  // Add context for edge runtime
  initialScope: {
    tags: {
      component: 'gamelearn-platform-edge',
      runtime: 'edge',
      environment: process.env.NODE_ENV,
    },
  },
});