import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  integrations: [
    // Custom performance monitoring for game dev specific workflows
    Sentry.replayIntegration({
      // Capture only 10% of sessions in production
      sessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,
      // If error occurs, capture 100% of the session
      errorSampleRate: 1.0,
    }),
  ],

  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Don't send sensitive environment variables
  beforeSend(event) {
    // Remove sensitive data
    if (event.exception) {
      event.exception.values?.forEach((exception) => {
        if (exception.stacktrace?.frames) {
          exception.stacktrace.frames.forEach((frame) => {
            delete frame.vars;
          });
        }
      });
    }
    return event;
  },

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    'Non-Error promise rejection captured',
    'Script error.',
    'Network request failed',
    // React hydration mismatches (common in dev)
    'Hydration failed',
    'There was an error while hydrating',
  ],
});