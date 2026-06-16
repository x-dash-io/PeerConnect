"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, MessageSquare, Loader2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface SearchResult {
  id: string
  conversationId: string
  senderId: string
  content: string | null
  type: string
  createdAt: string
  senderName: string | null
  senderImage: string | null
}

export function MessageSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(q)}&limit=10`)
      const data = await res.json()
      setResults(data.messages || [])
      setSelectedIndex(0)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const handleSelect = (result: SearchResult) => {
    onClose()
    router.push(`/dashboard/${result.conversationId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-surface shadow-2xl overflow-hidden surface-glow">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
          <Search className="size-4 text-text-low shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-sm text-text-high outline-none placeholder:text-text-low"
          />
          {isSearching && <Loader2 className="size-4 animate-spin text-text-low" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 text-[10px] text-text-low">
            ESC
          </kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((result, i) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  i === selectedIndex ? "bg-brand-subtle" : "hover:bg-bg-muted",
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-muted text-text-low">
                  <MessageSquare className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-text-high">
                      {result.senderName}
                    </span>
                    <span className="shrink-0 text-[10px] text-text-low tabular-nums">
                      {format(new Date(result.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-text-medium">{result.content}</p>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-text-low" />
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !isSearching && results.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center px-4">
            <p className="text-sm text-text-medium">No messages found</p>
            <p className="text-xs text-text-low mt-1">Try different keywords</p>
          </div>
        )}
      </div>
    </div>
  )
}
