"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Send, Trash2, Loader2, Play, Pause } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { WaveformBars } from "./WaveformBars"
import { uploadAudioBlob } from "@/lib/uploader"
import { toast } from "sonner"

interface AudioRecordButtonProps {
  onSend: (fileId: string, key: string, duration: number) => void
  disabled?: boolean
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function AudioRecordButton({ onSend, disabled }: AudioRecordButtonProps) {
  const { state, duration, audioBlob, analyser, start, stop, cancel } = useAudioRecorder()
  const [isSending, setIsSending] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Handle preview URL creation
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPreviewUrl(null)
    }
  }, [audioBlob])

  // Handle audio playback end
  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleStart = async () => {
    try {
      await start()
    } catch {
      toast.error("Microphone access denied. Please allow mic access in your browser.")
    }
  }

  // audioBlob is set async after stop() fires recorder.onstop
  const handleStopAndPreview = () => {
    stop()
  }

  const handleSend = async () => {
    if (!audioBlob || isSending) return
    setIsSending(true)
    try {
      const { fileId, key } = await uploadAudioBlob(audioBlob)
      onSend(fileId, key, duration)
      handleCancel() // Clean up states
      toast.success("Voice message sent")
    } catch (err) {
      console.error("[AudioRecordButton] Send failed:", err)
      toast.error("Failed to send voice message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleCancel = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    cancel()
  }

  // Idle state — just a Mic button
  if (state === "idle") {
    return (
      <button
        onClick={handleStart}
        disabled={disabled}
        className={cn(
          "mb-0.5 size-9 rounded-xl flex items-center justify-center shrink-0",
          "text-text-low hover:text-text-medium hover:bg-bg-muted transition-all active:scale-95",
          disabled && "opacity-40 cursor-not-allowed",
        )}
      >
        <Mic className="size-5" />
      </button>
    )
  }

  // Recording state
  if (state === "recording") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 flex-1 px-1"
      >
        {/* Pulsing red dot */}
        <div className="relative shrink-0">
          <motion.div
            className="size-2.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        </div>

        {/* Duration */}
        <span className="text-xs font-mono text-red-500 tabular-nums shrink-0">
          {formatDuration(duration)}
        </span>

        {/* Live waveform */}
        <WaveformBars analyser={analyser} isLive className="flex-1" />

        {/* Cancel */}
        <button
          onClick={handleCancel}
          className="size-8 rounded-full flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-all shrink-0"
        >
          <Trash2 className="size-4" />
        </button>

        {/* Stop */}
        <button
          onClick={handleStopAndPreview}
          className="size-9 rounded-xl flex items-center justify-center bg-red-500 text-white shadow-md hover:bg-red-600 transition-all active:scale-95 shrink-0"
        >
          <Square className="size-4 fill-current" />
        </button>
      </motion.div>
    )
  }

  // Stopped / review state
  if (state === "stopped") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 flex-1 px-1"
      >
        {previewUrl && (
          <audio ref={audioRef} src={previewUrl} onEnded={handleAudioEnded} className="hidden" />
        )}

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="size-8 rounded-full flex items-center justify-center bg-bg-muted text-text-high hover:bg-bg-hover transition-all shrink-0"
        >
          {isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Static waveform preview */}
        <WaveformBars analyser={null} isLive={false} className="flex-1" />

        {/* Duration */}
        <span className="text-xs font-mono text-text-medium tabular-nums shrink-0">
          {formatDuration(duration)}
        </span>

        {/* Cancel */}
        <button
          onClick={handleCancel}
          className="size-8 rounded-full flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-all shrink-0"
        >
          <Trash2 className="size-4" />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={isSending || !audioBlob}
          className={cn(
            "size-9 rounded-xl flex items-center justify-center bg-brand text-white shadow-md",
            "hover:bg-brand-hover transition-all active:scale-95 shrink-0",
            (isSending || !audioBlob) && "opacity-50 cursor-not-allowed",
          )}
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </motion.div>
    )
  }

  return null
}
