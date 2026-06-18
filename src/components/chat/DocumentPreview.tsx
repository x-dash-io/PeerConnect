"use client"

import { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Sparkles,
  Loader2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react"
import type { FileAttachment } from "@/types"
import { cn, formatBytes } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import mammoth from "mammoth"

interface DocumentPreviewProps {
  file: FileAttachment
  isSelf: boolean
  messageId: string
}

type DocType = "pdf" | "docx" | "xlsx" | "text" | "other"
type PreviewState = "idle" | "loading" | "ready" | "error"

function getDocType(mimeType: string, filename: string): DocType {
  if (mimeType === "application/pdf") return "pdf"
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  )
    return "docx"
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  )
    return "xlsx"
  if (mimeType.startsWith("text/")) return "text"
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "md" || ext === "csv" || ext === "json" || ext === "txt" || ext === "log")
    return "text"
  return "other"
}

export function DocumentPreview({ file, isSelf, messageId }: DocumentPreviewProps) {
  const docType = getDocType(file.mimeType, file.filename)
  if (docType === "other") return null

  return <DocumentInner file={file} isSelf={isSelf} messageId={messageId} docType={docType} />
}

function DocumentInner({
  file,
  isSelf,
  messageId,
  docType,
}: DocumentPreviewProps & { docType: DocType }) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewState, setPreviewState] = useState<PreviewState>("idle")
  const [previewContent, setPreviewContent] = useState<React.ReactNode>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`)
      .then((r) => r.json())
      .then(({ url }) => setDownloadUrl(url))
      .catch(console.error)
  }, [file.s3Key])

  const handleOpenPreview = useCallback(async () => {
    setPreviewOpen(true)
    if (previewState !== "idle") return
    setPreviewState("loading")
    try {
      if (!downloadUrl) throw new Error("No download URL")

      if (docType === "pdf") {
        setPreviewContent(
          <embed
            src={downloadUrl}
            className="w-full h-full rounded-lg border border-border-subtle"
            type="application/pdf"
          />,
        )
        setPreviewState("ready")
        return
      }

      const res = await fetch(downloadUrl)
      if (!res.ok) throw new Error("Failed to fetch file")
      const blob = await res.blob()

      if (docType === "docx") {
        const arrayBuf = await blob.arrayBuffer()
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: arrayBuf })
        setPreviewContent(
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-4 max-h-[80vh] overflow-y-auto text-text-high dark:text-text-high"
            dangerouslySetInnerHTML={{ __html: html }}
          />,
        )
        setPreviewState("ready")
      } else if (docType === "xlsx") {
        const arrayBuf = await blob.arrayBuffer()
        const workbook = XLSX.read(arrayBuf, { type: "array" })
        const sheets = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name]
          const html = XLSX.utils.sheet_to_html(sheet)
          return { name, html }
        })
        setPreviewContent(
          <div className="max-h-[80vh] overflow-y-auto p-4 space-y-4">
            {sheets.map((s) => (
              <div key={s.name}>
                <div className="text-sm font-semibold text-text-medium mb-2 sticky top-0 bg-bg-surface/95 backdrop-blur-sm py-2 px-1 rounded border-b border-border-subtle">
                  {s.name}
                </div>
                <div
                  className="text-xs text-text-high dark:text-text-high [&_table]:w-full [&_td]:border [&_td]:border-border-subtle [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border-subtle [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-bg-muted [&_th]:font-semibold [&_th]:text-text-high"
                  dangerouslySetInnerHTML={{ __html: s.html }}
                />
              </div>
            ))}
          </div>,
        )
        setPreviewState("ready")
      } else if (docType === "text") {
        const text = await blob.text()
        setPreviewContent(
          <pre className="text-sm text-text-medium dark:text-text-medium p-4 max-h-[80vh] overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
            {text}
          </pre>,
        )
        setPreviewState("ready")
      }
    } catch {
      setPreviewState("error")
    }
  }, [downloadUrl, docType, previewState])

  const handleSummarize = useCallback(async () => {
    if (summary) {
      setSummaryOpen(true)
      return
    }
    setSummaryLoading(true)
    try {
      const res = await fetch("/api/ai/summarize-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key: file.s3Key,
          filename: file.filename,
          mimeType: file.mimeType,
          messageId,
        }),
      })

      // Try to get the error message from the response
      if (!res.ok) {
        let errorMessage = "Summarization failed"
        try {
          const errorData = await res.json()
          if (errorData.error && typeof errorData.error === "string") {
            errorMessage = errorData.error
          }
        } catch (_parseError) {
          // If parsing fails, try to get the raw text
          try {
            const text = await res.text()
            if (text) errorMessage = text
          } catch {
            /* ignore */
          }
        }
        throw new Error(`${errorMessage} (Status: ${res.status})`)
      }

      const data = await res.json()
      setSummary(data.summary)
      setSummaryOpen(true)
      toast.success("Document summarized successfully", {
        description: `Summary generated for ${file.filename}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred"
      console.error("[Summarize] Error:", err)
      toast.error("Summarization failed", {
        description: message,
      })
    } finally {
      setSummaryLoading(false)
    }
  }, [file, messageId, summary])

  return (
    <>
      {/* Inline card - improved with design tokens */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl p-3 min-w-[220px] max-w-[280px]",
          isSelf ? "bg-white/10 border border-white/20" : "bg-bg-muted border border-border-subtle",
        )}
      >
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center shrink-0",
            isSelf ? "bg-white/15 text-white" : "bg-brand/10 text-brand",
          )}
        >
          <FileText className="size-5" />
        </div>

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

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleOpenPreview}
              className={cn(
                "flex items-center gap-1 text-[11px] font-semibold transition-colors",
                isSelf ? "text-white/80 hover:text-white" : "text-brand hover:text-brand-hover",
              )}
            >
              <Eye className="size-3" />
              Preview
            </button>

            <button
              onClick={handleSummarize}
              disabled={summaryLoading}
              className={cn(
                "flex items-center gap-1 text-[11px] font-semibold transition-colors",
                isSelf ? "text-white/80 hover:text-white" : "text-brand hover:text-brand-hover",
              )}
            >
              {summaryLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {summaryLoading ? "Summarizing..." : summary ? "View Summary" : "Summarize"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview dialog - redesigned with design tokens */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-5xl bg-bg-surface border-border-subtle p-1 sm:p-2 max-h-[90vh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{file.filename}</DialogTitle>

          {/* Header - improved contrast and styling */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 text-brand shrink-0" />
              <span className="text-sm font-medium text-text-high truncate">{file.filename}</span>
            </div>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-text-low hover:text-text-high transition-colors cursor-pointer p-1 rounded-md hover:bg-bg-muted shrink-0"
              aria-label="Close preview"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content - improved visibility */}
          <div className="flex-1 overflow-hidden bg-bg-deep rounded-lg m-1">
            {previewState === "loading" && (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-8 text-brand animate-spin" />
                  <p className="text-sm text-text-medium">Loading preview...</p>
                </div>
              </div>
            )}
            {previewState === "error" && (
              <div className="flex flex-col items-center justify-center h-64 text-text-medium text-sm gap-3">
                <AlertCircle className="size-8 text-danger" />
                <div className="text-center">
                  <p className="font-medium text-text-high">Failed to load preview</p>
                  <p className="text-text-low mt-1">Could not load the document content</p>
                </div>
                <button
                  onClick={handleOpenPreview}
                  className="text-brand hover:text-brand-hover text-sm font-medium mt-2 flex items-center gap-1"
                >
                  Retry
                </button>
              </div>
            )}
            {previewState === "ready" && previewContent}
          </div>

          {/* Summary section - improved styling */}
          {summary && (
            <div className="border-t border-border-subtle shrink-0 bg-bg-surface">
              <button
                onClick={() => setSummaryOpen(!summaryOpen)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-medium hover:text-text-high transition-colors"
              >
                <Sparkles className="size-4 text-brand shrink-0" />
                <span className="font-medium">AI Summary</span>
                {summaryOpen ? (
                  <ChevronUp className="size-4 ml-auto text-text-low" />
                ) : (
                  <ChevronDown className="size-4 ml-auto text-text-low" />
                )}
              </button>
              {summaryOpen && (
                <div className="px-4 pb-4 text-sm text-text-medium leading-relaxed whitespace-pre-wrap bg-bg-deep/50 mx-4 rounded-lg p-4 mb-4">
                  {summary}
                </div>
              )}
            </div>
          )}

          {/* Summarize button in dialog */}
          {!summary && (
            <div className="border-t border-border-subtle shrink-0">
              <button
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-text-medium hover:text-text-high transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {summaryLoading ? (
                  <Loader2 className="size-4 animate-spin text-brand" />
                ) : (
                  <Sparkles className="size-4 text-brand" />
                )}
                <span className="font-medium">
                  {summaryLoading ? "Summarizing..." : "Summarize with AI"}
                </span>
                {summaryLoading && (
                  <span className="text-text-low ml-auto text-xs">This may take a moment</span>
                )}
              </button>
            </div>
          )}

          {/* Footer with file info - improved styling */}
          <div className="border-t border-border-subtle px-4 py-2.5 text-[11px] text-text-low shrink-0 flex items-center justify-between bg-bg-muted/50">
            <span className="truncate">{file.filename}</span>
            <span className="shrink-0">{formatBytes(file.sizeBytes)}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
