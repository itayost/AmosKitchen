// sentry.client.config.ts
// This file configures the initialization of Sentry on the client (browser).
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance Monitoring - sample 10% of transactions (free tier optimization)
  tracesSampleRate: 0.1,

  // Session Replay - disabled to save quota
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter sensitive data before sending to Sentry
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== 'production') {
      return null;
    }

    // Remove potentially sensitive URL parameters
    if (event.request?.url) {
      const url = new URL(event.request.url);
      // Clear sensitive query params
      ['token', 'key', 'password', 'secret'].forEach(param => {
        url.searchParams.delete(param);
      });
      event.request.url = url.toString();
    }

    // Remove any potential customer data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data?.url) {
          // Redact query parameters from URLs in breadcrumbs
          try {
            const url = new URL(breadcrumb.data.url);
            url.search = '';
            breadcrumb.data.url = url.toString();
          } catch {
            // If URL parsing fails, just keep original
          }
        }
        return breadcrumb;
      });
    }

    return event;
  },
});
