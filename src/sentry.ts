import * as Sentry from "@sentry/react"

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

if (dsn && dsn.trim().length > 0) {
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_APP_ENV as string | undefined) ?? "development",
    tracesSampleRate: 0.1,
  })
}
