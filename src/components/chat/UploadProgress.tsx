"use client"

import { X, FileText, ImageIcon, Video, Music, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { formatBytes } from "@/lib/utils"

interface UploadProgressProps {
  filename: string
  sizeBytes: number
  percentage: number
  onCancel: () => void
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
    return <ImageIcon className="size-5 text-indigo-500" />
  if (["mp4", "webm", "mov"].includes(ext || ""))
    return <Video className="size-5 text-indigo-500" />
  if (["mp3", "wav", "ogg"].includes(ext || "")) return <Music className="size-5 text-indigo-500" />
  return <FileText className="size-5 text-indigo-500" />
}

function getFileTypeLabel(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "Image"
  if (["mp4", "webm", "mov"].includes(ext || "")) return "Video"
  if (["mp3", "wav", "ogg"].includes(ext || "")) return "Audio"
  return "Document"
}

export function UploadProgress({ filename, sizeBytes, percentage, onCancel }: UploadProgressProps) {
  const pct = Math.round(percentage)
  const loadedBytes = Math.round((percentage / 100) * sizeBytes)

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent border-b border-indigo-500/10"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="relative mt-0.5">
          <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20">
            {pct >= 100 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
              >
                {getFileIcon(filename)}
              </motion.div>
            ) : (
              <Loader2 className="size-4 text-indigo-500 animate-spin" />
            )}
          </div>
          {pct < 100 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 size-4 rounded-full bg-indigo-500 border-2 border-white dark:border-bg-deep"
            />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-text-high truncate">{filename}</span>
                <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider shrink-0">
                  {getFileTypeLabel(filename)}
                </span>
              </div>
              <p className="text-[11px] text-text-low mt-0.5">
                {pct < 100 ? (
                  <>
                    {formatBytes(loadedBytes)} of {formatBytes(sizeBytes)}
                  </>
                ) : (
                  <span className="text-emerald-500 font-medium">Upload complete</span>
                )}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="size-7 rounded-lg flex items-center justify-center text-text-low hover:text-danger hover:bg-danger/10 transition-colors shrink-0 mt-0.5"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="h-2 w-full bg-indigo-500/10 rounded-full overflow-hidden ring-1 ring-indigo-500/5">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  pct >= 100
                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                    : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                boxShadow:
                  pct >= 100
                    ? "0 0 12px rgba(34, 197, 94, 0.4)"
                    : "0 0 12px rgba(99, 102, 241, 0.3)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between">
            <motion.span
              key={pct}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[11px] font-bold text-indigo-500 tabular-nums"
            >
              {pct < 100 ? `${pct}%` : "100%"}
            </motion.span>
            {pct < 100 && (
              <span className="text-[10px] text-text-low">
                {loadedBytes > 0
                  ? `${Math.round((sizeBytes - loadedBytes) / 1024)} KB remaining`
                  : "Starting..."}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
