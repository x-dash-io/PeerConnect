"use client"

import { cn } from "@/lib/utils"

interface CustomSkeletonProps {
  className?: string
  animated?: boolean
  variant?: "default" | "text" | "avatar" | "button" | "card"
}

export function CustomSkeleton({
  className,
  animated = true,
  variant = "default",
}: CustomSkeletonProps) {
  const variantClasses = {
    default: "rounded-xl bg-bg-muted",
    text: "h-4 rounded bg-bg-muted",
    avatar: "size-10 rounded-full bg-bg-muted",
    button: "h-9 rounded-xl bg-bg-muted",
    card: "rounded-xl border border-border-subtle bg-bg-surface",
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variantClasses[variant],
        animated && "animate-pulse",
        className,
      )}
    />
  )
}
