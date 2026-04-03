"use client"

import { X, FileText, ImageIcon, Video, Music } from "lucide-react"
import { motion } from "framer-motion"
import { formatBytes } from "@/lib/utils"

interface UploadProgressProps {
  filename: string
  sizeBytes: number
  percentage: number
  onCancel: () => void
}

export function UploadProgress({ filename, sizeBytes, percentage, onCancel }: UploadProgressProps) {
  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return <ImageIcon className="size-5 text-brand" />
    if (["mp4", "webm", "mov"].includes(ext || "")) return <Video className="size-5 text-brand" />
    if (["mp3", "wav", "ogg"].includes(ext || "")) return <Music className="size-5 text-brand" />
    return <FileText className="size-5 text-brand" />
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0, y: 10 }}
      animate={{ height: "auto", opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: 10 }}
      className="bg-bg-elevated border-b border-border-subtle"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="size-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          {getFileIcon(filename)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-xs font-semibold text-text-high truncate">{filename}</span>
              <span className="text-[10px] text-text-low shrink-0">{formatBytes(sizeBytes)}</span>
            </div>
            <span className="text-[10px] font-bold text-brand tabular-nums">
              {Math.round(percentage)}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand to-brand-hover shadow-[0_0_8px_rgba(var(--brand-rgb),0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            />
          </div>
        </div>

        <button
          onClick={onCancel}
          className="size-8 rounded-full flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}
