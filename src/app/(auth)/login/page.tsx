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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginValues) {
    setError(null)
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border-main bg-bg-surface p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-high">Welcome back</h2>
          <p className="mt-1 text-sm text-text-medium">Sign in to your professional workspace</p>
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
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-10 bg-bg-deep border-border-main text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
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
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-medium">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-brand hover:text-brand-hover underline underline-offset-4 decoration-brand/30"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
