"use client"

import { cn } from "@/lib/utils"

interface CustomBadgeProps {
  children: React.ReactNode
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "neutral"
  size?: "sm" | "md" | "lg"
  rounded?: boolean
  className?: string
}

export function CustomBadge({
  children,
  variant = "default",
  size = "md",
  rounded = true,
  className,
}: CustomBadgeProps) {
  const variantClasses = {
    default: "bg-bg-muted text-text-medium",
    primary: "bg-brand-subtle text-brand",
    secondary: "bg-bg-elevated text-text-high",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    neutral: "bg-bg-muted text-text-medium",
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        rounded && "rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
