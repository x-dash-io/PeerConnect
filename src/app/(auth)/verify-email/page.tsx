"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading")
  const [error, setError] = useState("")

  useState(() => {
    if (!token || !email) {
      setStatus("error")
      setError("Invalid verification link.")
      return
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then((res) => {
        if (res.ok) {
          setStatus("verified")
          setTimeout(() => router.push("/login"), 3000)
        } else {
          return res.json().then((d) => {
            setStatus("error")
            setError(d.error || "Verification failed")
          })
        }
      })
      .catch(() => {
        setStatus("error")
        setError("Network error")
      })
  })

  return (
    <div className="flex flex-col items-center text-center">
      {status === "loading" && (
        <>
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand/10">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
          <h2 className="text-xl font-bold text-text-high">Verifying your email...</h2>
        </>
      )}

      {status === "verified" && (
        <>
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-presence/10">
            <CheckCircle className="size-6 text-presence" />
          </div>
          <h2 className="text-xl font-bold text-text-high">Email verified</h2>
          <p className="mt-2 text-sm text-text-medium">Redirecting you to sign in...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="size-6 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-text-high">Verification failed</h2>
          <p className="mt-2 text-sm text-text-medium">{error}</p>
          <Link
            href="/login"
            className="mt-6 text-sm text-brand hover:text-brand-hover underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 surface-glow">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-text-low" />
            </div>
          }
        >
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  )
}
