"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Loader2,
  Expand,
} from "lucide-react"
import type { FileAttachment } from "@/types"
import { formatBytes } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface VideoPlayerProps {
  file: FileAttachment
}

const rangeThumbStyles = `
input[type="range"].range-thumb-sm {
  background: transparent;
}
input[type="range"].range-thumb-sm::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(to right, white var(--fill, 0%), rgba(255,255,255,0.2) var(--fill, 0%));
}
input[type="range"].range-thumb-sm::-moz-range-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
}
input[type="range"].range-thumb-sm::-moz-range-progress {
  height: 3px;
  border-radius: 2px;
  background: white;
}
input[type="range"].range-thumb-sm::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
input[type="range"].range-thumb-sm::-moz-range-thumb {
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  border: none;
}
`

export function VideoPlayer({ file }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<number | null>(null)

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Fetch signed URL
  useEffect(() => {
    if (downloadUrl) return
    fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`)
      .then((r) => r.json())
      .then(({ url }) => setDownloadUrl(url))
      .catch(console.error)
  }, [file.s3Key, downloadUrl])

  // Cleanup hide timer
  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    }
  }, [])

  const scheduleHide = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
    if (isPlaying) {
      hideTimerRef.current = window.setTimeout(() => setShowControls(false), 2500)
    }
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const val = parseFloat(e.target.value)
    video.volume = val
    setVolume(val)
    if (val === 0) {
      video.muted = true
      setIsMuted(true)
    } else if (video.muted) {
      video.muted = false
      setIsMuted(false)
    }
  }, [])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current
      const bar = progressRef.current
      if (!video || !bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      video.currentTime = frac * duration
    },
    [duration],
  )

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      setIsFullscreen(false)
    } else {
      await el.requestFullscreen()
      setIsFullscreen(true)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!downloadUrl) return
    setIsDownloading(true)
    try {
      const res = await fetch(downloadUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("[Video Download] Failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }, [downloadUrl, file.filename])

  // Fullscreen change listener
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleChange)
    return () => document.removeEventListener("fullscreenchange", handleChange)
  }, [])

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <style>{rangeThumbStyles}</style>
      <div
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden group"
        onMouseMove={scheduleHide}
        onMouseLeave={() => {
          if (isPlaying) {
            if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current)
            hideTimerRef.current = window.setTimeout(() => setShowControls(false), 1000)
          }
        }}
        onDoubleClick={toggleFullscreen}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <Loader2 className="size-8 text-white/60 animate-spin" />
          </div>
        )}

        {/* Video element */}
        {downloadUrl && (
          <video
            ref={videoRef}
            src={downloadUrl}
            className="w-full max-h-[70vh] object-contain"
            preload="metadata"
            playsInline
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedData={() => setIsLoading(false)}
            onTimeUpdate={() => {
              const v = videoRef.current
              if (v) setCurrentTime(v.currentTime)
            }}
            onLoadedMetadata={() => {
              const v = videoRef.current
              if (v) setDuration(v.duration)
            }}
            onWaiting={() => setIsBuffering(true)}
            onCanPlay={() => {
              setIsBuffering(false)
              setIsLoading(false)
            }}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Buffering spinner overlay */}
        {isBuffering && isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="size-8 text-white animate-spin" />
          </div>
        )}

        {/* Bottom controls bar */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/progress hover:h-1.5 transition-all"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity shadow" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>

            {/* Time */}
            <span className="text-[11px] text-white/80 font-medium tabular-nums shrink-0 min-w-[70px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer disabled:opacity-40"
              aria-label="Download video"
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
            </button>

            {/* Volume */}
            <div className="group/vol flex items-center">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full pl-1.5 pr-1 py-1 group-hover/vol:bg-white/15 transition-colors">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-3.5" />
                  ) : (
                    <Volume2 className="size-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 appearance-none cursor-pointer range-thumb-sm"
                  style={{ "--fill": `${(isMuted ? 0 : volume) * 100}%` } as React.CSSProperties}
                />
              </div>
            </div>

            {/* Expand to center */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer"
              aria-label="Expand video"
            >
              <Expand className="size-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>

          {/* File name */}
          <div className="mt-2 text-[10px] text-white/50 truncate">
            {file.filename} &middot; {formatBytes(file.sizeBytes)}
          </div>
        </div>

        {/* Top gradient for better readability */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/40 to-transparent h-16 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      </div>

      {/* Lightbox – centered video in a dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-5xl bg-black/95 border-border-subtle p-1 sm:p-2"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{file.filename}</DialogTitle>
          {downloadUrl && (
            <video
              src={downloadUrl}
              className="w-full max-h-[85vh] object-contain rounded-lg"
              controls
              autoPlay
              playsInline
            />
          )}
          <p className="text-center text-xs text-white/60 mt-1 pb-1 truncate">
            {file.filename} &middot; {formatBytes(file.sizeBytes)}
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
