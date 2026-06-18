"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
}

export function CustomDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  overlayClassName,
}: CustomDialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center p-4", overlayClassName)}
      onClick={() => onOpenChange(false)}
    >
      <div
        ref={ref}
        className={cn(
          "relative w-full max-w-md rounded-2xl bg-bg-surface shadow-2xl",
          "max-h-[90vh] overflow-y-auto",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border-subtle">
            {title && (
              <h2 className="font-display text-lg font-semibold text-text-high">{title}</h2>
            )}
            {description && <p className="text-sm text-text-medium mt-1">{description}</p>}
          </div>
        )}
        <div className="p-6">{children}</div>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 size-8 rounded-full bg-bg-muted hover:bg-bg-elevated text-text-medium hover:text-text-high transition-all duration-200 flex items-center justify-center"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
