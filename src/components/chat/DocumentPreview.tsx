"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

const A4_PREVIEW_HEIGHT = 1123

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
  const [docPageInfo, setDocPageInfo] = useState({ current: 1, total: 1 })
  const docPreviewRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch(`/api/uploads/download?key=${encodeURIComponent(file.s3Key)}`)
      .then((r) => r.json())
      .then(({ url }) => setDownloadUrl(url))
      .catch(console.error)
  }, [file.s3Key])

  const updateDocPageInfo = useCallback(() => {
    const preview = docPreviewRef.current
    if (!preview) return

    const total = Math.max(1, Math.ceil(preview.scrollHeight / A4_PREVIEW_HEIGHT))
    const current = Math.min(
      total,
      Math.max(1, Math.floor(preview.scrollTop / A4_PREVIEW_HEIGHT) + 1),
    )
    setDocPageInfo((previous) =>
      previous.current === current && previous.total === total ? previous : { current, total },
    )
  }, [])

  useEffect(() => {
    if (!previewOpen || previewState !== "ready" || docType !== "docx") return

    const frame = window.requestAnimationFrame(updateDocPageInfo)
    return () => window.cancelAnimationFrame(frame)
  }, [docType, previewOpen, previewState, previewContent, updateDocPageInfo])

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
        setDocPageInfo({ current: 1, total: 1 })
        setPreviewContent(
          <div
            ref={docPreviewRef}
            onScroll={updateDocPageInfo}
            className="h-full overflow-auto bg-[#eef0f3] px-4 py-6 dark:bg-zinc-950 sm:px-8 sm:py-10"
          >
            <div
              className="mx-auto min-h-[1123px] w-[794px] max-w-none overflow-visible bg-white px-[72px] py-[72px] font-serif text-[12pt] leading-[1.5] text-zinc-950 shadow-md ring-1 ring-black/10 [&_*]:box-border [&_a]:text-brand [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-[22pt] [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-[18pt] [&_h2]:font-bold [&_h2]:leading-tight [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[15pt] [&_h3]:font-bold [&_h3]:leading-snug [&_img]:my-3 [&_img]:inline-block [&_img]:h-auto [&_img]:max-h-[820px] [&_img]:max-w-full [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-8 [&_p]:my-2 [&_p]:min-h-[1.5em] [&_strong]:font-bold [&_table]:my-4 [&_table]:w-auto [&_table]:max-w-none [&_table]:border-collapse [&_table]:text-left [&_table]:text-[10.5pt] [&_table]:leading-snug [&_td]:border [&_td]:border-zinc-400 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:text-zinc-950 [&_th]:border [&_th]:border-zinc-400 [&_th]:bg-zinc-100 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-8"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>,
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
  }, [downloadUrl, docType, previewState, updateDocPageInfo])

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
        } catch {
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
          className="h-[92vh] max-h-[92vh] w-[calc(100vw-12px)] max-w-[1400px] sm:max-w-[1400px] gap-0 overflow-hidden border-border-subtle bg-bg-surface p-0 flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{file.filename}</DialogTitle>

          {/* Header - improved contrast and styling */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="size-4 text-brand shrink-0" />
              <span className="text-sm font-medium text-text-high truncate">{file.filename}</span>
              {docType === "docx" && previewState === "ready" && (
                <span className="hidden shrink-0 rounded-md border border-border-subtle bg-bg-muted px-2 py-1 text-[11px] font-medium text-text-medium sm:inline-flex">
                  Page {docPageInfo.current} of {docPageInfo.total}
                </span>
              )}
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
          <div className="min-h-0 flex-1 overflow-hidden bg-bg-deep">
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
