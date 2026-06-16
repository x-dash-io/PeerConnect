"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AppErrorBoundary]", error)
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex h-full items-center justify-center bg-bg-deep p-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="size-14 rounded-2xl bg-danger/10 flex items-center justify-center mb-5">
          <AlertTriangle className="size-7 text-danger" />
        </div>
        <h2 className="font-display text-lg font-bold text-text-high mb-1">Something went wrong</h2>
        <p className="text-sm text-text-medium mb-6">An error occurred in this section.</p>
        <Button
          onClick={reset}
          size="sm"
          className="gap-2 bg-brand text-white hover:bg-brand-hover"
        >
          <RefreshCw className="size-3.5" />
          Reload
        </Button>
      </div>
    </div>
  )
}
