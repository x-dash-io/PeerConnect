"use client"

import { useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface WaveformBarsProps {
  analyser: AnalyserNode | null
  isLive: boolean
  barCount?: number
  className?: string
}

export function WaveformBars({ analyser, isLive, barCount = 20, className }: WaveformBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const staticBarsRef = useRef<number[]>([])

  const drawBars = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bars: number[], live: boolean) => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const barWidth = 3
      const gap = (width - barCount * barWidth) / (barCount - 1)
      const color = live
        ? getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#6366f1"
        : getComputedStyle(document.documentElement).getPropertyValue("--text-medium").trim() ||
          "#71717a"

      ctx.fillStyle = color || (live ? "#6366f1" : "#71717a")

      bars.forEach((magnitude, i) => {
        const barHeight = Math.max(height * magnitude, 3)
        const x = i * (barWidth + gap)
        const y = (height - barHeight) / 2
        const radius = barWidth / 2

        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, radius)
        ctx.fill()
      })
    },
    [barCount],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    if (!isLive || !analyser) {
      // Draw static frozen waveform from last captured values or default pattern
      cancelAnimationFrame(animFrameRef.current)
      const bars =
        staticBarsRef.current.length > 0
          ? staticBarsRef.current
          : Array.from({ length: barCount }, (_, i) => {
              // Decorative idle pattern — gentle curve
              return Math.sin((i / barCount) * Math.PI) * 0.5 + 0.1
            })

      drawBars(ctx, canvas, bars, false)
      return
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Sample `barCount` evenly-spaced frequency buckets
      const step = Math.floor(dataArray.length / barCount)
      const bars = Array.from({ length: barCount }, (_, i) => {
        const val = dataArray[i * step] / 255
        return Math.max(val, 0.05) // floor so bars never disappear completely
      })

      // Keep for frozen snapshot when stopped
      staticBarsRef.current = bars

      drawBars(ctx, canvas, bars, true)
    }

    draw()

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [analyser, isLive, barCount, drawBars])

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 4 + (barCount - 1) * 1}
      height={32}
      className={cn("shrink-0", className)}
    />
  )
}
