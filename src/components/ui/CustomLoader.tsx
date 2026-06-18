"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "brand" | "subtle"
  className?: string
}

export function CustomLoader({ size = "md", variant = "default", className }: CustomLoaderProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
    xl: "size-12",
  }

  const variantClasses = {
    default: "text-text-medium",
    brand: "text-brand",
    subtle: "text-text-low",
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size], variantClasses[variant])} />
    </div>
  )
}
