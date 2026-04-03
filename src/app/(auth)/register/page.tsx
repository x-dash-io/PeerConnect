"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/shared/Logo"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type RegisterValues = z.infer<typeof registerSchema>

function getPasswordStrength(password: string): { label: string; width: string; color: string } {
  if (password.length === 0) return { label: "", width: "0%", color: "" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { label: "Weak", width: "33%", color: "bg-danger" }
  if (score <= 3) return { label: "Fair", width: "66%", color: "bg-warn" }
  return { label: "Strong", width: "100%", color: "bg-presence" }
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch("password", "")
  const strength = getPasswordStrength(passwordValue)

  async function onSubmit(data: RegisterValues) {
    setError(null)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || "Registration failed")
      return
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError("Account created but sign-in failed. Please log in manually.")
      return
    }

    router.push("/onboarding")
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border-main bg-bg-surface p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-high">Create your account</h2>
          <p className="mt-1 text-sm text-text-medium">Join the professional workspace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-text-medium">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              aria-invalid={!!errors.name}
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
              {...register("password")}
            />
            {passwordValue.length > 0 && (
              <div className="space-y-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-text-low">{strength.label}</p>
              </div>
            )}
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
              aria-invalid={!!errors.confirmPassword}
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full bg-brand text-white hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand hover:text-brand-hover underline underline-offset-4 decoration-brand/30"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
