import * as Sentry from "@sentry/react";

Sentry.init({
  // 🔑 Replace with your actual DSN from the Sentry dashboard
  dsn: "https://5e81d55caae0d69287e50b3fc7e22afe@o4511807488196608.ingest.us.sentry.io/4511807491735552",

  // Enables performance tracking & session replay for frontend sessions
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,

  // Set tracePropagationTargets to connect your React frontend to your Azure backend
  tracePropagationTargets: [
    "localhost", 
    "https://api.happybush-e43d89b2.eastus.azurecontainerapps.io"
  ],

  // Session Replay sampling rate
  replaysSessionSampleRate: 0.1, // Captures 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // Captures 100% of sessions where an error occurs
});