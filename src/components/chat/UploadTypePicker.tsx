"use client"

import { useRef, ChangeEvent } from "react"
import { FileText, Image, Video, Music, FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UPLOAD_MAX_SIZE_BYTES } from "@/lib/constants"
import { toast } from "sonner"

interface UploadTypePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileSelect: (file: File) => void
}

interface FileCategory {
  id: string
  label: string
  icon: typeof FileText
  accept: string
  color: string
  description: string
}

const CATEGORIES: FileCategory[] = [
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp",
    color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
    description: "PDF, Word, Excel, PowerPoint, text files",
  },
  {
    id: "photos",
    label: "Photos",
    icon: Image,
    accept: "image/*",
    color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    description: "JPEG, PNG, GIF, WebP",
  },
  {
    id: "videos",
    label: "Videos",
    icon: Video,
    accept: "video/*",
    color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
    description: "MP4, WebM, OGG",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Music,
    accept: "audio/*",
    color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
    description: "MP3, WAV, OGG, WebM",
  },
  {
    id: "any",
    label: "Any file",
    icon: FolderOpen,
    accept: "*/*",
    color: "text-neutral-500 bg-neutral-100 dark:bg-neutral-800",
    description: "All file types",
  },
]

export function UploadTypePicker({ open, onOpenChange, onFileSelect }: UploadTypePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCategoryClick = (category: FileCategory) => {
    onOpenChange(false)
    // Open the native file picker on next tick after dialog closes
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.accept = category.accept
        fileInputRef.current.click()
      }
    }, 0)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      toast.error("File is too large. Maximum size is 200MB.")
      return
    }

    onFileSelect(file)
    e.target.value = ""
  }

  return (
    <>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogTitle>Send a file</DialogTitle>
          <DialogDescription>Choose the type of file you want to send</DialogDescription>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle p-4 transition-all hover:border-brand/50 hover:bg-brand-subtle/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
                >
                  <div className={`rounded-lg p-2.5 ${category.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <span className="text-sm font-medium text-text-high">{category.label}</span>
                  <span className="text-[11px] text-text-low leading-tight text-center">
                    {category.description}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
