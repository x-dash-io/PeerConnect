"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep p-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="size-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-6">
          <AlertTriangle className="size-8 text-danger" />
        </div>
        <h1 className="font-display text-xl font-bold text-text-high mb-2">Something went wrong</h1>
        <p className="text-sm text-text-medium mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>
        <Button onClick={reset} className="gap-2 bg-brand text-white hover:bg-brand-hover">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 w-full text-left">
            <summary className="text-xs text-text-low cursor-pointer hover:text-text-medium">
              Error details
            </summary>
            <pre className="mt-2 text-xs text-danger bg-bg-muted rounded-lg p-3 overflow-auto max-h-40">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
