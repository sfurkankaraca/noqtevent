import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN tanımlı değilse istemci tarafında da no-op'tur.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
});
