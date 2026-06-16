"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ForgotValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  })

  async function onSubmit(data: ForgotValues) {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    })
    setSent(true)
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 surface-glow">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-presence/10">
              <CheckCircle className="size-6 text-presence" />
            </div>
            <h2 className="text-xl font-bold text-text-high">Check your email</h2>
            <p className="mt-2 text-sm text-text-medium">
              If an account with that email exists, we&apos;ve sent a password reset link.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1 text-sm text-brand hover:text-brand-hover"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-high">Reset your password</h2>
              <p className="mt-1 text-sm text-text-medium">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-text-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low rounded-xl"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-brand text-white hover:bg-brand-hover rounded-xl"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-text-medium">
              <Link
                href="/login"
                className="text-brand hover:text-brand-hover underline underline-offset-4 decoration-brand/30"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
