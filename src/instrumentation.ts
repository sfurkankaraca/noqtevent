import * as Sentry from "@sentry/nextjs";

// SENTRY_DSN tanımlı değilse Sentry.init dsn:undefined ile no-op çalışır —
// bu dosya prod hatalarını yakalamak için Vercel'e SENTRY_DSN eklenene kadar sessiz kalır.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
