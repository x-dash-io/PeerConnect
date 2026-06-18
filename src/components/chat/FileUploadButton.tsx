"use client"

import { useState } from "react"
import { Paperclip } from "lucide-react"
import { UploadTypePicker } from "./UploadTypePicker"

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

export function FileUploadButton({ onFileSelect, disabled }: FileUploadButtonProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setPickerOpen(true)}
        className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors shrink-0 flex items-center justify-center size-9"
      >
        <Paperclip className="size-5" />
      </button>
      <UploadTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onFileSelect={onFileSelect}
      />
    </>
  )
}
