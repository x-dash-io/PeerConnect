"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { cn } from "@/lib/utils"

interface WaveformBarsProps {
  analyser: AnalyserNode | null
  isLive: boolean
  barCount?: number
  className?: string
}

const BAR_HEIGHT_PX = 28
const BAR_WIDTH_PX = 2
const BAR_GAP_PX = 2

export function WaveformBars({ analyser, isLive, barCount = 28, className }: WaveformBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const staticBarsRef = useRef<number[]>([])
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width on mount/resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  const totalBarWidth = barCount * BAR_WIDTH_PX + (barCount - 1) * BAR_GAP_PX

  const drawBars = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bars: number[], live: boolean) => {
      const dpr = window.devicePixelRatio || 1
      const cssWidth = canvas.clientWidth || canvas.width / dpr
      const cssHeight = canvas.clientHeight || canvas.height / dpr

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cssWidth, cssHeight)

      const color = live
        ? getComputedStyle(document.documentElement).getPropertyValue("--brand").trim() || "#6366f1"
        : getComputedStyle(document.documentElement).getPropertyValue("--text-medium").trim() ||
          "#71717a"

      ctx.fillStyle = color || (live ? "#6366f1" : "#71717a")

      const availableWidth = cssWidth - 4
      const gap = Math.max(1, (availableWidth - barCount * BAR_WIDTH_PX) / (barCount - 1))
      const barHeightMax = cssHeight - 4

      bars.forEach((magnitude, i) => {
        const barHeight = Math.max(barHeightMax * magnitude, 2)
        const x = 2 + i * (BAR_WIDTH_PX + gap)
        const y = (cssHeight - barHeight) / 2
        const radius = BAR_WIDTH_PX / 2

        ctx.beginPath()
        ctx.roundRect(x, y, BAR_WIDTH_PX, barHeight, radius)
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

    const dpr = window.devicePixelRatio || 1
    const cssWidth = containerWidth || canvas.clientWidth || totalBarWidth + 4
    const cssHeight = BAR_HEIGHT_PX

    canvas.width = cssWidth * dpr
    canvas.height = cssHeight * dpr

    if (!isLive || !analyser) {
      cancelAnimationFrame(animFrameRef.current)
      const bars =
        staticBarsRef.current.length > 0
          ? staticBarsRef.current
          : Array.from({ length: barCount }, (_, i) => {
              return Math.sin((i / barCount) * Math.PI) * 0.5 + 0.1
            })

      drawBars(ctx, canvas, bars, false)
      return
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const step = Math.floor(dataArray.length / barCount)
      const bars = Array.from({ length: barCount }, (_, i) => {
        const val = dataArray[i * step] / 255
        return Math.max(val, 0.05)
      })

      staticBarsRef.current = bars
      drawBars(ctx, canvas, bars, true)
    }

    draw()

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [analyser, isLive, barCount, drawBars, containerWidth, totalBarWidth])

  return (
    <div ref={containerRef} className={cn("flex-1 min-w-0", className)}>
      <canvas ref={canvasRef} className="w-full" style={{ height: `${BAR_HEIGHT_PX}px` }} />
    </div>
  )
}
