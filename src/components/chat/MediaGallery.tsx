"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react"
import {
  ImageIcon,
  Video,
  File,
  Music,
  FileText,
  Archive,
  Download,
  Loader2,
  FolderOpen,
} from "lucide-react"
import { Sheet } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatBytes } from "@/lib/utils"

type MediaType = "images" | "videos" | "files" | "audio"

interface MediaItem {
  messageId: string
  fileId: string
  type: string
  s3Key: string
  filename: string
  mimeType: string
  sizeBytes: number
  senderName: string | null
  createdAt: string
}

interface GalleryData {
  images: MediaItem[]
  videos: MediaItem[]
  files: MediaItem[]
  audio: MediaItem[]
}

interface MediaGalleryProps {
  conversationId: string
  open: boolean
  onClose: () => void
}

const TABS: { key: MediaType; label: string; icon: React.ReactNode }[] = [
  { key: "images", label: "Photos", icon: <ImageIcon className="size-3.5" /> },
  { key: "videos", label: "Videos", icon: <Video className="size-3.5" /> },
  { key: "files", label: "Files", icon: <File className="size-3.5" /> },
  { key: "audio", label: "Audio", icon: <Music className="size-3.5" /> },
]

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5 text-brand" />
  if (mimeType.startsWith("video/")) return <Video className="size-5 text-indigo-400" />
  if (mimeType.startsWith("audio/")) return <Music className="size-5 text-violet-400" />
  if (mimeType === "application/pdf") return <FileText className="size-5 text-red-400" />
  if (["application/zip", "application/x-rar-compressed"].includes(mimeType))
    return <Archive className="size-5 text-amber-400" />
  return <File className="size-5 text-text-low" />
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
      <div className="size-14 rounded-2xl bg-bg-elevated flex items-center justify-center">
        <FolderOpen className="size-7 text-text-low" />
      </div>
      <p className="text-sm font-semibold text-text-medium">No {label} yet</p>
      <p className="text-xs text-text-low">Files shared in this conversation will appear here.</p>
    </div>
  )
}

export function MediaGallery({ conversationId, open, onClose }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<MediaType>("images")
  const [data, setData] = useState<GalleryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/files`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error("[MediaGallery] Failed to fetch:", err)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    if (open && !data) fetchData()
  }, [open, data, fetchData])

  const fetchSignedUrl = async (s3Key: string) => {
    const res = await fetch(`/api/uploads/download?key=${encodeURIComponent(s3Key)}`)
    const { url } = await res.json()
    return url as string
  }

  const handleImageClick = async (item: MediaItem) => {
    const url = await fetchSignedUrl(item.s3Key)
    setLightboxUrl(url)
    setLightboxOpen(true)
  }

  const handleDownload = async (item: MediaItem) => {
    setDownloadLoading(item.fileId)
    try {
      const url = await fetchSignedUrl(item.s3Key)
      window.open(url, "_blank")
    } finally {
      setDownloadLoading(null)
    }
  }

  const items = data?.[activeTab] ?? []

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Shared Files">
        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-4 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-brand text-brand"
                  : "border-transparent text-text-low hover:text-text-medium",
              )}
            >
              {tab.icon}
              {tab.label}
              {data && data[tab.key].length > 0 && (
                <span className="ml-0.5 bg-brand/15 text-brand rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {data[tab.key].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState label={TABS.find((t) => t.key === activeTab)?.label ?? "files"} />
          ) : activeTab === "images" ? (
            // 3-column photo grid
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {(items as MediaItem[]).map((item) => (
                <button
                  key={item.fileId}
                  onClick={() => handleImageClick(item)}
                  className="aspect-square overflow-hidden bg-bg-elevated hover:opacity-90 transition-opacity relative group"
                >
                  {/* Thumbnail loaded via signed URL on-demand — use bg trick + direct img tag */}
                  <MediaThumbnail s3Key={item.s3Key} filename={item.filename} />
                </button>
              ))}
            </div>
          ) : activeTab === "videos" ? (
            // Video list with download
            <div className="divide-y divide-border-subtle">
              {(items as MediaItem[]).map((item) => (
                <MediaListItem
                  key={item.fileId}
                  item={item}
                  icon={<Video className="size-5 text-indigo-400" />}
                  onDownload={() => handleDownload(item)}
                  isDownloading={downloadLoading === item.fileId}
                />
              ))}
            </div>
          ) : activeTab === "audio" ? (
            // Audio list
            <div className="divide-y divide-border-subtle">
              {(items as MediaItem[]).map((item) => (
                <MediaListItem
                  key={item.fileId}
                  item={item}
                  icon={<Music className="size-5 text-violet-400" />}
                  onDownload={() => handleDownload(item)}
                  isDownloading={downloadLoading === item.fileId}
                />
              ))}
            </div>
          ) : (
            // Generic files list
            <div className="divide-y divide-border-subtle">
              {(items as MediaItem[]).map((item) => (
                <MediaListItem
                  key={item.fileId}
                  item={item}
                  icon={getFileIcon(item.mimeType)}
                  onDownload={() => handleDownload(item)}
                  isDownloading={downloadLoading === item.fileId}
                />
              ))}
            </div>
          )}
        </div>
      </Sheet>

      {/* Full-size image lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl bg-bg-deep/95 backdrop-blur-xl border-border-subtle p-2">
          <DialogTitle className="sr-only">Full size image</DialogTitle>
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt="Full size preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Lazy thumbnail — fetches signed URL on mount
function MediaThumbnail({ s3Key, filename }: { s3Key: string; filename: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/uploads/download?key=${encodeURIComponent(s3Key)}`)
      .then((r) => r.json())
      .then(({ url }) => setUrl(url))
      .catch(console.error)
  }, [s3Key])

  if (!url) {
    return (
      <div className="w-full h-full bg-bg-muted flex items-center justify-center">
        <Loader2 className="size-4 animate-spin text-text-low" />
      </div>
    )
  }

  return <img src={url} alt={filename} className="w-full h-full object-cover" />
}

// Reusable list item for files / audio / videos
function MediaListItem({
  item,
  icon,
  onDownload,
  isDownloading,
}: {
  item: MediaItem
  icon: React.ReactNode
  onDownload: () => void
  isDownloading: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-muted/50 transition-colors">
      <div className="size-10 rounded-xl bg-bg-elevated flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-high truncate">{item.filename}</p>
        <p className="text-xs text-text-low">
          {formatBytes(item.sizeBytes)} · {item.senderName ?? "Unknown"}
        </p>
      </div>
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="size-8 rounded-full flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-elevated transition-all active:scale-95"
      >
        {isDownloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </button>
    </div>
  )
}
