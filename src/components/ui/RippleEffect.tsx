"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface RippleEffectProps {
  children: React.ReactNode
  className?: string
  rippleColor?: string
  duration?: number
}

export function RippleEffect({
  children,
  className,
  rippleColor = "var(--brand)",
  duration = 300,
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = { x, y, id: Date.now() }
    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, duration)
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={
            {
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
              backgroundColor: rippleColor,
              opacity: 0.3,
              transform: "translate(-50%, -50%)",
            } as React.CSSProperties
          }
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          to {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple ${duration}ms linear;
        }
      `}</style>
    </div>
  )
}
