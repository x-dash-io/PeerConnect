"use client"

import { useRef, ChangeEvent } from "react"
import { Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UPLOAD_MAX_SIZE_BYTES } from "@/lib/constants"
import { toast } from "sonner"

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function FileUploadButton({ onFileSelect, disabled }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      toast.error("File is too large. Maximum size is 200MB.")
      return
    }

    onFileSelect(file)

    // Reset input so the same file can be selected again if needed
    e.target.value = ""
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={handleButtonClick}
        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0 flex items-center justify-center size-9"
      >
        <Paperclip className="size-5" />
      </button>
    </>
  )
}
