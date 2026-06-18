"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CustomEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  iconClassName?: string
}

export function CustomEmptyState({
  icon,
  title,
  description,
  action,
  className,
  iconClassName,
}: CustomEmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      {icon && (
        <div
          className={cn(
            "size-16 rounded-full bg-bg-muted flex items-center justify-center mb-4",
            iconClassName,
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-text-high mb-2">{title}</h3>
      {description && <p className="text-sm text-text-medium max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
