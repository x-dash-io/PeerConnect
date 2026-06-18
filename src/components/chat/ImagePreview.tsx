"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ZoomIn } from "lucide-react"
import { cn, formatBytes } from "@/lib/utils"
import type { FileAttachment } from "@/types"

interface ImagePreviewProps {
  file: FileAttachment
}

/* eslint-disable @next/next/no-img-element */
export function ImagePreview({ file }: ImagePreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
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
      { rootMargin: "100px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fetch signed URL when the image becomes visible
  useEffect(() => {
    if (!isVisible || downloadUrl) return

    fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`)
      .then((r) => r.json())
      .then(({ url }) => setDownloadUrl(url))
      .catch(console.error)
  }, [isVisible, file.s3Key, downloadUrl])

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative rounded-xl overflow-hidden cursor-zoom-in group/img",
          "max-w-[240px]",
        )}
        onClick={() => downloadUrl && setLightboxOpen(true)}
      >
        {/* Skeleton while loading */}
        {(!isLoaded || !downloadUrl) && <Skeleton className="w-[240px] h-[180px] rounded-xl" />}

        {/* Lazy-loaded image */}
        {downloadUrl && (
          <img
            src={downloadUrl}
            alt={file.filename}
            onLoad={() => setIsLoaded(true)}
            className={cn(
              "max-w-[240px] max-h-[300px] w-auto h-auto rounded-xl object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0 absolute inset-0",
            )}
          />
        )}

        {/* Hover zoom hint + Size overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all duration-200 rounded-xl flex items-center justify-center">
          <ZoomIn className="size-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-200" />

          {/* File size badge - always visible bottom right */}
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm shadow-sm border border-white/10 text-[9px] font-medium text-white/90 select-none">
            {formatBytes(file.sizeBytes)}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl bg-bg-deep/95 backdrop-blur-xl border-border-subtle p-2">
          <DialogTitle className="sr-only">{file.filename}</DialogTitle>
          <img
            src={downloadUrl ?? ""}
            alt={file.filename}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
          <p className="text-center text-xs text-text-low mt-1 pb-1">{file.filename}</p>
        </DialogContent>
      </Dialog>
    </>
  )
}
