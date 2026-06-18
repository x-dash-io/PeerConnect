"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CustomTooltipProps {
  children: ReactNode
  content: ReactNode
  placement?: "top" | "bottom" | "left" | "right"
  delay?: number
  className?: string
  contentClassName?: string
}

export function CustomTooltip({
  children,
  content,
  placement = "top",
  delay = 200,
  className,
  contentClassName,
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 100)
  }

  const getPlacementClasses = () => {
    switch (placement) {
      case "top":
        return "bottom-full left-1/2 mb-2 -translate-x-1/2"
      case "bottom":
        return "top-full left-1/2 mt-2 -translate-x-1/2"
      case "left":
        return "right-full top-1/2 mr-2 -translate-y-1/2"
      case "right":
        return "left-full top-1/2 ml-2 -translate-y-1/2"
      default:
        return "bottom-full left-1/2 mb-2 -translate-x-1/2"
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm rounded-xl shadow-lg border backdrop-blur-sm",
            "bg-bg-surface/95 border-border-subtle text-text-high",
            getPlacementClasses(),
            contentClassName,
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
