"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface CustomScrollbarProps {
  children: React.ReactNode
  className?: string
  trackClassName?: string
}

export function CustomScrollbar({ children, className, trackClassName }: CustomScrollbarProps) {
  const [isScrolling, setIsScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      setIsScrolling(true)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      container.removeEventListener("scroll", handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto scrollbar-hide [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar]:h-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--border-subtle)] [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-200 hover:[&::-webkit-scrollbar-thumb]:bg-[var(--text-low)]",
        className,
      )}
    >
      {children}
      <div
        className={cn(
          "absolute right-1 top-1 bottom-1 w-1 rounded-full bg-transparent transition-all duration-300",
          isScrolling ? "bg-border-subtle" : "bg-transparent",
          trackClassName,
        )}
      />
    </div>
  )
}
