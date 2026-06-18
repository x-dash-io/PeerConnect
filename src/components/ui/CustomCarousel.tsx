"use client"

import { useState, useEffect, ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomCarouselProps {
  children: ReactNode[]
  className?: string
  itemsToShow?: number
  autoPlay?: boolean
  autoPlayInterval?: number
  showArrows?: boolean
  showDots?: boolean
  infinite?: boolean
}

export function CustomCarousel({
  children,
  className,
  itemsToShow = 1,
  autoPlay = false,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  infinite = true,
}: CustomCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const maxIndex = infinite ? children.length : children.length - itemsToShow

  const nextSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const prevSlide = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  useEffect(() => {
    if (!autoPlay) return

    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, autoPlayInterval, maxIndex])

  if (children.length <= itemsToShow) {
    return <div className={cn("grid gap-4", className)}>{children}</div>
  }

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden rounded-xl">
        <div
          className={cn("flex transition-transform duration-300 ease-in-out", "gap-4")}
          style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className={cn("flex-shrink-0", `w-[${100 / itemsToShow}%]`)}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-bg-surface/80 backdrop-blur-sm border border-border-subtle flex items-center justify-center hover:bg-bg-surface transition-all duration-200"
            disabled={!infinite && currentIndex === 0}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-bg-surface/80 backdrop-blur-sm border border-border-subtle flex items-center justify-center hover:bg-bg-surface transition-all duration-200"
            disabled={!infinite && currentIndex >= maxIndex}
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {showDots && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "size-2 rounded-full transition-all duration-200",
                index === currentIndex ? "bg-brand w-8" : "bg-border-subtle hover:bg-text-low",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
