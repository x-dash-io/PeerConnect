"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Sparkles, Loader2, Eye, X, ChevronDown, ChevronUp } from "lucide-react"
import type { FileAttachment } from "@/types"
import { cn, formatBytes } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
          <embed src={downloadUrl} className="w-full h-[80vh] rounded-lg" type="application/pdf" />,
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
            className="prose prose-sm dark:prose-invert max-w-none p-4 max-h-[80vh] overflow-y-auto"
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
          <div className="max-h-[80vh] overflow-y-auto p-2 space-y-4">
            {sheets.map((s) => (
              <div key={s.name}>
                <div className="text-sm font-semibold text-white/70 mb-1 sticky top-0 bg-black/90 py-1">
                  {s.name}
                </div>
                <div
                  className="text-xs [&_table]:w-full [&_td]:border [&_td]:border-white/10 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-white/10 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-white/5 [&_th]:font-semibold"
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
          <pre className="text-sm text-white/80 p-4 max-h-[80vh] overflow-y-auto whitespace-pre-wrap font-mono">
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
      if (!res.ok) throw new Error("Summarization failed")
      const data = await res.json()
      setSummary(data.summary)
      setSummaryOpen(true)
    } catch (err) {
      console.error("[Summarize] Error:", err)
    } finally {
      setSummaryLoading(false)
    }
  }, [file, messageId, summary])

  return (
    <>
      {/* Inline card */}
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

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-5xl bg-black/95 border-border-subtle p-1 sm:p-2 max-h-[90vh] overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{file.filename}</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 shrink-0">
            <span className="text-sm text-white/80 truncate">{file.filename}</span>
            <button
              onClick={() => setPreviewOpen(false)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {previewState === "loading" && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-8 text-white/60 animate-spin" />
              </div>
            )}
            {previewState === "error" && (
              <div className="flex items-center justify-center h-64 text-white/50 text-sm">
                Failed to load preview
              </div>
            )}
            {previewState === "ready" && previewContent}
          </div>

          {/* Summary */}
          {summary && (
            <div className="border-t border-white/10 shrink-0">
              <button
                onClick={() => setSummaryOpen(!summaryOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white transition-colors"
              >
                <Sparkles className="size-3.5 text-yellow-400" />
                AI Summary
                {summaryOpen ? (
                  <ChevronUp className="size-3.5 ml-auto" />
                ) : (
                  <ChevronDown className="size-3.5 ml-auto" />
                )}
              </button>
              {summaryOpen && (
                <div className="px-3 pb-3 text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
          )}

          {/* Summarize button in dialog */}
          {!summary && (
            <div className="border-t border-white/10 shrink-0">
              <button
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/70 hover:text-white transition-colors disabled:opacity-40"
              >
                {summaryLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-yellow-400" />
                )}
                {summaryLoading ? "Summarizing..." : "Summarize with AI"}
              </button>
            </div>
          )}

          {/* Footer with file info */}
          <div className="border-t border-white/10 px-3 py-2 text-[10px] text-white/40 shrink-0">
            {file.filename} &middot; {formatBytes(file.sizeBytes)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
