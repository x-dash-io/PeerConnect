"use client"

import { useState } from "react"
import { FileText, ImageIcon, Video, Music, File, Archive, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/utils"
import type { FileAttachment } from "@/types"

interface FileAttachmentCardProps {
  file: FileAttachment
  isSelf: boolean
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />
  if (mimeType.startsWith("video/")) return <Video className="size-5" />
  if (mimeType.startsWith("audio/")) return <Music className="size-5" />
  if (mimeType === "application/pdf") return <FileText className="size-5" />
  if (
    ["application/zip", "application/x-rar-compressed", "application/x-zip-compressed"].includes(
      mimeType,
    )
  )
    return <Archive className="size-5" />
  return <File className="size-5" />
}

export function FileAttachmentCard({ file, isSelf }: FileAttachmentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`)
      if (!res.ok) throw new Error("Failed to get download URL")
      const { url } = await res.json()
      window.open(url, "_blank")
    } catch (error) {
      console.error("[Download] Failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl p-3 min-w-[220px] max-w-[280px]",
        isSelf ? "bg-white/10 border border-white/20" : "bg-bg-muted border border-border-subtle",
      )}
    >
      {/* File type icon */}
      <div
        className={cn(
          "size-10 rounded-lg flex items-center justify-center shrink-0",
          isSelf ? "bg-white/15 text-white" : "bg-brand/10 text-brand",
        )}
      >
        {getFileIcon(file.mimeType)}
      </div>

      {/* Info + download */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold truncate leading-tight",
            isSelf ? "text-white" : "text-text-high",
          )}
        >
          {file.filename}
        </p>
        <p className={cn("text-[11px] mt-0.5", isSelf ? "text-white/60" : "text-text-low")}>
          {formatBytes(file.sizeBytes)}
        </p>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={cn(
            "flex items-center gap-1 text-[11px] font-semibold mt-2 transition-colors",
            isSelf ? "text-white/80 hover:text-white" : "text-brand hover:text-brand-hover",
          )}
        >
          {isDownloading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Download className="size-3" />
          )}
          {isDownloading ? "Preparing..." : "Download"}
        </button>
      </div>
    </div>
  )
}
