"use client"

import { cn } from "@/lib/utils"

interface CustomProgressProps {
  value: number
  max?: number
  className?: string
  variant?: "default" | "brand" | "success" | "warning" | "danger"
  showValue?: boolean
  animated?: boolean
}

export function CustomProgress({
  value,
  max = 100,
  className,
  variant = "brand",
  showValue = false,
  animated = true,
}: CustomProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const variantClasses = {
    default: "bg-brand",
    brand: "bg-brand",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-bg-muted",
          animated && "transition-all duration-300 ease-out",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant],
            animated && "transform-origin-left",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && <div className="mt-1 text-xs text-text-medium">{Math.round(percentage)}%</div>}
    </div>
  )
}
