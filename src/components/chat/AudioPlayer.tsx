"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Loader2, FileText, ChevronUp } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AudioPlayerProps {
  s3Key: string
  messageId?: string
  duration?: number
  isSelf: boolean
  initialTranscription?: string | null
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function AudioPlayer({
  s3Key,
  messageId,
  duration = 0,
  isSelf,
  initialTranscription,
}: AudioPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration)

  // Transcription state
  const [transcription, setTranscription] = useState<string | null>(initialTranscription ?? null)
  const [showTranscription, setShowTranscription] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Fetch signed URL lazily — only on first play
  const fetchUrl = async () => {
    if (signedUrl || isLoading) return null
    setIsLoading(true)
    try {
      const res = await fetch(`/api/uploads/download?key=${encodeURIComponent(s3Key)}`)
      const { url } = await res.json()
      setSignedUrl(url)
      return url
    } catch (err) {
      console.error("[AudioPlayer] URL fetch failed:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (!signedUrl) {
      const url = await fetchUrl()
      if (!url) return
      await new Promise((r) => setTimeout(r, 50))
    }

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) setTotalDuration(audio.duration)
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
    }
  }, [])

  const handleTranscribe = async () => {
    // If we already have a transcription, just toggle visibility
    if (transcription) {
      setShowTranscription((v) => !v)
      return
    }

    if (!messageId) return
    setIsTranscribing(true)
    setTranscribeError(null)

    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, s3Key }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "Transcription failed")
      }

      const { transcription: text } = await res.json()
      setTranscription(text)
      setShowTranscription(true)
    } catch (err) {
      console.error("[AudioPlayer] Transcription error:", err)
      setTranscribeError("Could not transcribe. Please try again.")
    } finally {
      setIsTranscribing(false)
    }
  }

  const WAVEFORM = [
    0.3, 0.5, 0.7, 0.6, 0.9, 0.8, 0.5, 0.4, 0.7, 0.6, 0.5, 0.8, 0.9, 0.6, 0.4, 0.7, 0.5, 0.6, 0.4,
    0.3,
  ]
  const progress = totalDuration > 0 ? currentTime / totalDuration : 0

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl overflow-hidden min-w-[220px] max-w-[300px]",
        isSelf ? "bg-white/10" : "bg-bg-muted",
      )}
    >
      {/* Player row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Hidden audio */}
        {signedUrl ? (
          <audio ref={audioRef} src={signedUrl} preload="metadata" className="hidden" />
        ) : (
          <audio ref={audioRef} className="hidden" />
        )}

        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={cn(
            "size-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95",
            isSelf
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-brand/10 text-brand hover:bg-brand/20",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform + timestamps */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-[2px] h-6">
            {WAVEFORM.map((mag, i) => {
              const filled = i / WAVEFORM.length <= progress
              return (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-colors duration-100",
                    filled
                      ? isSelf
                        ? "bg-white"
                        : "bg-brand"
                      : isSelf
                        ? "bg-white/30"
                        : "bg-text-low/30",
                  )}
                  style={{ height: `${Math.max(mag * 100, 15)}%` }}
                />
              )
            })}
          </div>
          <div
            className={cn(
              "flex justify-between text-[10px] tabular-nums",
              isSelf ? "text-white/60" : "text-text-low",
            )}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Transcribe button */}
      {messageId && (
        <div className={cn("px-3 pb-2.5 -mt-1 flex items-center gap-1.5")}>
          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold transition-colors",
              isSelf ? "text-white/60 hover:text-white/90" : "text-text-low hover:text-text-medium",
              isTranscribing && "opacity-60 cursor-not-allowed",
            )}
          >
            {isTranscribing ? (
              <Loader2 className="size-3 animate-spin" />
            ) : transcription && showTranscription ? (
              <ChevronUp className="size-3" />
            ) : (
              <FileText className="size-3" />
            )}
            <span>
              {isTranscribing
                ? "Transcribing..."
                : transcription && showTranscription
                  ? "Hide transcript"
                  : "Transcribe"}
            </span>
          </button>
        </div>
      )}

      {/* Transcription text */}
      <AnimatePresence>
        {showTranscription && transcription && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "px-3 pb-3 text-[12px] italic leading-relaxed",
                isSelf ? "text-white/80" : "text-text-medium",
              )}
            >
              &quot;{transcription}&quot;
            </div>
          </motion.div>
        )}

        {transcribeError && !showTranscription && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-2 text-[11px] text-red-400"
          >
            {transcribeError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
