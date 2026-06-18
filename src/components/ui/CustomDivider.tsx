"use client"

import { cn } from "@/lib/utils"

interface CustomDividerProps {
  className?: string
  orientation?: "horizontal" | "vertical"
  variant?: "solid" | "dashed" | "dotted" | "gradient"
  color?: "default" | "brand" | "muted"
}

export function CustomDivider({
  className,
  orientation = "horizontal",
  variant = "solid",
  color = "default",
}: CustomDividerProps) {
  const orientationClasses = {
    horizontal: "w-full h-px",
    vertical: "h-full w-px",
  }

  const variantClasses = {
    solid: "",
    dashed: "border-dashed",
    dotted: "border-dotted",
    gradient: "bg-gradient-to-r from-transparent via-border-subtle to-transparent",
  }

  const colorClasses = {
    default: "border-border-subtle",
    brand: "border-brand/30",
    muted: "border-text-low/30",
  }

  return (
    <div
      className={cn(
        orientationClasses[orientation],
        variantClasses[variant],
        colorClasses[color],
        className,
      )}
    />
  )
}
