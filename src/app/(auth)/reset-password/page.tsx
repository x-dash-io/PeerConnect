"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetValues = z.infer<typeof resetSchema>

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  })

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="size-6 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text-high">Invalid reset link</h2>
        <p className="mt-2 text-sm text-text-medium">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 text-sm text-brand hover:text-brand-hover underline underline-offset-4"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  async function onSubmit(data: ResetValues) {
    setError(null)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password: data.password }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg || "Failed to reset password")
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 3000)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-presence/10">
          <CheckCircle className="size-6 text-presence" />
        </div>
        <h2 className="text-xl font-bold text-text-high">Password updated</h2>
        <p className="mt-2 text-sm text-text-medium">
          Your password has been reset successfully. Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-high">Set new password</h2>
        <p className="mt-1 text-sm text-text-medium">Choose a new password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-text-medium">
            New Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low rounded-xl"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-text-medium">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low rounded-xl"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full bg-brand text-white hover:bg-brand-hover rounded-xl"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Reset Password"}
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
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
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
