import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Don't send sensitive environment variables
  beforeSend(event) {
    // Remove sensitive data from server errors
    if (event.exception) {
      event.exception.values?.forEach((exception) => {
        if (exception.stacktrace?.frames) {
          exception.stacktrace.frames.forEach((frame) => {
            delete frame.vars;
          });
        }
      });
    }

    // Don't send environment variables
    if (event.contexts?.runtime?.name) {
      delete event.contexts.runtime;
    }

    return event;
  },

  // Filter out noisy server errors
  ignoreErrors: [
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'TIMEOUT',
    // Database connection errors (should be handled by app logic)
    'Connection terminated',
    'Connection refused',
  ],

  // Add context for game development platform
  initialScope: {
    tags: {
      component: 'gamelearn-platform',
      environment: process.env.NODE_ENV,
    },
  },
});