"use client"

import { useState, useRef, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { VideoIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileAttachment } from "@/types"

interface VideoPlayerProps {
  file: FileAttachment
  isSelf: boolean
}

export function VideoPlayer({ file, isSelf }: VideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "150px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fetch signed URL when the video becomes visible
  useEffect(() => {
    if (!isVisible || videoUrl) return

    const fetchUrls = async () => {
      try {
        const [videoRes, thumbRes] = await Promise.all([
          fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`),
          file.thumbnailS3Key
            ? fetch(`/api/uploads/download?key=${encodeURIComponent(file.thumbnailS3Key)}`)
            : Promise.resolve(null),
        ])

        const { url } = await videoRes.json()
        setVideoUrl(url)

        if (thumbRes) {
          const { url: thumbUrl } = await thumbRes.json()
          setThumbnailUrl(thumbUrl)
        }
      } catch (error) {
        console.error("[VideoPlayer] Failed to fetch URLs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUrls()
  }, [isVisible, file.s3Key, file.thumbnailS3Key, videoUrl])

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-xl overflow-hidden", "max-w-[320px] w-full")}
    >
      {/* Skeleton while loading */}
      {isLoading && (
        <div className="relative">
          <Skeleton className="w-[320px] h-[200px] rounded-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoIcon className="size-8 text-text-low animate-pulse" />
          </div>
        </div>
      )}

      {/* Video element — no autoplay */}
      {videoUrl && (
        <video
          src={videoUrl}
          poster={thumbnailUrl ?? undefined}
          controls
          preload="metadata"
          className="w-full h-auto max-h-[240px] rounded-xl bg-black"
          onLoadedMetadata={() => setIsLoading(false)}
        />
      )}

      {/* Filename label below video */}
      <p
        className={cn(
          "text-[10px] mt-1 truncate px-0.5",
          isSelf ? "text-white/60" : "text-text-low",
        )}
      >
        {file.filename}
      </p>
    </div>
  )
}
